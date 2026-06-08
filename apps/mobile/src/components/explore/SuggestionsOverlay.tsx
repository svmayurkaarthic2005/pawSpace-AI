import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SuggestionsOverlayProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onDismiss: () => void;
}

export const SuggestionsOverlay: React.FC<SuggestionsOverlayProps> = ({
  suggestions,
  onSelect,
  onDismiss,
}) => {
  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />

      {/* Suggestions Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Icon name="sparkles" size={20} color="#7C3AED" />
          <Text style={styles.headerText}>AI Search Suggestions</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion}-${index}`}
              style={styles.suggestionItem}
              onPress={() => onSelect(suggestion)}
              activeOpacity={0.7}
            >
              <Icon name="search-outline" size={18} color="#9CA3AF" style={styles.suggestionIcon} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
              <Icon name="arrow-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Icon name="information-circle-outline" size={14} color="#6B7280" />
          <Text style={styles.footerText}>Ask anything about pets, events, or communities</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    maxHeight: SCREEN_HEIGHT * 0.6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F9FAFB',
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
});
