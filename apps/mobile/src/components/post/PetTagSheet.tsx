import React, { forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { petApi } from '../../services/post.service';
import { SelectedPet } from '../../screens/feed/CreatePostScreen';

interface PetTagSheetProps {
  snapPoints: string[];
  onSelectPet: (pet: SelectedPet) => void;
}

const PetTagSheet = forwardRef<BottomSheet, PetTagSheetProps>(
  ({ snapPoints, onSelectPet }, ref) => {
    const { data: pets, isLoading, isError } = useQuery({
      queryKey: ['myPets'],
      queryFn: () => petApi.getMyPets(),
      staleTime: 300000, // 5 minutes
    });

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

    const renderPetItem = ({ item }: { item: any }) => {
      const profileImage = item.images?.find((img: any) => img.isProfile)?.url || item.images?.[0]?.url;

      return (
        <TouchableOpacity
          style={styles.petItem}
          onPress={() => {
            onSelectPet({
              _id: item._id,
              name: item.name,
              species: item.species,
              images: item.images || [],
            });
          }}
        >
          {profileImage ? (
            <FastImage source={{ uri: profileImage }} style={styles.petAvatar} />
          ) : (
            <View style={[styles.petAvatar, styles.placeholderAvatar]}>
              <Icon name="paw" size={24} color="rgba(255,255,255,0.5)" />
            </View>
          )}
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petSpecies}>
              {item.species.charAt(0).toUpperCase() + item.species.slice(1)}
              {item.breed && ` • ${item.breed}`}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
      );
    };

    const renderEmpty = () => (
      <View style={styles.emptyContainer}>
        <Icon name="paw-outline" size={64} color="rgba(255,255,255,0.2)" />
        <Text style={styles.emptyTitle}>No pets yet</Text>
        <Text style={styles.emptySubtitle}>Add a pet to your profile to tag them in posts</Text>
      </View>
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
      >
        <View style={styles.container}>
          <Text style={styles.title}>Tag a pet</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
            </View>
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>Failed to load pets</Text>
            </View>
          ) : (
            <FlatList
              data={pets || []}
              renderItem={renderPetItem}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
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
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  petSpecies: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default PetTagSheet;
