import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const FILTERS = [
  { id: 'none', label: 'Original' },
  { id: 'grayscale', label: 'B&W' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'vivid', label: 'Vivid' },
];

interface FilterStripProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

const FilterStrip: React.FC<FilterStripProps> = ({ selectedFilter, onSelectFilter }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => {
        const isSelected = selectedFilter === filter.id;
        return (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterButton, isSelected && styles.selectedFilter]}
            onPress={() => onSelectFilter(filter.id)}
          >
            <Text style={[styles.filterText, isSelected && styles.selectedText]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  selectedFilter: {
    backgroundColor: '#7C3AED',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});

export default FilterStrip;
