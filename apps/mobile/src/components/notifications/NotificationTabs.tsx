import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationTabsProps {
  activeTab: 'all' | 'activity';
  onSwitch: (tab: 'all' | 'activity') => void;
  tabIndicatorLeft: Animated.AnimatedInterpolation<number>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 2;

export const NotificationTabs: React.FC<NotificationTabsProps> = ({
  activeTab,
  onSwitch,
  tabIndicatorLeft,
}) => {
  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsRow}>
        {(['all', 'activity'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => onSwitch(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'all' ? 'All' : 'Activity'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Animated underline */}
      <View style={styles.indicatorTrack}>
        <Animated.View
          style={[
            styles.indicator,
            {
              width: TAB_WIDTH - 32,
              left: tabIndicatorLeft,
            },
          ]}
        />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabsContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '500',
  },
  indicatorTrack: {
    position: 'relative',
    height: 2,
    marginHorizontal: 16,
  },
  indicator: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#7C3AED',
    borderRadius: 1,
  },
});
