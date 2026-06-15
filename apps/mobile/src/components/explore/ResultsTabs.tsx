import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SearchResults } from '../../types';
import { PostGrid } from './PostGrid';
import { EventsList } from './EventsList';
import { CommunitiesList } from './CommunitiesList';
import { UsersList } from './UsersList';
import { EmptySearchState } from './EmptySearchState';

type TabType = 'all' | 'posts' | 'events' | 'communities' | 'people';

interface ResultsTabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
  results: SearchResults | null;
  noResultsSuggestion: string | null;
}

export const ResultsTabs: React.FC<ResultsTabsProps> = ({
  activeTab,
  onChange,
  results,
  noResultsSuggestion,
}) => {
  if (!results) return null;

  const tabs: { key: TabType; label: string; count: number }[] = [
    {
      key: 'all',
      label: 'All',
      count:
        results.posts.length +
        results.events.length +
        results.communities.length +
        results.users.length,
    },
    { key: 'posts', label: 'Posts', count: results.posts.length },
    { key: 'events', label: 'Events', count: results.events.length },
    { key: 'communities', label: 'Communities', count: results.communities.length },
    { key: 'people', label: 'People', count: results.users.length },
  ];

  const totalResults = tabs[0].count;

  const renderContent = () => {
    if (totalResults === 0) {
      return <EmptySearchState suggestion={noResultsSuggestion} />;
    }

    switch (activeTab) {
      case 'all':
        return (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.allContent}
            showsVerticalScrollIndicator={false}
          >
            {results.posts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posts</Text>
                <PostGrid posts={results.posts.slice(0, 6)} />
                {results.posts.length > 6 && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => onChange('posts')}
                  >
                    <Text style={styles.seeAllText}>See all {results.posts.length} posts</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {results.events.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Events</Text>
                <EventsList events={results.events.slice(0, 3)} />
                {results.events.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => onChange('events')}
                  >
                    <Text style={styles.seeAllText}>See all {results.events.length} events</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {results.communities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Communities</Text>
                <CommunitiesList communities={results.communities.slice(0, 3)} />
                {results.communities.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => onChange('communities')}
                  >
                    <Text style={styles.seeAllText}>
                      See all {results.communities.length} communities
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {results.users.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>People</Text>
                <UsersList users={results.users.slice(0, 3)} />
                {results.users.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => onChange('people')}
                  >
                    <Text style={styles.seeAllText}>See all {results.users.length} people</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        );

      case 'posts':
        return results.posts.length > 0 ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.allContent}>
            <PostGrid posts={results.posts} />
          </ScrollView>
        ) : (
          <EmptySearchState suggestion="Try a different search" />
        );

      case 'events':
        return results.events.length > 0 ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.allContent}>
            <EventsList events={results.events} />
          </ScrollView>
        ) : (
          <EmptySearchState suggestion="No events found. Try searching for communities instead" />
        );

      case 'communities':
        return results.communities.length > 0 ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.allContent}>
            <CommunitiesList communities={results.communities} />
          </ScrollView>
        ) : (
          <EmptySearchState suggestion="No communities found. Browse trending communities" />
        );

      case 'people':
        return results.users.length > 0 ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.allContent}>
            <UsersList users={results.users} />
          </ScrollView>
        ) : (
          <EmptySearchState suggestion="No people found. Try searching nearby" />
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Tabs Header */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsScroll}
        >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.badge, activeTab === tab.key && styles.badgeActive]}>
                <Text
                  style={[styles.badgeText, activeTab === tab.key && styles.badgeTextActive]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 60,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  allContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#F9FAFB',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  seeAllButton: {
    marginHorizontal: 16,
    marginTop: 12,
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
