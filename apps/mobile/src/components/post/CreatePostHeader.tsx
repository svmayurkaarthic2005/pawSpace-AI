import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface CreatePostHeaderProps {
  onCancel: () => void;
  onShare: () => void;
  disabled: boolean;
  isUploading: boolean;
}

const CreatePostHeader: React.FC<CreatePostHeaderProps> = ({
  onCancel,
  onShare,
  disabled,
  isUploading,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel} disabled={isUploading}>
        <Text style={[styles.cancelText, isUploading && styles.disabledText]}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.title}>New post</Text>

      <TouchableOpacity
        onPress={onShare}
        disabled={disabled}
        style={[styles.shareButton, disabled && styles.disabledButton]}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[styles.shareText, disabled && styles.disabledShareText]}>Share</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cancelText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  disabledText: {
    opacity: 0.4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
  },
  disabledButton: {
    backgroundColor: 'rgba(124,58,237,0.3)',
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledShareText: {
    color: 'rgba(255,255,255,0.5)',
  },
});

export default CreatePostHeader;
