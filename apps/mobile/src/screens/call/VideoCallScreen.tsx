import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  UserOfflineReasonType,
} from 'react-native-agora';
import api from '../../services/api';
import { socketService } from '../../services/socket.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoCallParams = {
  channelName: string;
  remoteUserId: string;
  remoteUserName: string;
  remoteUserAvatar?: string;
  isCaller: boolean;
};

type RootParamList = { VideoCall: VideoCallParams };

const AGORA_APP_ID = process.env.AGORA_APP_ID ?? '';

// ─── Component ────────────────────────────────────────────────────────────────

const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootParamList, 'VideoCall'>>();
  const { channelName, remoteUserId, remoteUserName, remoteUserAvatar, isCaller } = route.params;

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [callEnded, setCallEnded] = useState(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(isCaller);

  const engineRef = useRef<IRtcEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLeftRef = useRef(false);

  // ─── Permissions ────────────────────────────────────────────────────────────

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted' &&
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted'
        );
      } catch {
        return false;
      }
    }
    return true; // iOS handled via Info.plist
  };

  // ─── Agora init & join ──────────────────────────────────────────────────────

  const joinChannel = useCallback(async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Permission Required', 'Camera and microphone access is needed for video calls.');
      navigation.goBack();
      return;
    }

    try {
      // Fetch token from backend
      const { data } = await api.post<{ data: { token: string | null; appId: string; uid: number } }>(
        '/agora/token',
        { channelName, uid: 0 }
      );
      const { token, appId, uid } = data.data;
      const resolvedAppId = appId || AGORA_APP_ID;

      if (!resolvedAppId) {
        Alert.alert('Config Error', 'Agora App ID is not configured.');
        navigation.goBack();
        return;
      }

      // Create engine
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({ appId: resolvedAppId });
      engine.enableVideo();
      engine.enableAudio();
      engine.startPreview();

      // Set up event listeners
      engine.addListener('onUserJoined', (connection, uid) => {
        console.log('[Agora] Remote user joined:', uid);
        setRemoteUid(uid);
        setIsConnected(true);
        // Start call duration timer
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      });

      engine.addListener('onUserOffline', (connection, uid, reason) => {
        console.log('[Agora] Remote user offline:', uid, reason);
        setRemoteUid(null);
        if (
          reason === UserOfflineReasonType.UserOfflineQuit ||
          reason === UserOfflineReasonType.UserOfflineDropped
        ) {
          handleCallEnd(false);
        }
      });

      engine.addListener('onLeaveChannel', () => {
        console.log('[Agora] Left channel');
      });

      // Join channel
      engine.joinChannel(token ?? '', channelName, uid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });

    } catch (err) {
      console.error('[Agora] Join error:', err);
      Alert.alert('Connection Error', 'Could not connect to video call.');
      navigation.goBack();
    }
  }, [channelName]);

  // ─── Socket: listen for call events from remote user ────────────────────────

  useEffect(() => {
    const handleCallEnded = (payload: { channelName: string; byUserId: string }) => {
      if (payload.channelName === channelName) {
        handleCallEnd(false);
      }
    };

    const handleCallAccepted = (payload: { channelName: string; byUserId: string }) => {
      if (payload.channelName === channelName) {
        setIsWaitingForAnswer(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    };

    const handleCallRejected = (payload: { channelName: string; byUserId: string; reason?: string }) => {
      if (payload.channelName === channelName) {
        Alert.alert('Call Declined', `${remoteUserName} declined the call.`);
        handleCallEnd(false);
      }
    };

    socketService.on('call:ended', handleCallEnded);
    socketService.on('call:accepted', handleCallAccepted);
    socketService.on('call:rejected', handleCallRejected);

    // If caller, start 30s timeout
    if (isCaller) {
      timeoutRef.current = setTimeout(() => {
        if (isWaitingForAnswer) {
          Alert.alert('No Answer', `${remoteUserName} did not answer.`);
          handleCallEnd(true);
        }
      }, 30000);
    }

    return () => {
      socketService.off('call:ended', handleCallEnded);
      socketService.off('call:accepted', handleCallAccepted);
      socketService.off('call:rejected', handleCallRejected);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [channelName, isCaller, isWaitingForAnswer, remoteUserName]);

  useEffect(() => {
    joinChannel();
    return () => {
      leaveAndCleanup();
    };
  }, []);

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  const leaveAndCleanup = useCallback(() => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (engineRef.current) {
      engineRef.current.leaveChannel();
      engineRef.current.release();
      engineRef.current = null;
    }
  }, []);

  const handleCallEnd = useCallback((emitEnd: boolean) => {
    if (emitEnd) {
      socketService.endCall(channelName, remoteUserId);
    }
    setCallEnded(true);
    leaveAndCleanup();

    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  }, [channelName, remoteUserId, navigation, leaveAndCleanup]);

  // ─── Controls ────────────────────────────────────────────────────────────────

  const toggleMute = () => {
    const next = !isMuted;
    engineRef.current?.muteLocalAudioStream(next);
    setIsMuted(next);
  };

  const toggleCamera = () => {
    const next = !isCameraOff;
    engineRef.current?.muteLocalVideoStream(next);
    setIsCameraOff(next);
  };

  const flipCamera = () => {
    engineRef.current?.switchCamera();
  };

  // ─── Format duration ────────────────────────────────────────────────────────

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const remoteAvatarUri =
    remoteUserAvatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUserName)}&background=7C3AED&color=fff&size=200`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Remote video (full screen) */}
      {remoteUid !== null && !isCameraOff && !isWaitingForAnswer ? (
        <RtcSurfaceView canvas={{ uid: remoteUid }} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.remoteVideoPlaceholder}>
          <Image source={{ uri: remoteAvatarUri }} style={styles.remoteAvatar} />
          <Text style={styles.remoteUserName}>{remoteUserName}</Text>
          <Text style={styles.connectionStatus}>
            {callEnded 
              ? 'Call Ended' 
              : isWaitingForAnswer 
                ? 'Ringing...' 
                : isConnected 
                  ? 'Connected' 
                  : 'Connecting...'}
          </Text>
        </View>
      )}

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <Text style={styles.topName}>{remoteUserName}</Text>
        {isConnected && (
          <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
        )}
      </SafeAreaView>

      {/* Local video PiP (top-right) */}
      {!isCameraOff && (
        <View style={styles.localPip}>
          <RtcSurfaceView canvas={{ uid: 0 }} style={styles.localVideo} />
        </View>
      )}

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
          <Icon name={isMuted ? 'mic-off' : 'mic'} size={26} color="#fff" />
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={toggleCamera}>
          <Icon name={isCameraOff ? 'videocam-off' : 'videocam'} size={26} color="#fff" />
          <Text style={styles.controlLabel}>{isCameraOff ? 'Start Cam' : 'Stop Cam'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={flipCamera}>
          <Icon name="camera-reverse-outline" size={26} color="#fff" />
          <Text style={styles.controlLabel}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endBtn} onPress={() => handleCallEnd(true)}>
          <Icon name="call" size={28} color="#fff" />
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VideoCallScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  remoteAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  remoteUserName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  connectionStatus: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingBottom: 12,
  },
  topName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  durationText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  localPip: {
    position: 'absolute',
    top: 90,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7C3AED',
    elevation: 6,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 28,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  controlLabel: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  endBtn: {
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#EF4444',
    borderRadius: 40,
    paddingHorizontal: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
});
