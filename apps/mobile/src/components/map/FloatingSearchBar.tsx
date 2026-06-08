import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface FloatingSearchBarProps {
  query: string;
  onChange: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onFilterPress: () => void;
  results: PlaceResult[];
  showResults: boolean;
  onSelectResult: (result: PlaceResult) => void;
  onClear: () => void;
}

const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  query,
  onChange,
  onFocus,
  onBlur,
  onFilterPress,
  results,
  showResults,
  onSelectResult,
  onClear,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Icon name="search" color="rgba(255,255,255,0.4)" size={18} />
          <TextInput
            value={query}
            onChangeText={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Find pets, events, places..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={onClear}>
              <Icon name="close" color="rgba(255,255,255,0.4)" size={16} />
            </TouchableOpacity>
          )}
          <View style={styles.divider} />
          <TouchableOpacity onPress={onFilterPress} style={styles.filterBtn}>
            <Icon name="options" color="#A78BFA" size={20} />
          </TouchableOpacity>
        </View>

        {showResults && results.length > 0 && (
          <View style={styles.resultsDropdown}>
            {results.map((result) => (
              <TouchableOpacity
                key={result.placeId}
                style={styles.resultRow}
                onPress={() => {
                  onSelectResult(result);
                  Keyboard.dismiss();
                }}
              >
                <Icon name="location" color="rgba(255,255,255,0.4)" size={14} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {result.name}
                  </Text>
                  <Text style={styles.resultAddress} numberOfLines={1}>
                    {result.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  searchWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,13,26,0.92)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    height: 52,
  },
  divider: {
    width: 0.5,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  filterBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsDropdown: {
    backgroundColor: 'rgba(13,13,26,0.97)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resultName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '400',
  },
  resultAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
});

export default FloatingSearchBar;
