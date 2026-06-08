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
      <TouchableOpacity style={styles.row} onPress={onOpenPetSheet}>
        <View style={styles.iconContainer}>
          <Icon name="paw" size={22} color="#7C3AED" />
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
              <Text style={styles.selectedText}>{selectedPet.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {selectedPet ? (
            <TouchableOpacity onPress={onRemovePet} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close-circle" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ) : (
            <Icon name="chevron-forward" size={22} color="rgba(255,255,255,0.3)" />
          )}
        </View>
      </TouchableOpacity>

      {/* Location */}
      <TouchableOpacity style={styles.row} onPress={onOpenLocationSheet}>
        <View style={styles.iconContainer}>
          <Icon name="location" size={22} color="#10B981" />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Add location</Text>
          {selectedLocation && (
            <Text style={styles.selectedText} numberOfLines={1}>
              {selectedLocation.name}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          {selectedLocation ? (
            <TouchableOpacity onPress={onRemoveLocation} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close-circle" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ) : (
            <Icon name="chevron-forward" size={22} color="rgba(255,255,255,0.3)" />
          )}
        </View>
      </TouchableOpacity>

      {/* Community (optional, hide for now) */}
      {/* <TouchableOpacity style={styles.row} onPress={onOpenCommunitySheet}>
        <View style={styles.iconContainer}>
          <Icon name="people" size={22} color="#F59E0B" />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Select community</Text>
          {selectedCommunity && (
            <View style={styles.selectedContainer}>
              {selectedCommunity.avatar && (
                <FastImage
                  source={{ uri: selectedCommunity.avatar }}
                  style={styles.communityAvatar}
                />
              )}
              <Text style={styles.selectedText}>{selectedCommunity.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {selectedCommunity ? (
            <TouchableOpacity onPress={onRemoveCommunity} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close-circle" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ) : (
            <Icon name="chevron-forward" size={22} color="rgba(255,255,255,0.3)" />
          )}
        </View>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  selectedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  petAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  communityAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actions: {
    marginLeft: 12,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DetailsSection;
