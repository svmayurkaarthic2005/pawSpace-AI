import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';

interface AISearchBarProps {
  query: string;
  isFocused: boolean;
  isSearching?: boolean;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  onClear: () => void;
  onMicPress?: () => void;
  searchBarAnim: Animated.SharedValue<number>;
}

export const AISearchBar: React.FC<AISearchBarProps> = ({
  query,
  isFocused,
  isSearching = false,
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  onClear,
  onMicPress,
  searchBarAnim,
}) => {
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        searchBarAnim.value,
        [0, 1],
        ['rgba(255,255,255,0.1)', '#7C3AED'],
      ),
      shadowColor: interpolateColor(
        searchBarAnim.value,
        [0, 1],
        ['rgba(124,58,237,0)', 'rgba(124,58,237,0.4)'],
      ),
      shadowOpacity: withTiming(searchBarAnim.value, { duration: 200 }),
      shadowRadius: withTiming(8 + searchBarAnim.value * 4, { duration: 200 }),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      {/* Search Icon */}
      <Icon
        name="search-outline"
        size={20}
        color={isFocused ? '#7C3AED' : '#9CA3AF'}
        style={styles.searchIcon}
      />

      {/* Text Input */}
      <TextInput
        value={query}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmit}
        placeholder="Ask AI: 'Find dog parks near me'"
        placeholderTextColor="#6B7280"
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Right Icons */}
      <View style={styles.rightIcons}>
        {isSearching ? (
          <View style={styles.listeningContainer}>
            <ActivityIndicator size="small" color="#7C3AED" />
          </View>
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Icon name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        ) : (
          onMicPress && (
            <TouchableOpacity 
              onPress={onMicPress} 
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              style={isSearching ? styles.micActive : undefined}
            >
              <Icon 
                name={isSearching ? "mic" : "mic-outline"} 
                size={20} 
                color={isSearching ? "#EF4444" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          )
        )}
      </View>

      {/* AI Badge */}
      {isFocused && (
        <View style={styles.aiBadge}>
          <Icon name="sparkles" size={10} color="#7C3AED" />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  rightIcons: {
    marginLeft: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 2,
  },
  aiBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
