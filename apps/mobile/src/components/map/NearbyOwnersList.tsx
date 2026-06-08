import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
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

interface NearbyOwnersListProps {
  users: MapUser[];
  isLoading: boolean;
  onSayHi: (user: MapUser) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const EmptyOwnersState = () => (
  <View style={styles.emptyState}>
    <Icon name="people-outline" size={48} color="rgba(255,255,255,0.2)" />
    <Text style={styles.emptyTitle}>No pet owners nearby</Text>
    <Text style={styles.emptySub}>Try expanding your search radius</Text>
  </View>
);

const OwnerCard: React.FC<{ user: MapUser; onSayHi: (user: MapUser) => void }> = ({ user, onSayHi }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: user.userId })}>
        <FastImage source={{ uri: user.firstPet?.image ?? user.avatar }} style={styles.petImage} />
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <Text style={styles.ownerName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.petBreed} numberOfLines={1}>
          {user.firstPet?.breed ?? 'Pet lover'}
        </Text>
        <View style={styles.distanceBadge}>
          <Icon name="location" size={10} color="#A78BFA" />
          <Text style={styles.distanceText}>{formatDistance(user.distanceKm)}</Text>
        </View>
        <TouchableOpacity style={styles.sayHiBtn} onPress={() => onSayHi(user)}>
          <Text style={styles.sayHiText}>Say Hi 👋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const NearbyOwnersList: React.FC<NearbyOwnersListProps> = ({ users, isLoading, onSayHi }) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (users.length === 0) {
    return <EmptyOwnersState />;
  }

  return (
    <BottomSheetScrollView contentContainerStyle={styles.grid}>
      {users.map((user) => (
        <OwnerCard key={user.userId} user={user} onSayHi={onSayHi} />
      ))}
    </BottomSheetScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  petImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 10,
  },
  ownerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 11,
    color: '#A78BFA',
  },
  sayHiBtn: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  sayHiText: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
});

export default NearbyOwnersList;
