import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Geolocation from '@react-native-community/geolocation';
import { AISearchBar } from '../../components/explore/AISearchBar';
import { SuggestionsOverlay } from '../../components/explore/SuggestionsOverlay';
import { ParsedIntentBanner } from '../../components/explore/ParsedIntentBanner';
import { ResultsTabs } from '../../components/explore/ResultsTabs';
import { ExploreContent } from '../../components/explore/ExploreContent';
import { searchService } from '../../services/search.service';
import { SearchIntent, SearchResults, SmartSearchResponse } from '../../types';
import { useVoiceInput } from '../../hooks/useVoiceInput';

type SearchMode = 'explore' | 'searching' | 'results';
type TabType = 'all' | 'posts' | 'events' | 'communities' | 'people';

const DEFAULT_SUGGESTIONS = [
  'Find dog meetups nearby',
  'Cat communities in Chennai',
  'Weekend events for huskies',
  'Golden retriever owners near me',
  'Pet training classes this week',
];

export const ExploreScreen: React.FC = () => {
  // State
  const [searchMode, setSearchMode] = useState<SearchMode>('explore');
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<SearchIntent | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<TabType>('all');
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [noResultsSuggestion, setNoResultsSuggestion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  // Voice input hook
  const { isListening, transcript, startListening, stopListening, clearTranscript } = useVoiceInput();

  // Animations
  const searchBarBorderAnim = useSharedValue(0);
  const resultsOpacity = useSharedValue(0);
  const exploreOpacity = useSharedValue(1);

  // Track if component is mounted to prevent race conditions
  const isMountedRef = useRef(true);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSuggestionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Each search gets a unique ID; only the latest one can update state
  const searchIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (loadSuggestionsTimeoutRef.current) clearTimeout(loadSuggestionsTimeoutRef.current);
    };
  }, []);

  // Update query when voice transcript changes
  useEffect(() => {
    if (transcript && isMountedRef.current) {
      setQuery(transcript);
      setSearchMode('results');
      // Auto-search after voice input
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          handleSearch();
          clearTranscript();
        }
      }, 500);
    }
  }, [transcript]);

  // Get user location on mount with better timeout and error handling
  useEffect(() => {
    const locationTimeout = setTimeout(() => {
      console.log('[ExploreScreen] Location request timeout, continuing without location');
    }, 30000);

    Geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(locationTimeout);
        if (isMountedRef.current) {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log('[ExploreScreen] Location acquired successfully');
        }
      },
      (error) => {
        clearTimeout(locationTimeout);
        console.log('[ExploreScreen] Location unavailable:', error.message || 'Unknown error');
        // Continue without location - nearby features will be disabled
      },
      { 
        enableHighAccuracy: false, 
        timeout: 30000, // Increased to 30 seconds
        maximumAge: 300000 // 5 minutes cache
      },
    );

    return () => clearTimeout(locationTimeout);
  }, []);

  // Load suggestions when query changes (debounced)
  useEffect(() => {
    if (loadSuggestionsTimeoutRef.current) {
      clearTimeout(loadSuggestionsTimeoutRef.current);
    }

    if (query.length > 2 && searchMode === 'searching') {
      loadSuggestionsTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          loadSuggestions(query);
        }
      }, 300);
    } else if (searchMode === 'searching') {
      setSuggestions(DEFAULT_SUGGESTIONS);
    }
  }, [query, searchMode]);

  const loadSuggestions = async (q: string) => {
    try {
      const newSuggestions = await searchService.getSuggestions(q);
      if (isMountedRef.current) {
        setSuggestions(newSuggestions);
      }
    } catch {
      // Keep default suggestions on error
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    // Increment and capture this search's unique ID
    const thisSearchId = ++searchIdRef.current;
    const currentQuery = query;

    Keyboard.dismiss();
    setIsSearching(true);
    setSearchMode('results');
    searchBarBorderAnim.value = withTiming(1, { duration: 200 });
    exploreOpacity.value = withTiming(0, { duration: 200 });
    resultsOpacity.value = withTiming(1, { duration: 300 });

    try {
      // Track search query (non-blocking)
      searchService.trackSearch(currentQuery).catch(() => {});

      // Execute AI search
      const response: SmartSearchResponse = await searchService.smartSearch({
        query: currentQuery,
        userLocation,
      });

      // Only update state if this is still the most recent search and component is mounted
      if (isMountedRef.current && thisSearchId === searchIdRef.current) {
        setParsedIntent(response.intent);
        setSearchResults(response.results);
        setNoResultsSuggestion(response.suggestion);
        setActiveResultTab('all');
      }
    } catch (error) {
      console.error('Search error:', error);
      if (isMountedRef.current && thisSearchId === searchIdRef.current) {
        setSearchResults({ posts: [], events: [], communities: [], users: [] });
        setNoResultsSuggestion('Search failed. Please try again.');
      }
    } finally {
      // Only clear loading state if this is still the current search
      if (isMountedRef.current && thisSearchId === searchIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleClear = () => {
    // Clear any pending timeouts
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (loadSuggestionsTimeoutRef.current) clearTimeout(loadSuggestionsTimeoutRef.current);

    setQuery('');
    setSearchMode('explore');
    setSearchResults(null);
    setParsedIntent(null);
    setIsFocused(false);
    setIsSearching(false);
    searchBarBorderAnim.value = withTiming(0, { duration: 200 });
    resultsOpacity.value = withTiming(0, { duration: 200 });
    exploreOpacity.value = withTiming(1, { duration: 300 });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setSearchMode('results');
    
    // Clear any pending search timeouts
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        handleSearch();
      }
    }, 100);
  };

  const handleSuggestionDismiss = () => {
    if (!query) {
      setSearchMode('explore');
      setIsFocused(false);
      searchBarBorderAnim.value = withTiming(0, { duration: 200 });
    }
  };

  const handleMicPress = async () => {
    try {
      if (isListening) {
        await stopListening();
      } else {
        await startListening();
      }
    } catch (error) {
      console.error('Voice input error:', error);
      Alert.alert('Voice Input', 'Failed to start voice recognition');
    }
  };

  const exploreAnimStyle = useAnimatedStyle(() => ({
    opacity: exploreOpacity.value,
  }));

  const resultsAnimStyle = useAnimatedStyle(() => ({
    opacity: resultsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Search Bar — Always visible */}
        <AISearchBar
          query={query}
          isFocused={isFocused}
          isSearching={isSearching || isListening}
          onChangeText={handleQueryChange}
          onFocus={() => {
            setIsFocused(true);
            if (!query && searchMode === 'explore') {
              setSearchMode('searching');
            }
            searchBarBorderAnim.value = withTiming(1, { duration: 200 });
          }}
          onBlur={() => {
            if (!query && searchMode === 'searching' && !isListening) {
              setIsFocused(false);
              setSearchMode('explore');
              searchBarBorderAnim.value = withTiming(0, { duration: 200 });
            }
          }}
          onSubmit={handleSearch}
          onClear={handleClear}
          onMicPress={handleMicPress}
          searchBarAnim={searchBarBorderAnim}
        />
      </SafeAreaView>

      {/* Content Area */}
      {searchMode === 'explore' && (
        <Animated.View style={[styles.contentContainer, exploreAnimStyle]}>
          <ExploreContent />
        </Animated.View>
      )}

      {searchMode === 'searching' && (
        <SuggestionsOverlay
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
          onDismiss={handleSuggestionDismiss}
        />
      )}

      {searchMode === 'results' && (
        <Animated.View style={[styles.contentContainer, resultsAnimStyle]}>
          {parsedIntent && <ParsedIntentBanner intent={parsedIntent} />}
          <ResultsTabs
            activeTab={activeResultTab}
            onChange={setActiveResultTab}
            results={searchResults}
            noResultsSuggestion={noResultsSuggestion}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  safeArea: {
    backgroundColor: '#0D0D1A',
  },
  contentContainer: {
    flex: 1,
  },
});

export default ExploreScreen;
