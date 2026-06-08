import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface AIBannerProps {
  onDismiss: () => void;
}

export const AIBanner: React.FC<AIBannerProps> = ({ onDismiss }) => {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerLeft}>
        <View style={styles.bannerIcon}>
          <Text style={styles.bannerIconText}>✦</Text>
        </View>
        <View>
          <Text style={styles.bannerTitle}>Get conversation starters</Text>
          <Text style={styles.bannerSub}>AI-powered icebreakers for your pets</Text>
        </View>
      </View>
      <View style={styles.bannerRight}>
        <Icon name="chevron-right" color="#A78BFA" size={18} />
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="x" color="rgba(255,255,255,0.3)" size={14} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconText: {
    fontSize: 18,
    color: '#A78BFA',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
