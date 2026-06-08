import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import api from '../../services/api';

interface HashtagSuggestionsProps {
  caption: string;
  onSelectHashtag: (hashtag: string) => void;
}

const HashtagSuggestions: React.FC<HashtagSuggestionsProps> = ({ caption, onSelectHashtag }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract the last word being typed after a #
    const words = caption.split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('#') && lastWord.length > 1) {
      const query = lastWord.slice(1);
      fetchSuggestions(query);
    } else if (caption.length === 0) {
      // Show popular hashtags when caption is empty
      fetchSuggestions('');
    } else {
      setSuggestions([]);
    }
  }, [caption]);

  const fetchSuggestions = async (query: string) => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: string[] }>('/posts/hashtag-suggestions', {
        params: { q: query },
      });
      setSuggestions(data.data);
    } catch (error) {
      console.error('Failed to fetch hashtag suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {suggestions.map((tag) => (
        <TouchableOpacity
          key={tag}
          style={styles.chip}
          onPress={() => {
            // Replace the current incomplete hashtag or append
            const words = caption.split(/\s+/);
            const lastWord = words[words.length - 1];
            
            if (lastWord.startsWith('#')) {
              // Replace incomplete hashtag
              words[words.length - 1] = `#${tag}`;
              onSelectHashtag(words.join(' ') + ' ');
            } else {
              // Append new hashtag
              onSelectHashtag(caption + (caption.length > 0 ? ' ' : '') + `#${tag} `);
            }
          }}
        >
          <Text style={styles.chipText}>#{tag}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9D7FEA',
  },
});

export default HashtagSuggestions;
