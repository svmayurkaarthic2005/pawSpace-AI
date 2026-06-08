import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { ExploreData, ExploreStackParamList } from '../../types';
import { searchService } from '../../services/search.service';
import { PostGrid } from './PostGrid';
import { CommunitiesList } from './CommunitiesList';
import { UsersList } from './UsersList';

type ExploreNavigationProp = NativeStackNavigationProp<ExploreStackParamList>;

export const ExploreContent: React.FC = () => {
  const navigation = useNavigation<ExploreNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExploreData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    loadExploreData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadExploreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const exploreData = await searchService.getTrending();
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(exploreData);
      }
    } catch (err) {
      console.error('Failed to load explore data:', err);
      if (isMountedRef.current) {
        setError('Failed to load trending content');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleHashtagPress = (tag: string) => {
    navigation.navigate('HashtagFeed', { hashtag: tag });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Icon name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadExploreData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Trending Hashtags */}
      {data.hashtags.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="trending-up" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Trending Hashtags</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hashtagsContainer}
          >
            {data.hashtags.map((hashtag) => (
              <TouchableOpacity
                key={hashtag.tag}
                style={[styles.hashtagCard, hashtag.isHot && styles.hashtagHot]}
                onPress={() => handleHashtagPress(hashtag.tag)}
                activeOpacity={0.7}
              >
                {hashtag.isHot && (
                  <View style={styles.hotBadge}>
                    <Icon name="flame" size={14} color="#EF4444" />
                  </View>
                )}
                <Text style={styles.hashtagText}>#{hashtag.tag}</Text>
                <Text style={styles.hashtagCount}>{hashtag.postCount} posts</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Trending Posts */}
      {data.posts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="flame" size={20} color="#EC4899" />
            <Text style={styles.sectionTitle}>Trending Posts</Text>
          </View>
          <PostGrid posts={data.posts.slice(0, 6)} />
          {data.posts.length > 6 && (
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all trending posts</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Recommended Communities */}
      {data.communities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="people" size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Communities for You</Text>
          </View>
          <CommunitiesList communities={data.communities.slice(0, 3)} />
          {data.communities.length > 3 && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Communities')}
            >
              <Text style={styles.seeAllText}>Browse all communities</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Nearby Pet Owners */}
      {data.nearbyUsers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="navigate" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Nearby Pet Owners</Text>
          </View>
          <UsersList users={data.nearbyUsers} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#F9FAFB',
    marginLeft: 8,
  },
  hashtagsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  hashtagCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minWidth: 140,
    position: 'relative',
  },
  hashtagHot: {
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  hashtagText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  hashtagCount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  seeAllButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#7C3AED',
  },
});
