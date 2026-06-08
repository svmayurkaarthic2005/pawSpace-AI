import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface LocationPermissionModalProps {
  onAllow: () => void;
  onSkip?: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ onAllow, onSkip }) => {
  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.scrim}>
        <View style={styles.modal}>
          <View style={styles.iconWrapper}>
            <Icon name="location" color="#7C3AED" size={36} />
            <View style={styles.pulse} />
          </View>
          <Text style={styles.modalTitle}>Enable location</Text>
          <Text style={styles.modalSub}>
            PawSpace needs your location to show nearby pet events and owners
          </Text>
          <TouchableOpacity style={styles.allowBtn} onPress={onAllow}>
            <Icon name="locate" color="#fff" size={16} />
            <Text style={styles.allowBtnText}>Enable location</Text>
          </TouchableOpacity>
          {onSkip && (
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Not now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 10,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  allowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginBottom: 12,
  },
  allowBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
  },
});

export default LocationPermissionModal;
