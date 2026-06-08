import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SPACING } from '../../constants';

const EmptyFeed: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Icon name="paw-outline" size={64} color="rgba(124,58,237,0.4)" />
      <Text style={styles.title}>Your feed is empty</Text>
      <Text style={styles.subtitle}>
        Follow other pet owners to see their posts here
      </Text>

      <TouchableOpacity
        style={styles.discoverBtn}
        onPress={() => navigation.navigate('Explore')}
      >
        <Text style={styles.discoverBtnText}>Discover people</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.createBtnText}>Or share your first post</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    maxWidth: 260,
  },
  discoverBtn: {
    marginTop: SPACING.xl,
    backgroundColor: '#7C3AED',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  discoverBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createBtn: {
    marginTop: SPACING.md,
  },
  createBtnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default EmptyFeed;
