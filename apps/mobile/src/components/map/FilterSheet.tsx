import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';

interface MapFilters {
  species: string[];
  radiusKm: number;
  dateFilter: 'any' | 'today' | 'weekend' | 'week';
}

interface FilterSheetProps {
  filters: MapFilters;
  onApply: (filters: MapFilters) => void;
  onReset: () => void;
}

const FilterSheet: React.FC<FilterSheetProps> = ({ filters, onApply, onReset }) => {
  const [localFilters, setLocalFilters] = useState<MapFilters>(filters);

  const handleReset = () => {
    const resetFilters = { species: [], radiusKm: 25, dateFilter: 'any' as const };
    setLocalFilters(resetFilters);
    console.log('🔄 Filters reset:', resetFilters);
    onReset();
  };

  const handleApply = () => {
    console.log('✅ Applying filters:', localFilters);
    onApply(localFilters);
  };

  return (
    <BottomSheetScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Species */}
      <Text style={styles.sectionLabel}>Pet species</Text>
      <View style={styles.speciesGrid}>
        {['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'].map((s) => {
          const lower = s.toLowerCase();
          const isActive = localFilters.species.includes(lower);
          return (
            <TouchableOpacity
              key={s}
              style={[styles.speciesPill, isActive && styles.speciesPillActive]}
              onPress={() => {
                setLocalFilters((f) => ({
                  ...f,
                  species: isActive ? f.species.filter((sp) => sp !== lower) : [...f.species, lower],
                }));
              }}
            >
              <Text style={[styles.speciesText, isActive && styles.speciesTextActive]}>{s}s</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Radius */}
      <View style={styles.radiusHeader}>
        <Text style={styles.sectionLabel}>Radius</Text>
        <Text style={styles.radiusValue}>{localFilters.radiusKm} km</Text>
      </View>
      <Slider
        value={localFilters.radiusKm}
        minimumValue={1}
        maximumValue={50}
        step={1}
        onValueChange={(v) => setLocalFilters((f) => ({ ...f, radiusKm: v }))}
        minimumTrackTintColor="#7C3AED"
        maximumTrackTintColor="rgba(255,255,255,0.1)"
        thumbTintColor="#7C3AED"
        style={{ width: '100%', height: 40 }}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>1 km</Text>
        <Text style={styles.sliderLabel}>50 km</Text>
      </View>

      {/* Date filter */}
      <Text style={styles.sectionLabel}>Date</Text>
      <View style={styles.dateGrid}>
        {[
          { value: 'any', label: 'Any time' },
          { value: 'today', label: 'Today' },
          { value: 'weekend', label: 'This weekend' },
          { value: 'week', label: 'This week' },
        ].map((option) => {
          const isActive = localFilters.dateFilter === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.datePill, isActive && styles.datePillActive]}
              onPress={() => setLocalFilters((f) => ({ ...f, dateFilter: option.value as any }))}
            >
              <Text style={[styles.dateText, isActive && styles.dateTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Apply button */}
      <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
        <Text style={styles.applyBtnText}>Apply filters</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  resetText: {
    fontSize: 14,
    color: '#7C3AED',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 20,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesPill: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  speciesPillActive: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: 'rgba(124,58,237,0.5)',
  },
  speciesText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
  speciesTextActive: {
    color: '#A78BFA',
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radiusValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7C3AED',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  datePill: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  datePillActive: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: 'rgba(124,58,237,0.5)',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
  dateTextActive: {
    color: '#A78BFA',
  },
  applyBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default FilterSheet;
