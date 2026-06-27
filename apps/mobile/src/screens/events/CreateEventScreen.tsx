import React, { useState } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  ToastAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
// Pure-JS date/time picker — no native module required
import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Geolocation from '@react-native-community/geolocation';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';
import { eventService } from '../../services/event.service';
import { MapView, PROVIDER_GOOGLE, mapModuleError, MapErrorFallback } from '../../components/map/MapWrapper';
import lightMapStyle from '../../constants/googleMapLightStyle.json';

const SPECIES_OPTIONS = [
  { value: 'dog', label: '🐕 Dogs', icon: '🐕' },
  { value: 'cat', label: '🐈 Cats', icon: '🐈' },
  { value: 'bird', label: '🐦 Birds', icon: '🐦' },
  { value: 'rabbit', label: '🐰 Rabbits', icon: '🐰' },
  { value: 'all', label: '🐾 All Pets', icon: '🐾' },
];

const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<string>('');
  const [coverImage, setCoverImage] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours later
  // Custom pure-JS date/time picker
  const [datePickerTarget, setDatePickerTarget] = useState<'startDate' | 'startTime' | 'endDate' | 'endTime' | null>(null);
  const [pickerTemp, setPickerTemp] = useState({ month: 1, day: 1, year: new Date().getFullYear(), hour: 0, minute: 0 });
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [maxAttendees, setMaxAttendees] = useState('');
  const [tags, setTags] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 13.0827,
    longitude: 80.2707,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Title is required');
      if (!description.trim()) throw new Error('Description is required');
      if (!location) throw new Error('Location is required');
      if (selectedSpecies.length === 0) throw new Error('Select at least one pet type');
      if (endDate <= startDate) throw new Error('End date must be after start date');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('address', location);
      formData.append('locationName', location);
      formData.append('startDate', startDate.toISOString());
      formData.append('endDate', endDate.toISOString());
      
      selectedSpecies.forEach((species) => {
        formData.append('petFriendlySpecies[]', species);
      });

      if (maxAttendees) {
        formData.append('maxAttendees', maxAttendees);
      }

      if (tags.trim()) {
        const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
        tagArray.forEach((tag) => {
          formData.append('tags[]', tag);
        });
      }

      if (coverImage) {
        formData.append('coverImage', {
          uri: coverImage.uri,
          type: coverImage.type || 'image/jpeg',
          name: coverImage.name || `event_${Date.now()}.jpg`,
        } as any);
      }

      return eventService.createEvent(formData);
    },
    onSuccess: (event) => {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      queryClient.invalidateQueries({ queryKey: ['map-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      Alert.alert('Success', 'Event created successfully!', [
        {
          text: 'View Event',
          onPress: () => {
            navigation.replace('EventDetail', { eventId: event._id });
          },
        },
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      ReactNativeHapticFeedback.trigger('notificationError');
      console.error('Create event error:', error);
      Alert.alert('Error', error.message || 'Failed to create event');
    },
  });

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.assets?.[0]) {
        const asset = result.assets[0];
        setCoverImage({
          uri: asset.uri!,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `event_${Date.now()}.jpg`,
        });
        ReactNativeHapticFeedback.trigger('impactLight');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const toggleSpecies = (species: string) => {
    if (selectedSpecies.includes(species)) {
      setSelectedSpecies(selectedSpecies.filter((s) => s !== species));
    } else {
      setSelectedSpecies([...selectedSpecies, species]);
    }
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  const handleUseCurrentLocation = async () => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location to find you.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
    
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Raw GPS Coords:', { latitude, longitude });
        
        try {
          const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
          
          // Log URL with masked API key
          const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING';
          console.log('🌍 Geocoding API URL called:', `${geocodeUrl}?latlng=${latitude},${longitude}&key=${maskedKey}`);
          
          const response = await axios.get(geocodeUrl, {
            params: {
              latlng: `${latitude},${longitude}`,
              key: apiKey
            },
            timeout: 10000 // 10000ms timeout
          });
          
          const data = response.data;
          console.log('🌍 Geocode Response Status:', data.status);
          
          if (data.results && data.results[0]) {
            const address = data.results[0].formatted_address;
            setLocation(address);
            ReactNativeHapticFeedback.trigger('notificationSuccess');
          } else {
            console.warn('Geocoding failed, no results found. Full response:', data);
            throw new Error('No geocoding results');
          }
        } catch (error: any) {
          console.error('Reverse geocoding error:', error.message || error);
          
          // Added detailed logging per requirements
          if (error.isAxiosError) {
            console.log('🌍 Axios Error Details:', {
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              code: error.code,
              message: error.message,
              hasResponse: !!error.response
            });
          }
          
          // Fallback logic
          const fallbackLocation = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(fallbackLocation);
          
          if (Platform.OS === 'android') {
            ToastAndroid.show('Could not fetch address, but location detected', ToastAndroid.SHORT);
          } else {
            Alert.alert('Location Detected', 'Could not fetch address, but exact coordinates were saved.');
          }
        }
      },
      (error) => {
        console.error('Location error:', error);
        Alert.alert('Error', 'Failed to get current location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleConfirmMapLocation = async () => {
    setIsGeocoding(true);
    try {
      const { latitude, longitude } = mapRegion;
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
      const response = await axios.get(geocodeUrl, {
        params: { latlng: `${latitude},${longitude}`, key: apiKey },
        timeout: 10000
      });
      const data = response.data;
      if (data.results && data.results[0]) {
        const address = data.results[0].formatted_address;
        setLocation(address);
        ReactNativeHapticFeedback.trigger('notificationSuccess');
      } else {
        throw new Error('No geocoding results');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      const fallbackLocation = `${mapRegion.latitude.toFixed(6)}, ${mapRegion.longitude.toFixed(6)}`;
      setLocation(fallbackLocation);
    } finally {
      setIsGeocoding(false);
      setShowMapPicker(false);
    }
  };

  const handleCreate = () => {
    createMutation.mutate();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.createButton]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover Image */}
        <TouchableOpacity style={styles.coverImageContainer} onPress={handlePickImage}>
          {coverImage ? (
            <FastImage source={{ uri: coverImage.uri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverImagePlaceholder}>
              <Icon name="image-outline" size={48} color="#6B7280" />
              <Text style={styles.coverImagePlaceholderText}>Add cover image</Text>
            </View>
          )}
          <View style={styles.coverImageOverlay}>
            <Icon name="camera" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dog Park Meetup"
            placeholderTextColor="#6B7280"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell people what to expect..."
            placeholderTextColor="#6B7280"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Location *</Text>
            <TouchableOpacity 
              style={styles.currentLocationBtn}
              onPress={handleUseCurrentLocation}
            >
              <Icon name="navigate" size={16} color="#7C3AED" />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.mapPickerTrigger}
            onPress={() => setShowMapPicker(true)}
          >
            <Icon name="map-outline" size={20} color="#7C3AED" />
            <Text style={styles.mapPickerTriggerText}>
              Pick Location on Map
            </Text>
          </TouchableOpacity>

          {location ? (
            <View style={styles.selectedLocation}>
              <Icon name="location" size={16} color="#7C3AED" />
              <Text style={styles.selectedLocationText} numberOfLines={2}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Start Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Start Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setPickerTemp({ month: startDate.getMonth() + 1, day: startDate.getDate(), year: startDate.getFullYear(), hour: startDate.getHours(), minute: startDate.getMinutes() });
                setDatePickerTarget('startDate');
              }}
            >
              <Icon name="calendar-outline" size={20} color="#7C3AED" />
              <Text style={styles.dateTimeButtonText}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setPickerTemp({ month: startDate.getMonth() + 1, day: startDate.getDate(), year: startDate.getFullYear(), hour: startDate.getHours(), minute: startDate.getMinutes() });
                setDatePickerTarget('startTime');
              }}
            >
              <Icon name="time-outline" size={20} color="#7C3AED" />
              <Text style={styles.dateTimeButtonText}>
                {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* End Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>End Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setPickerTemp({ month: endDate.getMonth() + 1, day: endDate.getDate(), year: endDate.getFullYear(), hour: endDate.getHours(), minute: endDate.getMinutes() });
                setDatePickerTarget('endDate');
              }}
            >
              <Icon name="calendar-outline" size={20} color="#7C3AED" />
              <Text style={styles.dateTimeButtonText}>
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setPickerTemp({ month: endDate.getMonth() + 1, day: endDate.getDate(), year: endDate.getFullYear(), hour: endDate.getHours(), minute: endDate.getMinutes() });
                setDatePickerTarget('endTime');
              }}
            >
              <Icon name="time-outline" size={20} color="#7C3AED" />
              <Text style={styles.dateTimeButtonText}>
                {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pet-Friendly Species */}
        <View style={styles.section}>
          <Text style={styles.label}>Pet-Friendly For *</Text>
          <View style={styles.speciesGrid}>
            {SPECIES_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.speciesChip,
                  selectedSpecies.includes(option.value) && styles.speciesChipActive,
                ]}
                onPress={() => toggleSpecies(option.value)}
              >
                <Text style={styles.speciesIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.speciesLabel,
                    selectedSpecies.includes(option.value) && styles.speciesLabelActive,
                  ]}
                >
                  {option.label.replace(/^[^\s]+\s/, '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max Attendees */}
        <View style={styles.section}>
          <Text style={styles.label}>Max Attendees (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Leave empty for unlimited"
            placeholderTextColor="#6B7280"
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Separate with commas (e.g., playdate, outdoor, training)"
            placeholderTextColor="#6B7280"
            value={tags}
            onChangeText={setTags}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Pure-JS Date/Time Picker Modal */}
      <Modal visible={datePickerTarget !== null} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>
              {datePickerTarget === 'startDate' ? 'Start Date'
                : datePickerTarget === 'startTime' ? 'Start Time'
                : datePickerTarget === 'endDate' ? 'End Date'
                : 'End Time'}
            </Text>

            {(datePickerTarget === 'startDate' || datePickerTarget === 'endDate') ? (
              <View style={styles.pickerRow}>
                {/* Month */}
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Month</Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, month: p.month < 12 ? p.month + 1 : 1 }))}>
                    <Icon name="chevron-up" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>
                    {new Date(pickerTemp.year, pickerTemp.month - 1).toLocaleString('en-US', { month: 'short' })}
                  </Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, month: p.month > 1 ? p.month - 1 : 12 }))}>
                    <Icon name="chevron-down" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
                {/* Day */}
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Day</Text>
                  <TouchableOpacity onPress={() => {
                    const max = new Date(pickerTemp.year, pickerTemp.month, 0).getDate();
                    setPickerTemp(p => ({ ...p, day: p.day < max ? p.day + 1 : 1 }));
                  }}>
                    <Icon name="chevron-up" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{String(pickerTemp.day).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => {
                    const max = new Date(pickerTemp.year, pickerTemp.month, 0).getDate();
                    setPickerTemp(p => ({ ...p, day: p.day > 1 ? p.day - 1 : max }));
                  }}>
                    <Icon name="chevron-down" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
                {/* Year */}
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Year</Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, year: p.year + 1 }))}>
                    <Icon name="chevron-up" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{pickerTemp.year}</Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, year: p.year > new Date().getFullYear() ? p.year - 1 : p.year }))}>
                    <Icon name="chevron-down" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.pickerRow}>
                {/* Hour */}
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Hour</Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, hour: p.hour < 23 ? p.hour + 1 : 0 }))}>
                    <Icon name="chevron-up" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{String(pickerTemp.hour).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, hour: p.hour > 0 ? p.hour - 1 : 23 }))}>
                    <Icon name="chevron-down" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
                {/* Minute */}
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Minute</Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, minute: p.minute < 59 ? p.minute + 1 : 0 }))}>
                    <Icon name="chevron-up" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{String(pickerTemp.minute).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setPickerTemp(p => ({ ...p, minute: p.minute > 0 ? p.minute - 1 : 59 }))}>
                    <Icon name="chevron-down" size={22} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.pickerButtons}>
              <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setDatePickerTarget(null)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerConfirmBtn}
                onPress={() => {
                  if (datePickerTarget === 'startDate') {
                    const d = new Date(startDate);
                    d.setFullYear(pickerTemp.year, pickerTemp.month - 1, pickerTemp.day);
                    if (d < new Date()) {
                      Alert.alert('Invalid Date', 'Start date cannot be in the past');
                      return;
                    }
                    setStartDate(d);
                  } else if (datePickerTarget === 'startTime') {
                    const d = new Date(startDate);
                    d.setHours(pickerTemp.hour, pickerTemp.minute);
                    setStartDate(d);
                  } else if (datePickerTarget === 'endDate') {
                    const d = new Date(endDate);
                    d.setFullYear(pickerTemp.year, pickerTemp.month - 1, pickerTemp.day);
                    setEndDate(d);
                  } else if (datePickerTarget === 'endTime') {
                    const d = new Date(endDate);
                    d.setHours(pickerTemp.hour, pickerTemp.minute);
                    setEndDate(d);
                  }
                  setDatePickerTarget(null);
                }}
              >
                <Text style={styles.pickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Picker Modal */}
      <Modal visible={showMapPicker} animationType="slide" transparent={false}>
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity onPress={() => setShowMapPicker(false)} style={styles.mapModalClose}>
              <Icon name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>Pick Location</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <View style={styles.mapWrapper}>
            {mapModuleError || !MapView ? (
              <MapErrorFallback error={mapModuleError || new Error('MapView not available')} />
            ) : (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                customMapStyle={lightMapStyle as any}
                initialRegion={mapRegion}
                onRegionChangeComplete={(region: any) => setMapRegion(region)}
                showsUserLocation
              />
            )}
            
            {/* Center Pin Overlay */}
            <View style={styles.centerPinContainer} pointerEvents="none">
              <Icon name="location" size={40} color="#EF4444" style={styles.centerPin} />
            </View>
          </View>

          <View style={styles.mapModalFooter}>
            <TouchableOpacity 
              style={styles.confirmMapBtn}
              onPress={handleConfirmMapLocation}
              disabled={isGeocoding}
            >
              {isGeocoding ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmMapText}>Confirm Location</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + 8,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerButton: {
    padding: SPACING.xs,
    minWidth: 70,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButton: {
    alignItems: 'flex-end',
  },
  createButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#7C3AED',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#1F2937',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImagePlaceholderText: {
    fontSize: FONT_SIZE.md,
    color: '#6B7280',
    marginTop: SPACING.sm,
  },
  coverImageOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  currentLocationText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.sm + 2,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  locationContainer: {
    backgroundColor: 'transparent',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  selectedLocationText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#D1D5DB',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: '#374151',
  },
  dateTimeButtonText: {
    fontSize: FONT_SIZE.sm,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  speciesChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: '#7C3AED',
  },
  speciesIcon: {
    fontSize: 18,
  },
  speciesLabel: {
    fontSize: FONT_SIZE.sm,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  speciesLabelActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  mapPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    justifyContent: 'center',
  },
  mapPickerTriggerText: {
    color: '#7C3AED',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#0D0D1A',
    zIndex: 10,
  },
  mapModalClose: {
    padding: SPACING.xs,
  },
  mapModalTitle: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  centerPinContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPin: {
    marginTop: -20, // Offset for pin point
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mapModalFooter: {
    padding: SPACING.xl,
    backgroundColor: '#0D0D1A',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  confirmMapBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmMapText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  // ── Custom Date/Time Picker ────────────────────────────────────────────────
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 24,
  },
  pickerCol: {
    alignItems: 'center',
    gap: 10,
    minWidth: 72,
  },
  pickerLabel: {
    color: '#6B7280',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  pickerCancelText: {
    color: '#9CA3AF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  pickerConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  pickerConfirmText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

export default CreateEventScreen;
