import React, { forwardRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { SelectedCommunity } from '../../screens/feed/CreatePostScreen';

interface CommunitySheetProps {
  snapPoints: string[];
  onSelectCommunity: (community: SelectedCommunity) => void;
}

// Mock data - replace with actual API call
const MOCK_COMMUNITIES = [
  {
    _id: '1',
    name: 'Dog Lovers',
    slug: 'dog-lovers',
    memberCount: 12500,
    avatar: 'https://via.placeholder.com/100',
  },
  {
    _id: '2',
    name: 'Cat Parents',
    slug: 'cat-parents',
    memberCount: 9800,
    avatar: 'https://via.placeholder.com/100',
  },
];

const CommunitySheet = forwardRef<BottomSheet, CommunitySheetProps>(
  ({ snapPoints, onSelectCommunity }, ref) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const renderBackdrop = useMemo(
      () => (props: any) => (
        <BottomSheetBackdrop
          {...props}
          opacity={0.5}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      []
    );

    const filteredCommunities = MOCK_COMMUNITIES.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    const renderCommunityItem = ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.communityItem}
        onPress={() => {
          onSelectCommunity({
            _id: item._id,
            name: item.name,
            slug: item.slug,
            avatar: item.avatar,
          });
        }}
      >
        {item.avatar ? (
          <FastImage source={{ uri: item.avatar }} style={styles.communityAvatar} />
        ) : (
          <View style={[styles.communityAvatar, styles.placeholderAvatar]}>
            <Icon name="people" size={24} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <View style={styles.communityInfo}>
          <Text style={styles.communityName}>{item.name}</Text>
          <Text style={styles.communityMembers}>
            {item.memberCount.toLocaleString()} members
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.indicator}
        keyboardBehavior="interactive"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Select community</Text>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search communities..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredCommunities}
            renderItem={renderCommunityItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="people-outline" size={64} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyTitle}>No communities found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              </View>
            }
          />
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1A1A2E',
  },
  indicator: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  communityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  communityMembers: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
});

export default CommunitySheet;
