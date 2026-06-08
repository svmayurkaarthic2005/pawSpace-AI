import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNotificationStore } from '../../store/notificationStore';
import { SPACING } from '../../constants';

const FeedHeader: React.FC = () => {
  const navigation = useNavigation<any>();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>PawSpace</Text>
      
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Icon name="notifications-outline" size={24} color="rgba(255,255,255,0.85)" />
          {/* Notification badge */}
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              {unreadCount <= 9 && (
                <Text style={styles.badgeText}>{unreadCount}</Text>
              )}
              {unreadCount > 9 && (
                <Text style={styles.badgeText}>9+</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('ChatList')}
        >
          <Icon name="chatbubble-outline" size={24} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0D0D1A',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});

export default FeedHeader;
