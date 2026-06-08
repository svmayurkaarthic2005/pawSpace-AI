import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { formatDistance } from '../../utils/formatDistance';

interface MapUser {
  userId: string;
  username: string;
  name: string;
  avatar: string;
  distanceKm: number;
  location: {
    coordinates: [number, number];
  };
  firstPet: {
    name: string;
    breed: string;
    species: string;
    image: string;
  } | null;
}

interface SelectedUserPopupProps {
  user: MapUser;
  onClose: () => void;
  onSayHi: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOTTOM_SHEET_HALF_HEIGHT = 200;

const SelectedUserPopup: React.FC<SelectedUserPopupProps> = ({ user, onClose, onSayHi }) => {
  const navigation = useNavigation<any>();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 15 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.popup, animStyle]}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Icon name="close" color="rgba(255,255,255,0.4)" size={14} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.userRow}
        onPress={() => navigation.navigate('UserProfile', { userId: user.userId })}
      >
        <FastImage source={{ uri: user.firstPet?.image ?? user.avatar }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userBreed}>{user.firstPet?.breed ?? 'Pet owner'}</Text>
          <Text style={styles.userDistance}>{formatDistance(user.distanceKm)}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sayHiBtn} onPress={onSayHi}>
        <Text style={styles.sayHiText}>Say Hi 👋</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_HALF_HEIGHT + 16,
    left: (SCREEN_WIDTH - 200) / 2,
    width: 200,
    backgroundColor: 'rgba(13,13,26,0.95)',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    zIndex: 50,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  userRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userBreed: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  userDistance: {
    fontSize: 11,
    color: '#A78BFA',
    marginTop: 2,
  },
  sayHiBtn: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sayHiText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '500',
  },
});

export default SelectedUserPopup;
