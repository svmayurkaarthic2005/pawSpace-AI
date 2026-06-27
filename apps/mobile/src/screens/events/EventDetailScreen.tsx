import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, useColorScheme, Share, Alert,
  Dimensions, Modal, FlatList,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { eventApi } from '../../services/event.service';
import { useAuthStore } from '../../store/authStore';
import useLocation from '../../hooks/useLocation';
import { FONT_SIZE, SPACING } from '../../constants';
import { MapView, PROVIDER_GOOGLE, MapErrorFallback, mapModuleError } from '../../components/map/MapWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 280;

type Props = NativeStackScreenProps<any, 'EventDetail'>;

const RSVP_OPTIONS = [
  { status: 'going' as const, label: '✓ Going', color: '#7C3AED' },
  { status: 'maybe' as const, label: '◑ Maybe', color: '#D97706' },
  { status: 'not_going' as const, label: '✕ Can\'t go', color: '#374151' },
];

const formatDistance = (m: number) => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)} km`;

const EventDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { eventId } = (route.params ?? {}) as { eventId: string };
  const isDark = useColorScheme() === 'dark';
  const { coords } = useLocation();
  const queryClient = useQueryClient();
  const [descExpanded, setDescExpanded] = useState(false);
  const [attendeesModalVisible, setAttendeesModalVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventApi.getEventById(eventId),
  });

  const { data: attendeesData } = useQuery({
    queryKey: ['eventAttendees', eventId],
    queryFn: () => eventApi.getAttendees(eventId),
    enabled: !!data,
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'maybe' | 'not_going') =>
      eventApi.rsvpEvent(eventId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to RSVP';
      Alert.alert('Error', msg);
    },
  });

  const handleGetDirections = useCallback(async () => {
    if (!coords || !data?.event) return;
    try {
      const result = await eventApi.getDirections(coords.latitude, coords.longitude, eventId);
      if (result) {
        Alert.alert('Directions', `${result.distanceText} · ${result.durationText} walking`);
      }
    } catch {
      Alert.alert('Error', 'Could not get directions');
    }
  }, [coords, data, eventId]);

  const handleShare = useCallback(async () => {
    if (!data?.event) return;
    await Share.share({
      message: `Check out "${data.event.title}" on PawSpace! 🐾`,
      title: data.event.title,
    });
  }, [data]);

  const bg = isDark ? '#080810' : '#F8F8FF';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!data?.event) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Text style={{ color: subColor }}>Event not found</Text>
      </View>
    );
  }

  const { event, userRsvp } = data;
  const currentRsvpStatus = userRsvp?.status ?? null;
  const [lng, lat] = event.location.coordinates.coordinates;
  const attendees = attendeesData?.items ?? [];
  const totalAttendees = attendeesData?.total ?? event.rsvpCount;

  const daysUntil = Math.ceil((new Date(event.startDate).getTime() - Date.now()) / 86400000);
  const startsInText = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `Starts in ${daysUntil} days`;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {event.coverImage ? (
            <FastImage
              source={{ uri: event.coverImage, priority: FastImage.priority.high }}
              style={styles.cover}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={styles.coverEmoji}>🐾</Text>
            </View>
          )}
          <View style={styles.coverOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bg }]}>
          {/* Title + Date */}
          <Text style={[styles.title, { color: textColor }]}>{event.title}</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={[styles.dateText, { color: subColor }]}>
              {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long' })} · {new Date(event.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {/* Host */}
          <View style={[styles.hostRow, { backgroundColor: cardBg }]}>
            <FastImage
              source={{
                uri: event.creator.avatar ?? `https://ui-avatars.com/api/?name=${event.creator.name}&background=7C3AED&color=fff`,
                priority: FastImage.priority.normal,
              }}
              style={styles.hostAvatar}
            />
            <View style={styles.hostInfo}>
              <Text style={[styles.hostLabel, { color: subColor }]}>Hosted by</Text>
              <Text style={[styles.hostName, { color: '#7C3AED' }]}>@{event.creator.username}</Text>
            </View>
            <TouchableOpacity
              style={styles.followBtn}
              onPress={() => navigation.navigate('Profile', { userId: event.creator._id })}
            >
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: cardBg }]}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{totalAttendees}</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Attendees</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? '#2D2D4E' : '#E5E7EB' }]} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{event.maxAttendees ?? '∞'}</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Max capacity</Text>
            </View>
            {event.distanceMeters !== undefined && (
              <>
                <View style={[styles.statDivider, { backgroundColor: isDark ? '#2D2D4E' : '#E5E7EB' }]} />
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📍</Text>
                  <Text style={[styles.statValue, { color: textColor }]}>{formatDistance(event.distanceMeters)}</Text>
                  <Text style={[styles.statLabel, { color: subColor }]}>Distance</Text>
                </View>
              </>
            )}
          </View>

          {/* Species tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
            {event.petFriendlySpecies.map((s: string) => (
              <View key={s} style={styles.speciesTag}>
                <Text style={styles.speciesTagText}>🐾 {s.charAt(0).toUpperCase() + s.slice(1)}-friendly</Text>
              </View>
            ))}
            {event.tags.map((t: string) => (
              <View key={t} style={[styles.speciesTag, styles.tagChip]}>
                <Text style={styles.tagChipText}>{t}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Map preview */}
          <View style={[styles.mapPreview, { backgroundColor: isDark ? '#1A1A2E' : '#E5E7EB' }]}>
            {mapModuleError || !MapView ? (
              <MapErrorFallback error={mapModuleError || new Error('MapView not available')} />
            ) : (
              <View style={StyleSheet.absoluteFill}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={StyleSheet.absoluteFill}
                  initialRegion={{
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                />
                {/* Center Pin Overlay */}
                <View style={styles.centerPinContainer} pointerEvents="none">
                  <Icon name="location" size={32} color="#EF4444" style={styles.centerPin} />
                </View>
              </View>
            )}
          </View>

          {/* Address + Directions */}
          <Text style={[styles.address, { color: subColor }]}>
            {event.location.address}
          </Text>
          <TouchableOpacity style={[styles.directionsBtn, { borderColor: isDark ? '#4B5563' : '#D1D5DB' }]} onPress={handleGetDirections}>
            <Text style={styles.directionsBtnIcon}>📍</Text>
            <Text style={[styles.directionsBtnText, { color: textColor }]}>Get directions</Text>
          </TouchableOpacity>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>About this event</Text>
          <Text
            style={[styles.description, { color: subColor }]}
            numberOfLines={descExpanded ? undefined : 4}
          >
            {event.description}
          </Text>
          <TouchableOpacity onPress={() => setDescExpanded((v) => !v)}>
            <Text style={styles.readMore}>{descExpanded ? 'Show less ▲' : 'Read more ▼'}</Text>
          </TouchableOpacity>

          {/* Attendees */}
          {attendees.length > 0 && (
            <>
              <View style={styles.attendeesHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Who's going ({totalAttendees})
                </Text>
                <TouchableOpacity onPress={() => setAttendeesModalVisible(true)}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attendeesRow}>
                {attendees.slice(0, 8).map((a: any) => (
                  <FastImage
                    key={(a.user as unknown as { _id: string })._id}
                    source={{
                      uri: (a.user as unknown as { avatar?: string }).avatar ??
                        `https://ui-avatars.com/api/?name=${(a.user as unknown as { name: string }).name}&background=7C3AED&color=fff`,
                      priority: FastImage.priority.normal,
                    }}
                    style={styles.attendeeAvatar}
                  />
                ))}
                {totalAttendees > 8 && (
                  <View style={styles.moreAttendees}>
                    <Text style={styles.moreAttendeesText}>+{totalAttendees - 8}</Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}

          {/* AI Recommendation badge */}
          <TouchableOpacity
            style={styles.aiBadge}
            onPress={() => navigation.navigate('SmartSearch', { initialQuery: `events like ${event.title}` })}
          >
            <Text style={styles.aiBadgeIcon}>✦</Text>
            <View>
              <Text style={styles.aiBadgeTitle}>✦ Recommended for you</Text>
              <Text style={styles.aiBadgeSubtitle}>Based on your pets' breeds</Text>
            </View>
            <Text style={styles.aiBadgeChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* RSVP Footer */}
      <View style={[styles.rsvpFooter, { backgroundColor: cardBg }]}>
        <Text style={[styles.startsIn, { color: subColor }]}>{startsInText}</Text>
        <View style={styles.rsvpButtons}>
          {RSVP_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.status}
              style={[
                styles.rsvpBtn,
                { backgroundColor: currentRsvpStatus === opt.status ? opt.color : 'transparent' },
                { borderColor: opt.color },
              ]}
              onPress={() => rsvpMutation.mutate(opt.status)}
              disabled={rsvpMutation.isPending}
            >
              <Text style={[
                styles.rsvpBtnText,
                { color: currentRsvpStatus === opt.status ? '#FFFFFF' : opt.color },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Attendees Modal */}
      <Modal visible={attendeesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Attendees ({totalAttendees})</Text>
              <TouchableOpacity onPress={() => setAttendeesModalVisible(false)} style={{ padding: 4 }}>
                <Icon name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={attendees}
              keyExtractor={(item) => (item.user as unknown as { _id: string })._id}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg }}
              renderItem={({ item }) => (
                <View style={styles.attendeeModalItem}>
                  <FastImage
                    source={{
                      uri: (item.user as unknown as { avatar?: string }).avatar ??
                        `https://ui-avatars.com/api/?name=${(item.user as unknown as { name: string }).name}&background=7C3AED&color=fff`,
                      priority: FastImage.priority.normal,
                    }}
                    style={styles.attendeeModalAvatar}
                  />
                  <View style={styles.attendeeModalInfo}>
                    <Text style={[styles.attendeeModalName, { color: textColor }]}>{(item.user as unknown as { name: string }).name}</Text>
                    <Text style={[styles.attendeeModalUsername, { color: subColor }]}>@{(item.user as unknown as { username: string }).username}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'going' ? 'rgba(16,185,129,0.15)' : 'rgba(217,119,6,0.15)' }]}>
                    <Text style={[styles.statusBadgeText, { color: item.status === 'going' ? '#10B981' : '#D97706' }]}>
                      {item.status === 'going' ? 'Going' : 'Maybe'}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverContainer: { height: COVER_HEIGHT, position: 'relative' },
  cover: { width: '100%', height: COVER_HEIGHT },
  coverPlaceholder: { backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 80 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtn: {
    position: 'absolute', top: SPACING.lg, left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  shareBtn: {
    position: 'absolute', top: SPACING.lg, right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { color: '#FFFFFF', fontSize: 18 },
  content: { padding: SPACING.md, paddingBottom: 120 },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: SPACING.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md },
  dateIcon: { fontSize: 16 },
  dateText: { fontSize: FONT_SIZE.sm },
  hostRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: SPACING.sm,
    marginBottom: SPACING.md, gap: SPACING.sm,
  },
  hostAvatar: { width: 40, height: 40, borderRadius: 20 },
  hostInfo: { flex: 1 },
  hostLabel: { fontSize: 11 },
  hostName: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  followBtn: {
    borderWidth: 1.5, borderColor: '#7C3AED',
    borderRadius: 12, paddingHorizontal: SPACING.md, paddingVertical: 5,
  },
  followBtnText: { color: '#7C3AED', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', borderRadius: 16,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: '100%' },
  tagsRow: { marginBottom: SPACING.md },
  speciesTag: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 20, paddingHorizontal: SPACING.sm,
    paddingVertical: 5, marginRight: SPACING.xs,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  speciesTagText: { color: '#A78BFA', fontSize: 11, fontWeight: '600' },
  tagChip: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  tagChipText: { color: '#9CA3AF', fontSize: 11 },
  mapPreview: { 
    height: 160, 
    borderRadius: 16, 
    marginBottom: SPACING.sm, 
    overflow: 'hidden',
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.md },
  mapPlaceholderText: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginTop: SPACING.xs },
  mapPlaceholderSmall: { fontSize: 11, marginTop: 4 },
  mapView: { 
    flex: 1,
  },
  mapPin: { 
    alignItems: 'center',
  },
  mapPinIcon: { 
    fontSize: 28,
  },
  address: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  directionsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg, gap: SPACING.xs,
  },
  directionsBtnIcon: { fontSize: 16 },
  directionsBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  description: { fontSize: FONT_SIZE.sm, lineHeight: 22, marginBottom: SPACING.xs },
  readMore: { color: '#7C3AED', fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.lg },
  attendeesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  seeAll: { color: '#7C3AED', fontSize: FONT_SIZE.sm, fontWeight: '600' },
  attendeesRow: { marginBottom: SPACING.lg },
  attendeeAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: SPACING.xs, borderWidth: 2, borderColor: '#7C3AED' },
  moreAttendees: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreAttendeesText: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 16, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)',
    gap: SPACING.sm,
  },
  aiBadgeIcon: { fontSize: 24, color: '#7C3AED' },
  aiBadgeTitle: { color: '#A78BFA', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  aiBadgeSubtitle: { color: '#6B7280', fontSize: 11 },
  aiBadgeChevron: { color: '#7C3AED', fontSize: 20, marginLeft: 'auto' },
  rsvpFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  startsIn: { fontSize: 11, textAlign: 'center', marginBottom: SPACING.xs },
  rsvpButtons: { flexDirection: 'row', gap: SPACING.sm },
  rsvpBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    paddingVertical: SPACING.sm, alignItems: 'center',
  },
  rsvpBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  centerPinContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPin: {
    transform: [{ translateY: -16 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  attendeeModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  attendeeModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  attendeeModalInfo: {
    flex: 1,
  },
  attendeeModalName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  attendeeModalUsername: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default EventDetailScreen;
