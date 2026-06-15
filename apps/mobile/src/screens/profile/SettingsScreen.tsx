import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Image,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { ProfileStackParamList } from '../../types';
import { SPACING, STORAGE_KEYS, QUERY_KEYS } from '../../constants';
import { petApi } from '../../services/post.service';
import api from '../../services/api';
import useLocation from '../../hooks/useLocation';

// ─── Settings Keys ────────────────────────────────────────────────────────────
const SETTINGS_KEYS = {
  LOCATION_SHARING: '@settings/locationSharing',
  PUSH_NOTIFICATIONS: '@settings/pushNotifications',
  CHAT_NOTIFICATIONS: '@settings/chatNotifications',
  EVENT_REMINDERS: '@settings/eventReminders',
  THEME: '@settings/theme',
  LANGUAGE: '@settings/language',
};

// PawSpace brand colors
const COLORS = {
  primary: '#7C3AED',
  background: '#0D0D1A',
  surface: 'rgba(255,255,255,0.05)',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: 'rgba(255,255,255,0.08)',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

type SettingsNavProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface SettingsState {
  locationSharing: boolean;
  pushNotifications: boolean;
  chatNotifications: boolean;
  eventReminders: boolean;
}

interface Pet {
  _id: string;
  name: string;
  species: string;
  breed?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavProp>();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  // ─── Fetch User's Pets ────────────────────────────────────────────────────
  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: [QUERY_KEYS.MY_PETS],
    queryFn: petApi.getMyPets,
    staleTime: 300000,
  });

  const petCount = pets?.length || 0;
  const petNames = pets?.slice(0, 2).map((p: Pet) => p.name).join(', ') || 'No pets yet';

  // ─── Settings State ───────────────────────────────────────────────────────
  const [settings, setSettings] = useState<SettingsState>({
    locationSharing: true,
    pushNotifications: true,
    chatNotifications: true,
    eventReminders: true,
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // ─── Load Settings from AsyncStorage ──────────────────────────────────────
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const keys = Object.values(SETTINGS_KEYS);
      const values = await AsyncStorage.multiGet(keys);
      
      const loadedSettings: Partial<SettingsState> = {};
      values.forEach(([key, value]) => {
        const settingKey = Object.keys(SETTINGS_KEYS).find(
          k => SETTINGS_KEYS[k as keyof typeof SETTINGS_KEYS] === key
        );
        if (settingKey) {
          const stateKey = settingKey.charAt(0).toLowerCase() + settingKey.slice(1).replace(/_/g, '');
          loadedSettings[stateKey as keyof SettingsState] = value === 'true';
        }
      });

      setSettings(prev => ({ ...prev, ...loadedSettings }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // ─── Save Individual Setting ──────────────────────────────────────────────
  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (error) {
      console.error('Failed to save setting:', error);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    }
  };

  // ─── Update Setting with Backend Sync ─────────────────────────────────────
  const updateSetting = async <K extends keyof SettingsState>(
    key: K,
    value: boolean,
    storageKey: string
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await saveSetting(storageKey, value);

    if (key === 'locationSharing') {
      if (value) {
        // Turning ON location sharing
        location.startBackgroundTracking();
      } else {
        // Turning OFF location sharing
        location.stopBackgroundTracking();
        try {
          await api.delete('/map/location');
        } catch (error) {
          console.warn('Failed to delete location from server:', error);
        }
      }
    }

    // Sync with backend for critical settings
    if (['locationSharing', 'pushNotifications'].includes(key)) {
      try {
        await api.put('/users/settings', { [key]: value });
      } catch (error) {
        console.warn('Failed to sync setting with backend:', error);
      }
    }
  };

  // ─── Navigation Handlers ──────────────────────────────────────────────────
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleMyPets = () => {
    navigation.navigate('ProfileHome');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data, pets, and posts will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // For now, show contact information since the API isn't implemented yet
            Alert.alert(
              'Account Deletion Request',
              'To delete your account, please contact support@pawspace.app with your username and email. We\'ll process your request within 24 hours.\n\nThis will be automated in a future update.',
              [
                { 
                  text: 'OK',
                  onPress: () => {
                    // Optionally allow them to sign out
                    Alert.alert(
                      'Sign Out',
                      'Would you like to sign out for now?',
                      [
                        { text: 'No', style: 'cancel' },
                        { text: 'Sign Out', onPress: handleSignOut }
                      ]
                    );
                  }
                }
              ]
            );
          },
        },
      ]
    );
  };

  const handleShareProfile = async () => {
    try {
      const profileUrl = `https://pawspace.app/@${user?.username}`;
      await Share.share({
        message: `Check out my PawSpace profile! ${profileUrl}`,
        url: profileUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleHelpCenter = async () => {
    const url = 'https://help.pawspace.app';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open help center');
    }
  };

  const handleReportProblem = () => {
    Alert.alert(
      'Report a Problem',
      'What type of issue are you experiencing?',
      [
        { text: 'Bug/Technical Issue', onPress: () => console.log('Report bug') },
        { text: 'Inappropriate Content', onPress: () => console.log('Report content') },
        { text: 'Account Issue', onPress: () => console.log('Report account') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTermsPrivacy = () => {
    Alert.alert(
      'Terms & Privacy',
      'What would you like to view?',
      [
        { text: 'Terms of Service', onPress: () => Linking.openURL('https://pawspace.app/terms') },
        { text: 'Privacy Policy', onPress: () => Linking.openURL('https://pawspace.app/privacy') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────
  const renderToggle = (value: boolean, onValueChange: (val: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: 'rgba(255,255,255,0.12)', true: COLORS.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="rgba(255,255,255,0.12)"
    />
  );

  const renderSettingRow = (
    icon: string,
    iconBg: string,
    label: string,
    subtext?: string,
    rightElement?: 'chevron' | 'toggle' | 'badge' | 'external',
    toggleValue?: boolean,
    onToggle?: (val: boolean) => void,
    badgeText?: string,
    onPress?: () => void,
    iconFamily: 'Ionicons' | 'MaterialCommunityIcons' = 'Ionicons',
    danger?: boolean
  ) => {
    const IconComponent = iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Icon;

    return (
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        disabled={rightElement === 'toggle'}
        activeOpacity={rightElement === 'toggle' ? 1 : 0.6}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconSquare, { backgroundColor: iconBg }]}>
            <IconComponent name={icon} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
            {subtext && <Text style={styles.settingSubtext}>{subtext}</Text>}
          </View>
        </View>

        <View style={styles.settingRight}>
          {badgeText && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}
          {rightElement === 'toggle' && toggleValue !== undefined && onToggle && (
            renderToggle(toggleValue, onToggle)
          )}
          {rightElement === 'chevron' && (
            <Icon name="chevron-forward" size={20} color="#6B7280" />
          )}
          {rightElement === 'external' && (
            <Icon name="open-outline" size={18} color="#6B7280" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionDivider = () => <View style={styles.divider} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.verifiedDot} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileMeta}>
                @{user?.username} · {user?.locationName || 'Location'}
              </Text>
              <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
                <Icon name="pencil" size={12} color={COLORS.primary} />
                <Text style={styles.editProfileText}>Edit profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#6B7280" />
        </View>



        {/* Account Section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'person-outline',
            'rgba(124,58,237,0.2)',
            'Personal info',
            `${user?.email || 'Email not set'}`,
            'chevron',
            undefined,
            undefined,
            undefined,
            handleEditProfile
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'lock-closed-outline',
            'rgba(59,130,246,0.2)',
            'Password & security',
            'Change password, 2FA',
            'chevron',
            undefined,
            undefined,
            undefined,
            () => navigation.navigate('PasswordSecurity' as any)
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'shield-checkmark-outline',
            'rgba(20,184,166,0.2)',
            'Privacy',
            'Who can see your profile',
            'chevron',
            undefined,
            undefined,
            undefined,
            () => navigation.navigate('PrivacySettings' as any)
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'ban-outline',
            'rgba(239,68,68,0.2)',
            'Blocked users',
            'Manage blocked accounts',
            'chevron',
            undefined,
            undefined,
            undefined,
            () => navigation.navigate('BlockedUsers' as any)
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'link-outline',
            'rgba(251,191,36,0.2)',
            'Linked accounts',
            'Google connected',
            'chevron',
            undefined,
            undefined,
            '1 linked',
            () => navigation.navigate('LinkedAccounts' as any)
          )}
        </View>

        {/* Pets Section */}
        <Text style={styles.sectionLabel}>PETS</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'paw',
            'rgba(236,72,153,0.2)',
            'My pets',
            petCount > 0 ? `${petNames} · ${petCount} ${petCount === 1 ? 'pet' : 'pets'}` : 'Add your first pet',
            'chevron',
            undefined,
            undefined,
            undefined,
            handleMyPets,
            'MaterialCommunityIcons'
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'location-outline',
            'rgba(20,184,166,0.2)',
            'Location sharing',
            'Visible to nearby users',
            'toggle',
            settings.locationSharing,
            (val) => updateSetting('locationSharing', val, SETTINGS_KEYS.LOCATION_SHARING)
          )}
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'notifications-outline',
            'rgba(251,191,36,0.2)',
            'Push notifications',
            'Likes, comments, follows',
            'toggle',
            settings.pushNotifications,
            (val) => updateSetting('pushNotifications', val, SETTINGS_KEYS.PUSH_NOTIFICATIONS)
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'chatbubble-outline',
            'rgba(59,130,246,0.2)',
            'Chat notifications',
            'New messages',
            'toggle',
            settings.chatNotifications,
            (val) => updateSetting('chatNotifications', val, SETTINGS_KEYS.CHAT_NOTIFICATIONS)
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'calendar-outline',
            'rgba(20,184,166,0.2)',
            'Event reminders',
            '1 day before event',
            'toggle',
            settings.eventReminders,
            (val) => updateSetting('eventReminders', val, SETTINGS_KEYS.EVENT_REMINDERS)
          )}
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'weather-night',
            'rgba(107,114,128,0.2)',
            'Theme',
            'Dark',
            'chevron',
            undefined,
            undefined,
            undefined,
            () => navigation.navigate('ThemeSettings' as any),
            'MaterialCommunityIcons'
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'earth',
            'rgba(20,184,166,0.2)',
            'Language',
            'English',
            'chevron',
            undefined,
            undefined,
            undefined,
            () => navigation.navigate('LanguageSettings' as any),
            'MaterialCommunityIcons'
          )}
        </View>

        {/* Support Section */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'help-circle-outline',
            'rgba(59,130,246,0.2)',
            'Help center',
            'FAQs and guides',
            'external',
            undefined,
            undefined,
            undefined,
            handleHelpCenter
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'flag-outline',
            'rgba(107,114,128,0.2)',
            'Report a problem',
            'Bug reports and feedback',
            'chevron',
            undefined,
            undefined,
            undefined,
            handleReportProblem
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'document-text-outline',
            'rgba(107,114,128,0.2)',
            'Terms & privacy',
            'Legal information',
            'chevron',
            undefined,
            undefined,
            undefined,
            handleTermsPrivacy
          )}
        </View>

        {/* Account Actions (Danger Zone) */}
        <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'log-out-outline',
            'rgba(239,68,68,0.2)',
            'Sign out',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            handleSignOut,
            'Ionicons',
            true
          )}
          {renderSectionDivider()}
          {renderSettingRow(
            'trash-outline',
            'rgba(239,68,68,0.2)',
            'Delete account',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            handleDeleteAccount,
            'Ionicons',
            true
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>PawSpace v1.0.0 · Build 42</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  backText: {
    fontSize: 17,
    color: COLORS.primary,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginLeft: 60,
  },
  dangerText: {
    color: COLORS.error,
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginVertical: SPACING.xl * 2,
  },
});

export default SettingsScreen;
