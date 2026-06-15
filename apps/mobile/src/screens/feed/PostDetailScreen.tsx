import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FeedStackParamList } from '../../types';

type PostDetailRouteProp = RouteProp<FeedStackParamList, 'PostDetail'>;
type PostDetailNavProp = NativeStackNavigationProp<FeedStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<PostDetailNavProp>();
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = (route.params ?? {}) as any;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Post Detail</Text>
      <Text style={styles.subtitle}>Post ID: {postId}</Text>
      {/* TODO: Implement full post detail view */}
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

export default PostDetailScreen;
