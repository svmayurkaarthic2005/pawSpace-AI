import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, useColorScheme, ScrollView,
  StatusBar, Keyboard,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { aiApi, SearchResults } from '../../services/ai.service';
import { FONT_SIZE, SPACING } from '../../constants';
import { timeAgo } from '../../utils';

type Props = NativeStackScreenProps<any, 'SmartSearch'>;

const EXAMPLE_QUERIES = [
  'Golden retriever meetups this weekend',
  'Cat grooming tips near me',
  'Dog-friendly hiking events',
  'Rabbit owners community',
  'Puppy training classes',
];

const SmartSearchScreen: React.FC<Props> = ({ navigation }) => {
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'events'>('all');
  const inputRef = useRef<TextInput>(null);

  const bg = isDark ? '#080810' : '#F8F8FF';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;
    Keyboard.dismiss();
    setIsSearching(true);
    setError(null);
    setResults(null);
    try {
      const data = await aiApi.search(q);
      setResults(data);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  // Filter chips from parsed query
  const filterChips = results?.parsedQuery.filters
    ? Object.entries(results.parsedQuery.filters)
        .filter(([, v]) => v && typeof v === 'string')
        .map(([k, v]) => `${k}: ${v as string}`)
    : [];

  const posts = (results?.posts ?? []) as Array<{
    _id: string; caption: string; author: { username: string; avatar?: string };
    media: Array<{ url: string }>; likesCount: number; createdAt: string;
  }>;

  const events = (results?.events ?? []) as Array<{
    _id: string; title: string; description: string;
    startDate: string; location: { name: string }; rsvpCount: number;
  }>;

  const renderPost = ({ item }: { item: typeof posts[0] }) => (
    <TouchableOpacity style={[styles.resultCard, { backgroundColor: cardBg }]}>
      {item.media[0] && (
        <FastImage
          source={{ uri: item.media[0].url, priority: FastImage.priority.normal }}
          style={styles.postThumb}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: textColor }]} numberOfLines={2}>
          {item.caption || 'No caption'}
        </Text>
        <Text style={[styles.resultMeta, { color: subColor }]}>
          @{item.author.username} · {timeAgo(item.createdAt)} · ❤️ {item.likesCount}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEvent = ({ item }: { item: typeof events[0] }) => (
    <TouchableOpacity style={[styles.resultCard, { backgroundColor: cardBg }]}>
      <View style={styles.eventIcon}>
        <Text style={styles.eventIconText}>📅</Text>
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: textColor }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.resultMeta, { color: subColor }]}>
          {item.location?.name} · {new Date(item.startDate).toLocaleDateString()} · {item.rsvpCount} going
        </Text>
        <Text style={[styles.resultDesc, { color: subColor }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const allResults = [
    ...posts.map((p) => ({ type: 'post' as const, data: p })),
    ...events.map((e) => ({ type: 'event' as const, data: e })),
  ];

  const filteredResults = activeTab === 'posts'
    ? allResults.filter((r) => r.type === 'post')
    : activeTab === 'events'
    ? allResults.filter((r) => r.type === 'event')
    : allResults;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: textColor }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Smart Search</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>✦ AI</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBar, { backgroundColor: cardBg }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Find golden retriever meetups this weekend..."
          placeholderTextColor={subColor}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => void handleSearch()}
          returnKeyType="search"
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={{ color: subColor, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Button */}
      <TouchableOpacity
        style={[styles.searchBtn, isSearching && styles.searchBtnDisabled]}
        onPress={() => void handleSearch()}
        disabled={isSearching || !query.trim()}
      >
        {isSearching ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.searchBtnText}>✦ Search with AI</Text>
        )}
      </TouchableOpacity>

      {/* Example queries */}
      {!results && !isSearching && (
        <View style={styles.examples}>
          <Text style={[styles.examplesLabel, { color: subColor }]}>Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {EXAMPLE_QUERIES.map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.exampleChip, { backgroundColor: cardBg }]}
                onPress={() => { setQuery(q); void handleSearch(q); }}
              >
                <Text style={[styles.exampleText, { color: textColor }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter chips from AI parse */}
      {filterChips.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {filterChips.map((chip) => (
            <View key={chip} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{chip}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Results tabs */}
      {results && (
        <View style={styles.tabRow}>
          {(['all', 'posts', 'events'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? `All (${allResults.length})` : tab === 'posts' ? `Posts (${posts.length})` : `Events (${events.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {results && (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => `${item.type}_${(item.data as { _id: string })._id}`}
          renderItem={({ item }) =>
            item.type === 'post'
              ? renderPost({ item: item.data as typeof posts[0] })
              : renderEvent({ item: item.data as typeof events[0] })
          }
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Text style={{ color: subColor, fontSize: FONT_SIZE.md }}>No results found</Text>
              <Text style={{ color: subColor, fontSize: FONT_SIZE.sm, marginTop: 4 }}>
                Try a different search query
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  backIcon: { fontSize: 22, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: FONT_SIZE.lg, fontWeight: '800' },
  aiBadge: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 12, paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  aiBadgeText: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.md, borderRadius: 16,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: SPACING.sm, marginBottom: SPACING.sm,
  },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.sm },
  searchBtn: {
    marginHorizontal: SPACING.md, backgroundColor: '#7C3AED',
    borderRadius: 14, paddingVertical: SPACING.sm,
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZE.sm },
  examples: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  examplesLabel: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  exampleChip: {
    borderRadius: 20, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs, marginRight: SPACING.xs,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  exampleText: { fontSize: FONT_SIZE.sm },
  filterRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.xs },
  filterChip: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 12, paddingHorizontal: SPACING.sm,
    paddingVertical: 3, marginRight: SPACING.xs,
  },
  filterChipText: { color: '#7C3AED', fontSize: 11, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm, gap: SPACING.xs,
  },
  tab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: { backgroundColor: '#7C3AED' },
  tabText: { color: '#9CA3AF', fontSize: FONT_SIZE.sm, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  errorContainer: { padding: SPACING.md },
  errorText: { color: '#EF4444', fontSize: FONT_SIZE.sm },
  resultsList: { paddingHorizontal: SPACING.md, paddingBottom: 80 },
  resultCard: {
    flexDirection: 'row', borderRadius: 16,
    marginBottom: SPACING.sm, overflow: 'hidden',
    padding: SPACING.sm, gap: SPACING.sm,
  },
  postThumb: { width: 72, height: 72, borderRadius: 10 },
  eventIcon: {
    width: 72, height: 72, borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  eventIconText: { fontSize: 32 },
  resultContent: { flex: 1 },
  resultTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: 3 },
  resultMeta: { fontSize: 11, marginBottom: 3 },
  resultDesc: { fontSize: 11, lineHeight: 16 },
  emptyResults: { alignItems: 'center', paddingTop: 60 },
});

export default SmartSearchScreen;
