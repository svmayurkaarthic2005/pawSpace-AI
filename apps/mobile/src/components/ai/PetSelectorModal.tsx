import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { PetProfile } from '../../services/aiAssistant.service';

interface PetSelectorModalProps {
  visible: boolean;
  pets: PetProfile[];
  selectedPetId?: string;
  onSelect: (pet: PetProfile) => void;
  onClose: () => void;
}

const PetSelectorModal: React.FC<PetSelectorModalProps> = ({
  visible,
  pets,
  selectedPetId,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const handleSelect = (pet: PetProfile) => {
    onSelect(pet);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select a pet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Pet list */}
          <FlatList
            data={pets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.petRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.petLeft}>
                  {item.species ? (
                    <View style={styles.petImagePlaceholder}>
                      <Icon
                        name={item.species === 'dog' ? 'paw' : 'paw-outline'}
                        size={24}
                        color="#7C3AED"
                      />
                    </View>
                  ) : (
                    <View style={styles.petImagePlaceholder}>
                      <Icon name="paw" size={24} color="#7C3AED" />
                    </View>
                  )}
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{item.name}</Text>
                    <Text style={styles.petDetails}>
                      {[item.breed, item.age ? `${item.age}y` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </View>

                {selectedPetId === item.id && (
                  <Icon name="checkmark-circle" size={24} color="#7C3AED" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="paw-outline" size={48} color="#4B5563" />
                <Text style={styles.emptyText}>No pets found</Text>
                <Text style={styles.emptySubtext}>
                  Add a pet to start chatting with AI
                </Text>
              </View>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  petLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  petImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  petDetails: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
});

export default PetSelectorModal;
