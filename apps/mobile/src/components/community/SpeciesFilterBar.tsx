import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { capitalize } from '../../utils/format';

interface SpeciesFilterBarProps {
  activeSpecies: string;
  onChange: (species: string) => void;
}

const SPECIES = ['all', 'dog', 'cat', 'bird', 'rabbit', 'other'];

export const SpeciesFilterBar: React.FC<SpeciesFilterBarProps> = ({
  activeSpecies,
  onChange,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {SPECIES.map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.filterPill, activeSpecies === s && styles.filterPillActive]}
          onPress={() => onChange(s)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, activeSpecies === s && styles.filterTextActive]}>
            {s === 'all' ? 'All' : capitalize(s) + 's'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
  },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterPillActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124, 58, 237, 0.5)',
  },
  filterText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#A78BFA',
  },
});
