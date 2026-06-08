import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface EmptySearchStateProps {
  suggestion: string | null;
}

export const EmptySearchState: React.FC<EmptySearchStateProps> = ({ suggestion }) => {
  return (
    <View style={styles.container}>
      <Icon name="search-outline" size={64} color="#374151" />
      <Text style={styles.title}>No results found</Text>
      {suggestion && <Text style={styles.suggestion}>{suggestion}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
