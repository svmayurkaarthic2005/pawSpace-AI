import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationSectionHeaderProps {
  title: 'New' | 'Today' | 'This week' | 'Earlier';
}

// ─── Component ────────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
  New: '#7C3AED',
  Today: 'rgba(255,255,255,0.5)',
  'This week': 'rgba(255,255,255,0.35)',
  Earlier: 'rgba(255,255,255,0.25)',
};

export const NotificationSectionHeader: React.FC<NotificationSectionHeaderProps> = ({ title }) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: SECTION_COLORS[title] }]}>{title}</Text>
      {title === 'New' && <View style={styles.newDot} />}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
});
