import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, useColorScheme, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { petApi } from '../../services/post.service';
import { FONT_SIZE, SPACING, QUERY_KEYS } from '../../constants';

type Props = NativeStackScreenProps<any, 'EditPet'>;

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog', emoji: '🐕' },
  { value: 'cat', label: 'Cat', emoji: '🐈' },
  { value: 'bird', label: 'Bird', emoji: '🐦' },
  { value: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { value: 'other', label: 'Other', emoji: '🐾' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const EditPetScreen: React.FC<Props> = ({ route, navigation }) => {
  const { petId } = (route.params ?? {}) as any;
  const isDark = useColorScheme() === 'dark';
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [bio, setBio] = useState('');

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => petApi.getPetById(petId),
  });

  useEffect(() => {
    if (pet) {
      setName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed || '');
      setAge(pet.age?.toString() || '');
      setGender(pet.gender || 'male');
      setBio(pet.bio || '');
    }
  }, [pet]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      name?: string; species?: string; breed?: string;
      age?: number; gender?: string; bio?: string;
    }) => petApi.updatePet(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', petId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_PETS] });
      Alert.alert('Success', 'Pet updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update pet');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Pet name is required');
      return;
    }

    const ageNum = age ? parseInt(age, 10) : undefined;
    if (age && (isNaN(ageNum!) || ageNum! < 0 || ageNum! > 50)) {
      Alert.alert('Error', 'Please enter a valid age (0-50)');
      return;
    }

    updateMutation.mutate({
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      age: ageNum,
      gender,
      bio: bio.trim() || undefined,
    });
  };

  const bg = isDark ? '#080810' : '#F8F8FF';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#0F0F1E' : '#F3F4F6';
  const borderColor = isDark ? '#2D2D4E' : '#E5E7EB';

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.root, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.headerBtn, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Edit Pet</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <Text style={[styles.headerBtn, styles.saveBtn]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.label, { color: subColor }]}>Pet Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter pet name"
              placeholderTextColor={subColor}
              maxLength={30}
            />
          </View>

          {/* Species */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.label, { color: subColor }]}>Species</Text>
            <View style={styles.optionsRow}>
              {SPECIES_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionChip,
                    { borderColor },
                    species === option.value && styles.optionChipActive,
                  ]}
                  onPress={() => setSpecies(option.value)}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: textColor },
                      species === option.value && styles.optionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Breed */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.label, { color: subColor }]}>Breed (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
              value={breed}
              onChangeText={setBreed}
              placeholder="e.g., Golden Retriever"
              placeholderTextColor={subColor}
              maxLength={50}
            />
          </View>

          {/* Age */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.label, { color: subColor }]}>Age (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
              value={age}
              onChangeText={setAge}
              placeholder="Age in years"
              placeholderTextColor={subColor}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          {/* Gender */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.label, { color: subColor }]}>Gender</Text>
            <View style={styles.optionsRow}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderChip,
                    { borderColor },
                    gender === option.value && styles.optionChipActive,
                  ]}
                  onPress={() => setGender(option.value)}
                >
                  <Text
                    style={[
                      styles.genderLabel,
                      { color: textColor },
                      gender === option.value && styles.optionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.label, { color: subColor }]}>Bio (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: inputBg, color: textColor, borderColor },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about your pet..."
              placeholderTextColor={subColor}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: subColor }]}>
              {bio.length}/200
            </Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerBtn: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    minWidth: 60,
  },
  saveBtn: { color: '#7C3AED' },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  section: {
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    height: 100,
    paddingTop: SPACING.sm,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 6,
  },
  optionChipActive: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderColor: '#7C3AED',
  },
  optionEmoji: { fontSize: 18 },
  optionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  optionLabelActive: { color: '#7C3AED' },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: SPACING.sm,
  },
  genderLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  bottomPadding: { height: SPACING.xl },
});

export default EditPetScreen;
