import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { socketService } from '../../services/socket.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IncomingCallParams = {
  channelName: string;
  fromUserId: string;
  callerName: string;
  callerAvatar?: string;
};

type RootParamList = { IncomingCall: IncomingCallParams; VideoCall: VideoCallParams };
type VideoCallParams = {
  channelName: string;
  remoteUserId: string;
  remoteUserName: string;
  remoteUserAvatar?: string;
  isCaller: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

const IncomingCallScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const route = useRoute<RouteProp<RootParamList, 'IncomingCall'>>();
  const { channelName, fromUserId, callerName, callerAvatar } = route.params;

  const [secondsLeft, setSecondsLeft] = useState(30);

  // Pulsing animation for the avatar ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Vibrate pattern
    Vibration.vibrate([0, 500, 500, 500], true);

    // Pulsing ring animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Auto-decline after 30 seconds
    const countdown = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      Vibration.cancel();
      clearInterval(countdown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAccept = () => {
    Vibration.cancel();
    socketService.acceptCall(channelName, fromUserId);
    navigation.replace('VideoCall', {
      channelName,
      remoteUserId: fromUserId,
      remoteUserName: callerName,
      remoteUserAvatar: callerAvatar,
      isCaller: false,
    });
  };

  const handleDecline = () => {
    Vibration.cancel();
    socketService.rejectCall(channelName, fromUserId, 'declined');
    navigation.goBack();
  };

  const avatarUri =
    callerAvatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=7C3AED&color=fff&size=200`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        {/* Top label */}
        <View style={styles.topSection}>
          <Text style={styles.callLabel}>Incoming Video Call</Text>
          <Text style={styles.timerText}>Auto-declining in {secondsLeft}s</Text>
        </View>

        {/* Caller info */}
        <View style={styles.callerSection}>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatarRingInner}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            </View>
          </Animated.View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerSub}>wants to video call</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsRow}>
          <View style={styles.btnColumn}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Icon name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>Decline</Text>
          </View>

          <View style={styles.btnColumn}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Icon name="videocam" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>Accept</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default IncomingCallScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 16,
  },
  callLabel: {
    fontSize: 16,
    color: '#A78BFA',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  callerSection: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarRingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#7C3AED',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  callerSub: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 48,
  },
  btnColumn: {
    alignItems: 'center',
    gap: 12,
  },
  declineBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  btnLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
