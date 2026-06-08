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
        <MaterialCommunityIcons name="paw" size={14} color="#A78BFA" />
        <Text style={styles.text}>
          Chatting about: {petInfo.join(', ')}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Icon name="close" size={16} color="#A78BFA" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  text: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '500',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
});

export default PetContextBanner;
