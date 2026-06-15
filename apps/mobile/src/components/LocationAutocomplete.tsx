import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { locationService, PlacePrediction } from '../services/location.service';
import { COLORS, SPACING, FONT_SIZE } from '../constants';

interface LocationAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (location: string) => void;
  placeholder?: string;
  style?: any;
  inputStyle?: any;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChangeText,
  onSelectLocation,
  placeholder = 'City, Country',
  style,
  inputStyle,
}) => {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Follow app's dark theme strictly
  const subColor = '#9CA3AF';
  const borderColor = '#2D2D4E';
  const listBg = '#1A1A2E';
  const itemBg = '#252540';
  const textColor = '#FFFFFF';

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Don't search for empty or very short input
    if (!value || typeof value !== 'string' || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // Increment request ID for race condition prevention
    const requestId = currentRequestId + 1;
    setCurrentRequestId(requestId);

    // Debounce the search
    const timeout = setTimeout(() => {
      searchLocations(value, requestId);
    }, 500);

    setSearchTimeout(timeout);

    // Cleanup function
    return () => {
      clearTimeout(timeout);
    };
  }, [value]);

  const searchLocations = async (query: string, requestId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await locationService.getPlaceSuggestions(query);
      
      // Only update state if this is still the most recent request
      if (requestId === currentRequestId) {
        // Ensure results is always an array
        const safeResults = Array.isArray(results) ? results : [];
        
        // Batch state updates to prevent race condition
        setSuggestions(safeResults);
        setShowSuggestions(safeResults.length > 0);
        setIsLoading(false);
        
        // Show message if no results found
        if (safeResults.length === 0 && query.length >= 2) {
          setError('No locations found. Try a different search.');
        }
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      // Only update state if this is still the most recent request
      if (requestId === currentRequestId) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
        setError('Unable to search locations. Check your connection.');
      }
    }
  };

  const handleSelectSuggestion = (suggestion: PlacePrediction) => {
    // Clear suggestions immediately to prevent race condition
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Then update the input value
    onSelectLocation(suggestion.description);
    onChangeText(suggestion.description);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setError(null);
    // Don't show suggestions if clearing
    if (!text || typeof text !== 'string' || text.length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleClear = () => {
    onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  // Memoize the suggestions list to prevent unnecessary re-renders
  const suggestionsList = useMemo(() => {
    if (!showSuggestions || !suggestions || suggestions.length === 0) {
      return null;
    }

    return (
      <View style={[styles.suggestionsContainer, { backgroundColor: listBg, borderColor }]}>
        {suggestions.map((item) => (
          <TouchableOpacity
            key={item.place_id}
            style={[styles.suggestionItem, { backgroundColor: itemBg }]}
            onPress={() => handleSelectSuggestion(item)}
          >
            <Icon name="location" size={18} color={COLORS.primary} />
            <View style={styles.suggestionTextContainer}>
              <Text style={[styles.suggestionMainText, { color: textColor }]}>
                {item.structured_formatting.main_text}
              </Text>
              <Text style={[styles.suggestionSecondaryText, { color: subColor }]}>
                {item.structured_formatting.secondary_text}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [showSuggestions, suggestions, listBg, borderColor, itemBg, textColor, subColor]);

  return (
    <View style={style}>
      <View style={styles.inputContainer}>
        <Icon name="location-outline" size={20} color={subColor} />
        <TextInput
          style={[styles.input, inputStyle, { color: textColor }]}
          value={value || ''}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={subColor}
          maxLength={100}
        />
        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.primary} />
        )}
        {value && value.length > 0 && !isLoading && (
          <TouchableOpacity onPress={handleClear}>
            <Icon name="close-circle" size={20} color={subColor} />
          </TouchableOpacity>
        )}
      </View>

      {error && !isLoading && (
        <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
      )}

      {suggestionsList}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  suggestionsContainer: {
    marginTop: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 250,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  suggestionSecondaryText: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
});

export default LocationAutocomplete;
