import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

interface OnlineContact {
  _id: string;
  username: string;
  name?: string;
  avatar: string;
}

interface OnlineStripProps {
  contacts: OnlineContact[];
}

export const OnlineStrip: React.FC<OnlineStripProps> = ({ contacts }) => {
  const navigation = useNavigation();

  if (contacts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.onlineLabel}>Online now</Text>
        <Text style={styles.noOnline}>No one online right now</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.onlineLabel}>Online now</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {contacts.map((contact) => (
          <TouchableOpacity
            key={contact._id}
            style={styles.onlineItem}
            onPress={() =>
              (navigation as any).navigate('ChatRoom', {
                recipientId: contact._id,
                recipientName: contact.username,
                recipientAvatar: contact.avatar,
                isOnline: true,
              })
            }
          >
            <View style={styles.onlineAvatarWrapper}>
              <FastImage source={{ uri: contact.avatar }} style={styles.onlineAvatar} />
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.onlineUsername} numberOfLines={1}>
              @{contact.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  onlineLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  onlineItem: {
    alignItems: 'center',
    width: 64,
  },
  onlineAvatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  onlineAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1D9E75',
    borderWidth: 2,
    borderColor: '#0D0D1A',
  },
  onlineUsername: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    maxWidth: 64,
  },
  noOnline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.2)',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});
