import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, ActivityIndicator, StatusBar, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { ProfileStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../services/user.service';
import { COLORS, SPACING, FONT_SIZE, QUERY_KEYS } from '../../constants';
import Avatar from '../../components/ui/Avatar';
import LocationAutocomplete from '../../components/LocationAutocomplete';

type EditProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavProp>();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  
  // Use ref to track if component is mounted - prevents state updates after unmount
  const isMountedRef = useRef(true);
  
  // Track if a save operation is in progress
  const saveInProgressRef = useRef(false);

  const [name, setName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.locationName || '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUrl);
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>(user?.coverImage);
  const [newAvatarFile, setNewAvatarFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      username: string; 
      bio: string; 
      locationName: string;
      avatarFile?: { uri: string; type: string; name: string };
      coverFile?: { uri: string; type: string; name: string };
    }) => {
      // Mark save in progress
      saveInProgressRef.current = true;
      
      // If there's a new avatar or cover, upload them
      if (data.avatarFile || data.coverFile) {
        const formData = new FormData();
        
        if (data.avatarFile) {
          formData.append('avatar', {
            uri: data.avatarFile.uri,
            type: data.avatarFile.type,
            name: data.avatarFile.name,
          } as any);
        }
        
        if (data.coverFile) {
          formData.append('coverImage', {
            uri: data.coverFile.uri,
            type: data.coverFile.type,
            name: data.coverFile.name,
          } as any);
        }
        
        formData.append('name', data.name);
        formData.append('username', data.username);
        formData.append('bio', data.bio);
        formData.append('locationName', data.locationName);
        
        return userApi.updateProfileWithAvatar(formData);
      } else {
        return userApi.updateProfile({
          name: data.name,
          username: data.username,
          bio: data.bio,
          locationName: data.locationName,
        });
      }
    },
    onSuccess: (updatedUser) => {
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('[EditProfile] Component unmounted, skipping state update');
        return;
      }

      saveInProgressRef.current = false;
      setUser(updatedUser);
      
      // Invalidate queries to refetch data
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
      
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (isMountedRef.current) {
              navigation.goBack();
            }
          },
        },
      ]);
    },
    onError: (error: any) => {
      // Only show error if component is still mounted
      if (!isMountedRef.current) {
        console.log('[EditProfile] Component unmounted, skipping error alert');
        return;
      }

      saveInProgressRef.current = false;
      const message = error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', message);
    },
  });

  const handleSave = () => {
    // Prevent duplicate saves
    if (saveInProgressRef.current || updateMutation.isPending) {
      console.log('[EditProfile] Save already in progress, ignoring');
      return;
    }

    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    // Trigger mutation
    updateMutation.mutate({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      locationName: location.trim(),
      avatarFile: newAvatarFile || undefined,
      coverFile: newCoverFile || undefined,
    });
  };

  const handleChangePhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        videoQuality: 'high',
        selectionLimit: 1,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate video duration (max 59 seconds)
        if (asset.type?.startsWith('video') && asset.duration) {
          if (asset.duration > 59) {
            Alert.alert(
              'Video Too Long',
              `Videos must be 59 seconds or less. The selected video is ${Math.round(asset.duration)} seconds long.`
            );
            return;
          }
        }
        
        setAvatarUri(asset.uri);
        setNewAvatarFile({
          uri: asset.uri!,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'avatar.jpg',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleChangeCover = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        videoQuality: 'high',
        selectionLimit: 1,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate video duration (max 59 seconds)
        if (asset.type?.startsWith('video') && asset.duration) {
          if (asset.duration > 59) {
            Alert.alert(
              'Video Too Long',
              `Videos must be 59 seconds or less. The selected video is ${Math.round(asset.duration)} seconds long.`
            );
            return;
          }
        }
        
        setCoverImageUri(asset.uri);
        setNewCoverFile({
          uri: asset.uri!,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'cover.jpg',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleBack = () => {
    // Warn if save is in progress
    if (saveInProgressRef.current || updateMutation.isPending) {
      Alert.alert(
        'Save in Progress',
        'Your profile is being saved. Please wait.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.goBack();
  };

  // Follow app's dark theme strictly
  const bg = '#0D0D1A';
  const cardBg = '#1A1A2E';
  const textColor = '#FFFFFF';
  const subColor = '#9CA3AF';
  const borderColor = '#2D2D4E';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={updateMutation.isPending || saveInProgressRef.current}
          style={[styles.saveBtn, (updateMutation.isPending || saveInProgressRef.current) && styles.saveBtnDisabled]}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveText, 
              { color: (updateMutation.isPending || saveInProgressRef.current) ? '#6B7280' : COLORS.primary }
            ]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!updateMutation.isPending}
      >
        {/* Cover Image */}
        <View style={styles.coverSection}>
          <View style={styles.coverImageContainer}>
            {coverImageUri ? (
              <Image source={{ uri: coverImageUri }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverImage, { backgroundColor: '#1F2937' }]} />
            )}
            <TouchableOpacity 
              style={styles.changeCoverBtn}
              onPress={handleChangeCover}
              disabled={updateMutation.isPending}
            >
              <Icon name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.changeCoverText}>Change Cover</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={avatarUri}
            name={user?.displayName}
            size="xl"
          />
          <TouchableOpacity 
            style={styles.changePhotoBtn}
            onPress={handleChangePhoto}
            disabled={updateMutation.isPending}
          >
            <Text style={[styles.changePhotoText, { color: COLORS.primary }]}>
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.label, { color: subColor }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={subColor}
            maxLength={50}
            editable={!updateMutation.isPending}
          />
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.label, { color: subColor }]}>Username</Text>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={username}
            onChangeText={setUsername}
            placeholder="username"
            placeholderTextColor={subColor}
            autoCapitalize="none"
            maxLength={30}
            editable={!updateMutation.isPending}
          />
          <Text style={[styles.hint, { color: subColor }]}>
            @{username || 'username'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.label, { color: subColor }]}>Bio</Text>
          <TextInput
            style={[styles.textArea, { color: textColor, borderColor }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={subColor}
            multiline
            numberOfLines={4}
            maxLength={500}
            editable={!updateMutation.isPending}
          />
          <Text style={[styles.hint, { color: subColor }]}>
            {bio.length}/500
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.label, { color: subColor }]}>Location</Text>
          {!updateMutation.isPending ? (
            <LocationAutocomplete
              value={location}
              onChangeText={setLocation}
              onSelectLocation={setLocation}
              placeholder="City, Country"
            />
          ) : (
            <View style={[styles.input, { borderColor }]}>
              <Text style={{ color: textColor }}>{location || 'City, Country'}</Text>
            </View>
          )}
          <Text style={[styles.hint, { color: subColor }]}>
            Where are you based? Start typing for suggestions
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 52,
    paddingBottom: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  saveBtn: { padding: SPACING.xs, minWidth: 60, alignItems: 'flex-end' },
  saveText: { fontSize: 16, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  coverSection: {
    marginHorizontal: -SPACING.md,
    marginTop: -SPACING.md,
  },
  coverImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  changeCoverBtn: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  changeCoverText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: SPACING.lg,
  },
  changePhotoBtn: { marginTop: SPACING.md },
  changePhotoText: { fontSize: 14, fontWeight: '600' },
  section: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
});

export default EditProfileScreen;
