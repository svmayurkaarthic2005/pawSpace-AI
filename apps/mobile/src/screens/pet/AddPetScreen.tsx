import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { ProfileStackParamList } from '../../types';
import { petApi } from '../../services/post.service';
import { FONT_SIZE, SPACING, QUERY_KEYS } from '../../constants';

type AddPetNavProp = NativeStackNavigationProp<ProfileStackParamList, 'AddPet'>;

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'] as const;
type Species = typeof SPECIES[number];

// Map display names to API values
const SPECIES_MAP: Record<Species, string> = {
  'Dog': 'dog',
  'Cat': 'cat',
  'Bird': 'bird',
  'Rabbit': 'rabbit',
  'Other': 'other',
};

const AddPetScreen: React.FC = () => {
  const navigation = useNavigation<AddPetNavProp>();
  const queryClient = useQueryClient();

  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState<Species>('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!petName.trim()) {
      Alert.alert('Required', 'Please enter your pet\'s name');
      return;
    }

    setIsSubmitting(true);
    try {
      await petApi.createPet({
        name: petName.trim(),
        species: SPECIES_MAP[species], // Use lowercase for API
        breed: breed.trim() || undefined,
        age: age ? parseInt(age) : undefined,
        gender,
        bio: bio.trim() || undefined,
      });

      // Invalidate pets query to refresh the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PETS });

      Alert.alert('Success', 'Pet added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Failed to add pet. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Pet</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Add your pet 🐾</Text>
          <Text style={styles.subtitle}>Let's create a profile for your furry friend</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Pet Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Pet Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Max, Bella, Charlie"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={petName}
                onChangeText={setPetName}
                autoCapitalize="words"
              />
            </View>

            {/* Species */}
            <View style={styles.field}>
              <Text style={styles.label}>Species *</Text>
              <View style={styles.chipRow}>
                {SPECIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, species === s && styles.chipActive]}
                    onPress={() => setSpecies(s)}
                  >
                    <Text style={[styles.chipText, species === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Breed */}
            <View style={styles.field}>
              <Text style={styles.label}>Breed (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Golden Retriever, Persian"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={breed}
                onChangeText={setBreed}
                autoCapitalize="words"
              />
            </View>

            {/* Age */}
            <View style={styles.field}>
              <Text style={styles.label}>Age (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Age in years"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, gender === 'male' && styles.chipActive]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[styles.chipText, gender === 'male' && styles.chipTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, gender === 'female' && styles.chipActive]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[styles.chipText, gender === 'female' && styles.chipTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bio */}
            <View style={styles.field}>
              <Text style={styles.label}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your pet..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Add Pet</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddPetScreen;
