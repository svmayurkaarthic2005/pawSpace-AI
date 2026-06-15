import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import { launchImageLibrary } from 'react-native-image-picker';
import * as Keychain from 'react-native-keychain';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import CreatePostHeader from '../../components/post/CreatePostHeader';
import MediaSection from '../../components/post/MediaSection';
import CaptionSection from '../../components/post/CaptionSection';
import DetailsSection from '../../components/post/DetailsSection';
import UploadProgressBar from '../../components/post/UploadProgressBar';
import PetTagSheet from '../../components/post/PetTagSheet';
import LocationSheet from '../../components/post/LocationSheet';
import CommunitySheet from '../../components/post/CommunitySheet';

import { postApi } from '../../services/post.service';
import { STORAGE_KEYS, QUERY_KEYS } from '../../constants';
import { FeedStackParamList } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  fileName: string;
  filter?: string;
  duration?: number; // Video duration in seconds
}

export interface SelectedPet {
  _id: string;
  name: string;
  species: string;
  images: Array<{ url: string; isProfile: boolean }>;
}

export interface SelectedLocation {
  name: string;
  coordinates: [number, number];
}

export interface SelectedCommunity {
  _id: string;
  name: string;
  slug: string;
  avatar?: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<FeedStackParamList>>();
  const queryClient = useQueryClient();

  // Bottom sheets
  const petSheetRef = useRef<BottomSheet>(null);
  const locationSheetRef = useRef<BottomSheet>(null);
  const communitySheetRef = useRef<BottomSheet>(null);

  // State
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [caption, setCaption] = useState('');
  const [selectedPet, setSelectedPet] = useState<SelectedPet | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<SelectedCommunity | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAI, setIsAI] = useState(false);

  const snapPoints = useMemo(() => ['75%'], []);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const pickMedia = async () => {
    if (media.length >= 5) {
      Alert.alert('Limit Reached', 'You can only select up to 5 photos or 1 video.');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: media.length > 0 ? 5 - media.length : 5,
        quality: 0.8,
        videoQuality: 'high',
      });

      if (result.didCancel || !result.assets) return;

      // Validate video duration (max 59 seconds)
      for (const asset of result.assets) {
        if (asset.type?.startsWith('video') && asset.duration) {
          if (asset.duration > 59) {
            Alert.alert(
              'Video Too Long',
              `Videos must be 59 seconds or less. The selected video is ${Math.round(asset.duration)} seconds long.`
            );
            return;
          }
        }
      }

      const newMedia: MediaItem[] = result.assets
        .filter((asset) => asset.uri && asset.fileName)
        .map((asset) => ({
          uri: asset.uri!,
          type: asset.type?.startsWith('video') ? 'video' : 'image',
          fileName: asset.fileName!,
          duration: asset.duration,
        }));

      const hasVideo = newMedia.some((m) => m.type === 'video') || media.some((m) => m.type === 'video');
      if (hasVideo && media.length + newMedia.length > 1) {
        Alert.alert('Video Limit', 'You can only upload 1 video per post, or up to 5 images.');
        return;
      }

      setMedia((prev) => [...prev, ...newMedia]);
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const applyFilter = (index: number, filter: string) => {
    setMedia((prev) =>
      prev.map((item, i) => (i === index ? { ...item, filter } : item))
    );
  };

  const handleCaptionChange = (text: string) => {
    setCaption(text);
  };

  const handleAICaptionGenerated = (generatedCaption: string) => {
    setCaption(generatedCaption);
    setIsAI(true);
  };

  const openPetSheet = () => {
    petSheetRef.current?.expand();
  };

  const closePetSheet = () => {
    petSheetRef.current?.close();
  };

  const handlePetSelect = (pet: SelectedPet) => {
    setSelectedPet(pet);
    closePetSheet();
  };

  const handlePetRemove = () => {
    setSelectedPet(null);
  };

  const openLocationSheet = () => {
    locationSheetRef.current?.expand();
  };

  const closeLocationSheet = () => {
    locationSheetRef.current?.close();
  };

  const handleLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation(location);
    closeLocationSheet();
  };

  const handleLocationRemove = () => {
    setSelectedLocation(null);
  };

  const openCommunitySheet = () => {
    communitySheetRef.current?.expand();
  };

  const closeCommunitySheet = () => {
    communitySheetRef.current?.close();
  };

  const handleCommunitySelect = (community: SelectedCommunity) => {
    setSelectedCommunity(community);
    closeCommunitySheet();
  };

  const handleCommunityRemove = () => {
    setSelectedCommunity(null);
  };

  // ─── Upload Mutation ──────────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return postApi.createPost(formData);
    },
    onSuccess: (newPost) => {
      // Optimistically prepend the new post to the feed
      queryClient.setQueryData(QUERY_KEYS.FEED, (oldData: any) => {
        if (!oldData) return { pages: [{ items: [newPost], nextCursor: null, hasMore: false }], pageParams: [undefined] };
        const firstPage = oldData.pages[0];
        return {
          ...oldData,
          pages: [
            { ...firstPage, items: [newPost, ...firstPage.items] },
            ...oldData.pages.slice(1),
          ],
        };
      });

      // Invalidate to refresh in the background
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEED });

      Alert.alert('Success', 'Your post has been shared!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Something went wrong. Please try again.');
    },
  });

  const handleShare = async () => {
    if (media.length === 0) {
      Alert.alert('No Media', 'Please add at least one photo or video.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('caption', caption.trim());
      formData.append('isAI', String(isAI));

      if (selectedPet) {
        formData.append('petId', selectedPet._id);
      }

      if (selectedLocation) {
        formData.append('locationName', selectedLocation.name);
        formData.append('locationLng', String(selectedLocation.coordinates[0]));
        formData.append('locationLat', String(selectedLocation.coordinates[1]));
      }

      if (selectedCommunity) {
        formData.append('communityId', selectedCommunity._id);
      }

      // Extract hashtags from caption
      const hashtagMatches = caption.match(/#[a-zA-Z0-9_]+/g);
      if (hashtagMatches) {
        hashtagMatches.forEach((tag) => {
          formData.append('hashtags', tag.slice(1).toLowerCase());
        });
      }

      // Add media files
      for (const item of media) {
        const fileExtension = item.fileName.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
        const mimeType = item.type === 'video' ? `video/${fileExtension}` : `image/${fileExtension}`;

        formData.append('media', {
          uri: item.uri,
          type: mimeType,
          name: item.fileName,
        } as any);
      }

      // Simulate progress (real progress requires XMLHttpRequest or axios onUploadProgress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await uploadMutation.mutateAsync(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (media.length > 0 || caption.trim().length > 0) {
      Alert.alert('Discard Post?', 'Are you sure you want to discard this post?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <CreatePostHeader
        onCancel={handleCancel}
        onShare={handleShare}
        disabled={media.length === 0 || isUploading}
        isUploading={isUploading}
      />

      {isUploading && <UploadProgressBar progress={uploadProgress} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MediaSection
            media={media}
            onPickMedia={pickMedia}
            onRemoveMedia={removeMedia}
            onApplyFilter={applyFilter}
          />

          <CaptionSection
            caption={caption}
            onCaptionChange={handleCaptionChange}
            onAICaptionGenerated={handleAICaptionGenerated}
            pet={selectedPet}
            mediaUri={media[0]?.uri}
          />

          <DetailsSection
            selectedPet={selectedPet}
            selectedLocation={selectedLocation}
            selectedCommunity={selectedCommunity}
            onOpenPetSheet={openPetSheet}
            onOpenLocationSheet={openLocationSheet}
            onOpenCommunitySheet={openCommunitySheet}
            onRemovePet={handlePetRemove}
            onRemoveLocation={handleLocationRemove}
            onRemoveCommunity={handleCommunityRemove}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PetTagSheet
        ref={petSheetRef}
        snapPoints={snapPoints}
        onSelectPet={handlePetSelect}
      />

      <LocationSheet
        ref={locationSheetRef}
        snapPoints={snapPoints}
        onSelectLocation={handleLocationSelect}
      />

      <CommunitySheet
        ref={communitySheetRef}
        snapPoints={snapPoints}
        onSelectCommunity={handleCommunitySelect}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
});

export default CreatePostScreen;
