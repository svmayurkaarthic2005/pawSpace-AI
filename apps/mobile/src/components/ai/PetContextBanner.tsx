import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PetProfile } from '../../services/aiAssistant.service';

interface PetContextBannerProps {
  pet: PetProfile;
  onClose: () => void;
}

const PetContextBanner: React.FC<PetContextBannerProps> = ({ pet, onClose }) => {
  const petInfo = [pet.name];
  if (pet.breed) petInfo.push(pet.breed);
  if (pet.age) petInfo.push(`${pet.age}y`);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="paw" size={16} color="#C4B5FD" />
        <Text style={styles.text}>
          Chatting about: {petInfo.join(', ')}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Icon name="close" size={18} color="#C4B5FD" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: '#C4B5FD',
    fontWeight: '600',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

export default PetContextBanner;
