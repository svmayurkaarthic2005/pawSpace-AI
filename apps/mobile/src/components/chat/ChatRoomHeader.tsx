import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { formatRelativeTime } from '../../utils/formatTime';

interface ChatRoomHeaderProps {
  recipient: {
    _id: string;
    name?: string;
    username: string;
    avatar: string;
    lastSeen?: string;
  };
  isOnline: boolean;
  onAIPress: () => void;
  onMorePress: () => void;
}

export const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  recipient,
  isOnline,
  onAIPress,
  onMorePress,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" color="#fff" size={22} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerSection}
        onPress={() =>
          (navigation as any).navigate('UserProfile', { userId: recipient._id })
        }
      >
        <FastImage source={{ uri: recipient.avatar }} style={styles.avatar} />
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {recipient.name || recipient.username}
          </Text>
          <Text style={[styles.status, isOnline && styles.statusOnline]}>
            {isOnline
              ? 'Online'
              : `Last seen ${recipient.lastSeen ? formatRelativeTime(recipient.lastSeen) : 'recently'}`}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconBtn} onPress={onAIPress}>
          <Text style={styles.sparkleIcon}>✦</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="video" color="rgba(255,255,255,0.6)" size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onMorePress}>
          <Icon name="more-horizontal" color="rgba(255,255,255,0.6)" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#0D0D1A',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  status: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  statusOnline: {
    color: '#1D9E75',
  },
  rightIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    fontSize: 18,
    color: '#7C3AED',
  },
});
