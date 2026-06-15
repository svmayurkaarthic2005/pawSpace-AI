import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { SelectedPet, SelectedLocation, SelectedCommunity } from '../../screens/feed/CreatePostScreen';

interface DetailsSectionProps {
  selectedPet: SelectedPet | null;
  selectedLocation: SelectedLocation | null;
  selectedCommunity: SelectedCommunity | null;
  onOpenPetSheet: () => void;
  onOpenLocationSheet: () => void;
  onOpenCommunitySheet: () => void;
  onRemovePet: () => void;
  onRemoveLocation: () => void;
  onRemoveCommunity: () => void;
}

const DetailsSection: React.FC<DetailsSectionProps> = ({
  selectedPet,
  selectedLocation,
  selectedCommunity,
  onOpenPetSheet,
  onOpenLocationSheet,
  onOpenCommunitySheet,
  onRemovePet,
  onRemoveLocation,
  onRemoveCommunity,
}) => {
  return (
    <View style={styles.container}>
      {/* Pet Tag */}
      <TouchableOpacity style={styles.row} onPress={onOpenPetSheet} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(124,58,237,0.15)' }]}>
          <Icon name="paw" size={24} color="#7C3AED" />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Tag a pet</Text>
          {selectedPet && (
            <View style={styles.selectedContainer}>
              {selectedPet.images?.[0] && (
                <FastImage
                  source={{ uri: selectedPet.images[0].url }}
                  style={styles.petAvatar}
                />
              )}
              <Text style={styles.selectedText} numberOfLines={1}>{selectedPet.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {selectedPet ? (
            <TouchableOpacity onPress={onRemovePet} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <Icon name="chevron-forward" size={24} color="rgba(255,255,255,0.4)" />
          )}
        </View>
      </TouchableOpacity>

      {/* Location */}
      <TouchableOpacity style={styles.row} onPress={onOpenLocationSheet} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
          <Icon name="location-sharp" size={24} color="#10B981" />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Add location</Text>
          {selectedLocation && (
            <View style={styles.selectedContainer}>
              <Text style={[styles.selectedText, { color: '#10B981' }]} numberOfLines={1}>
                {selectedLocation.name}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {selectedLocation ? (
            <TouchableOpacity onPress={onRemoveLocation} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <Icon name="chevron-forward" size={24} color="rgba(255,255,255,0.4)" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  selectedText: {
    fontSize: 15,
    color: '#7C3AED',
    fontWeight: '500',
    flex: 1,
  },
  petAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  communityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  actions: {
    marginLeft: 12,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DetailsSection;
