import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../types';

type CommunityDetailRouteProp = RouteProp<ExploreStackParamList, 'CommunityDetail'>;
type CommunityDetailNavProp = NativeStackNavigationProp<ExploreStackParamList, 'CommunityDetail'>;

const CommunityDetailScreen: React.FC = () => {
  const navigation = useNavigation<CommunityDetailNavProp>();
  const route = useRoute<CommunityDetailRouteProp>();
  const { communityId } = (route.params ?? {}) as any;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>Community ID: {communityId}</Text>
      {/* TODO: Implement full community detail view */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', padding: 20 },
  back: { marginTop: 60, marginBottom: 20 },
  backText: { color: '#7C3AED', fontSize: 16 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#9CA3AF', fontSize: 14 },
});

export default CommunityDetailScreen;
