import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationsHeaderProps {
  onMarkAllRead: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({ onMarkAllRead }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Notifications</Text>
      <TouchableOpacity onPress={onMarkAllRead} style={styles.markAllBtn} activeOpacity={0.7}>
        <Text style={styles.markAllText}>Mark all read</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: -0.3,
  },
  markAllBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
});
