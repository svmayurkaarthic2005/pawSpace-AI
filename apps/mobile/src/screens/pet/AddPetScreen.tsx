import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';

type AddPetNavProp = NativeStackNavigationProp<ProfileStackParamList, 'AddPet'>;

const AddPetScreen: React.FC = () => {
  const navigation = useNavigation<AddPetNavProp>();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Add a Pet</Text>
      {/* TODO: Implement add pet form */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', padding: 20 },
  back: { marginTop: 60, marginBottom: 20 },
  backText: { color: '#7C3AED', fontSize: 16 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
});

export default AddPetScreen;
