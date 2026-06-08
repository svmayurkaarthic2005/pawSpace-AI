import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface LocationDeniedBannerProps {
  blocked: boolean;
}

const LocationDeniedBanner: React.FC<LocationDeniedBannerProps> = ({ blocked }) => {
  return (
    <View style={styles.deniedBanner}>
      <Icon name="warning" color="#EF9F27" size={16} />
      <Text style={styles.deniedText}>
        {blocked ? 'Location blocked. Enable in Settings.' : 'Location needed to see nearby results.'}
      </Text>
      {blocked && (
        <TouchableOpacity onPress={() => Linking.openSettings()}>
          <Text style={styles.openSettings}>Open Settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deniedBanner: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(239,159,39,0.3)',
    padding: 12,
    zIndex: 90,
  },
  deniedText: {
    flex: 1,
    fontSize: 13,
    color: '#EF9F27',
  },
  openSettings: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF9F27',
  },
});

export default LocationDeniedBanner;
