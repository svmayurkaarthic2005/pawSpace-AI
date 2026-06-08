import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

interface CommunitiesHeaderProps {
  isSearchActive: boolean;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchToggle: (active: boolean) => void;
  activeTab: 'mine' | 'discover';
  onTabChange: (tab: 'mine' | 'discover') => void;
}

export const CommunitiesHeader: React.FC<CommunitiesHeaderProps> = ({
  isSearchActive,
  searchQuery,
  onSearchChange,
  onSearchToggle,
  activeTab,
  onTabChange,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {!isSearchActive ? (
        <View style={styles.header}>
          <Text style={styles.title}>Communities</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => onSearchToggle(true)}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <Icon name="search" color="rgba(255,255,255,0.7)" size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateCommunity' as never)}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <Icon name="plus" color="rgba(255,255,255,0.7)" size={22} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.searchHeader}>
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search communities..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.searchInput}
          />
          <TouchableOpacity
            onPress={() => {
              onSearchToggle(false);
              onSearchChange('');
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['mine', 'discover'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => onTabChange(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'mine' ? 'My communities' : 'Discover'}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#fff',
  },
  cancelText: {
    color: '#A78BFA',
    fontSize: 15,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '400',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '500',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#7C3AED',
    borderRadius: 1,
  },
});
