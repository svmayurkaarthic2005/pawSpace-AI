import React, { useState, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet, SafeAreaView } from 'react-native';
import { CommunitiesHeader } from '../../components/community/CommunitiesHeader';
import { MyCommunitiesTab } from '../../components/community/MyCommunitiesTab';
import { DiscoverTab } from '../../components/community/DiscoverTab';

const { width: screenWidth } = Dimensions.get('window');

export const CommunitiesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mine' | 'discover'>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  
  const tabTranslate = useRef(new Animated.Value(0)).current;

  const switchTab = (tab: 'mine' | 'discover') => {
    setActiveTab(tab);
    
    Animated.spring(tabTranslate, {
      toValue: tab === 'mine' ? 0 : -screenWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };

  const handleSwitchToDiscover = () => {
    switchTab('discover');
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommunitiesHeader
        isSearchActive={isSearchActive}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchToggle={setIsSearchActive}
        activeTab={activeTab}
        onTabChange={switchTab}
      />

      {/* Tab slide container */}
      <View style={styles.tabContainer}>
        <Animated.View
          style={[
            styles.tabSlider,
            {
              transform: [{ translateX: tabTranslate }],
            },
          ]}
        >
          {/* My Communities Tab */}
          <View style={styles.tabContent}>
            <MyCommunitiesTab
              searchQuery={searchQuery}
              isSearchActive={isSearchActive}
              onSwitchToDiscover={handleSwitchToDiscover}
            />
          </View>

          {/* Discover Tab */}
          <View style={styles.tabContent}>
            <DiscoverTab
              speciesFilter={speciesFilter}
              onSpeciesChange={setSpeciesFilter}
              searchQuery={searchQuery}
              isSearchActive={isSearchActive}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  tabContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  tabSlider: {
    flexDirection: 'row',
    width: screenWidth * 2,
    flex: 1,
  },
  tabContent: {
    width: screenWidth,
    flex: 1,
  },
});
