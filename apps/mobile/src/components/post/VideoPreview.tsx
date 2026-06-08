import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';

interface VideoPreviewProps {
  uri: string;
  style?: ViewStyle;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ uri, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Video
        source={{ uri }}
        style={styles.video}
        resizeMode="cover"
        paused
        muted
      />
      <View style={styles.overlay}>
        <Icon name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default VideoPreview;
