import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, useColorScheme, ScrollView,
  StatusBar, Keyboard, Animated,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { aiApi, SearchResults } from '../../services/ai.service';
import { FONT_SIZE, SPACING } from '../../constants';
import { timeAgo } from '../../utils';
import { useVoiceInput } from '../../hooks/useVoiceInput';

type Props = NativeStackScreenProps<any, 'SmartSearch'>;

const EXAMPLE_QUERIES = [
  'Golden retriever meetups this weekend',
  'Cat grooming tips near me',
  'Dog-friendly hiking events',
  'Rabbit owners community',
  'Puppy training classes',
];

// ─── Skeleton Loading Components ───────────────────────────────────────────────

const SkeletonCard: React.FC<{ cardBg: string }> = ({ cardBg }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.resultCard, { backgroundColor: cardBg, opacity }]}>
      <View style={[styles.skeletonThumb, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
      <View style={styles.resultContent}>
        <View style={[styles.skeletonLine, { width: '80%', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }]} />
      </View>
    </Animated.View>
  );
};

const SkeletonLoader: React.FC<{ cardBg: string }> = ({ cardBg }) => (
  <View style={{ paddingHorizontal: SPACING.md }}>
    <SkeletonCard cardBg={cardBg} />
    <SkeletonCard cardBg={cardBg} />
    <SkeletonCard cardBg={cardBg} />
  </View>
);

// ─── Pulsing Mic Button ──────────────────────────────────────────────────────────

const PulsingMicButton: React.FC<{
  isListening: boolean;
  onPress: () => void;
  subColor: string;
}> = ({ isListening, onPress, subColor }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isListening) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      opacity.setValue(1);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [isListening, opacity]);

  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 4 }} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
      <Animated.View style={{ opacity }}>
        <Icon
          name="mic-outline"
          size={20}
          color={isListening ? '#7C3AED' : subColor}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Smart Search Screen ───────────────────────────────────────────────────────

const SmartSearchScreen: React.FC<Props> = ({ route, navigation }) => {
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState((route?.params as any)?.initialQuery || '');
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

  // Voice Input Setup
  const { isListening, transcript, startListening, stopListening, clearTranscript } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
      void handleSearch(transcript);
      clearTranscript();
    }
  }, [transcript, handleSearch, clearTranscript]);

  useEffect(() => {
    const initQ = (route?.params as any)?.initialQuery;
    if (initQ) {
      void handleSearch(initQ);
    }
  }, [route?.params, handleSearch]);

  const handleMicPress = async () => {
    try {
      if (isListening) {
        await stopListening();
      } else {
        await startListening();
      }
    } catch (e) {
      console.warn('[SmartSearch] Voice error:', e);
    }
  };

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

  const renderPost = ({ item }: { item: typeof posts[0] }) => {
    const avatarUrl = item.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author.username)}&background=7C3AED&color=fff&size=80`;

    return (
      <TouchableOpacity
        style={[styles.resultCard, { backgroundColor: cardBg }]}
        onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
      >
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
          <View style={styles.authorRow}>
            <FastImage
              source={{ uri: avatarUrl }}
              style={styles.authorAvatar}
            />
            <Text style={[styles.resultMeta, { color: subColor }]} numberOfLines={1}>
              @{item.author.username} · {timeAgo(item.createdAt)} · ❤️ {item.likesCount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEvent = ({ item }: { item: typeof events[0] }) => (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: cardBg }]}
      onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
    >
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
          <TouchableOpacity onPress={() => setQuery('')} style={{ paddingHorizontal: 4 }}>
            <Text style={{ color: subColor, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
        <PulsingMicButton
          isListening={isListening}
          onPress={handleMicPress}
          subColor={subColor}
        />
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

      {/* AI Intent Banner */}
      {results && (
        <View style={styles.intentBanner}>
          <Text style={styles.intentText}>
            ✦ {results.parsedQuery.intent ?? results.parsedQuery.originalQuery}
          </Text>
        </View>
      )}

      {/* Result Count Summary */}
      {results && (
        <Text style={[styles.countSummary, { color: subColor }]}>
          Found {allResults.length} results for "{results.parsedQuery.originalQuery || query}"
        </Text>
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

      {/* Results or Loading */}
      {isSearching ? (
        <SkeletonLoader cardBg={cardBg} />
      ) : (
        results && (
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
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🐾</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No results found</Text>
                <Text style={[styles.emptySubtitle, { color: subColor }]}>
                  Try: 'dog parks near me' or 'cat adoption events'
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => {
                    setQuery('');
                    setResults(null);
                  }}
                >
                  <Text style={styles.retryBtnText}>Clear & retry</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
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
  intentBanner: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  intentText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
  },
  countSummary: {
    fontSize: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  emptyResults: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  retryBtn: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  retryBtnText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
  },
  skeletonThumb: { width: 72, height: 72, borderRadius: 10 },
  skeletonLine: { height: 16, borderRadius: 4 },
});

export default SmartSearchScreen;
