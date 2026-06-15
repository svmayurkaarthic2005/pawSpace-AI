import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import api from '../../services/api';

interface HashtagSuggestionsProps {
  caption: string;
  onSelectHashtag: (hashtag: string) => void;
}

const HashtagSuggestions: React.FC<HashtagSuggestionsProps> = ({ caption, onSelectHashtag }) => {
  const [suggestions, setSuggestions] = useState<string[]>([
    'pawspace',
    'dogsofpawspace', 
    'catsofpawspace',
    'petsofpawspace',
    'petlovers',
    'doglife',
    'catlife',
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract the last word being typed after a #
    const words = caption.split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('#') && lastWord.length > 1) {
      const query = lastWord.slice(1);
      fetchSuggestions(query);
    } else if (caption.length === 0) {
      // Show popular PawSpace hashtags when caption is empty
      setSuggestions([
        'pawspace',
        'dogsofpawspace',
        'catsofpawspace',
        'petsofpawspace',
        'petlovers',
        'doglife',
        'catlife',
        'petphotography',
      ]);
    }
  }, [caption]);

  const fetchSuggestions = async (query: string) => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: string[] }>('/posts/hashtag-suggestions', {
        params: { q: query },
      });
      
      // Fallback to default PawSpace hashtags if API fails or returns empty
      if (data.data && data.data.length > 0) {
        setSuggestions(data.data);
      } else {
        setSuggestions([
          'pawspace',
          'dogsofpawspace',
          'catsofpawspace',
          'petsofpawspace',
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch hashtag suggestions:', error);
      // Show PawSpace branded hashtags as fallback
      setSuggestions([
        'pawspace',
        'dogsofpawspace',
        'catsofpawspace',
        'petsofpawspace',
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>Suggested hashtags</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        style={styles.scrollView}
      >
        {suggestions.map((tag, index) => (
          <TouchableOpacity
            key={`${tag}-${index}`}
            style={[styles.chip, index > 0 && styles.chipSpacing]}
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
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>#{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    marginHorizontal: -16,
  },
  container: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  chipSpacing: {
    marginLeft: 10,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
  },
});

export default HashtagSuggestions;
