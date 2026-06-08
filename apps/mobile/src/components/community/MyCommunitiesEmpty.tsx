import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface MyCommunitiesEmptyProps {
  onDiscover: () => void;
}

export const MyCommunitiesEmpty: React.FC<MyCommunitiesEmptyProps> = ({ onDiscover }) => {
  return (
    <View style={styles.container}>
      <Icon name="users" size={48} color="rgba(124, 58, 237, 0.3)" />
      <Text style={styles.title}>No communities yet</Text>
      <Text style={styles.subtitle}>Discover communities for you and your pets</Text>
      <TouchableOpacity style={styles.discoverBtn} onPress={onDiscover} activeOpacity={0.8}>
        <Text style={styles.discoverBtnText}>Browse communities</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 6,
    textAlign: 'center',
  },
  discoverBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  discoverBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
});
