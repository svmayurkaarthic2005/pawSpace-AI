import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  MainTabParamList,
  FeedStackParamList,
  ExploreStackParamList,
  EventsStackParamList,
  ProfileStackParamList,
} from '../types';

// ─── Screens ──────────────────────────────────────────────────────────────────

import FeedScreen from '../screens/feed/FeedScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import CreatePostScreen from '../screens/feed/CreatePostScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import PetProfileScreen from '../screens/pet/PetProfileScreen';
import AddPetScreen from '../screens/pet/AddPetScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import MapDiscoveryScreen from '../screens/map/MapDiscoveryScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import { NewChatScreen } from '../screens/chat/NewChatScreen';
import AIPetAssistantScreen from '../screens/ai/AIPetAssistantScreen';
import SmartSearchScreen from '../screens/ai/SmartSearchScreen';
import { CommunitiesScreen } from '../screens/community/CommunitiesScreen';
import { CommunityDetailScreen } from '../screens/community/CommunityDetailScreen';
import { CommunityMembersScreen } from '../screens/community/CommunityMembersScreen';
import { CreateCommunityScreen } from '../screens/community/CreateCommunityScreen';
import { EditCommunityScreen } from '../screens/community/EditCommunityScreen';

// ─── Typed Stack Navigators ───────────────────────────────────────────────────

const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// ─── Feed Stack ───────────────────────────────────────────────────────────────

const FeedNavigator = () => (
  <FeedStack.Navigator screenOptions={{ headerShown: false }}>
    <FeedStack.Screen name="FeedHome" component={FeedScreen} />
    <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
    <FeedStack.Screen name="PetProfile" component={PetProfileScreen as any} />
    <FeedStack.Screen name="Profile" component={ProfileScreen} />
    <FeedStack.Screen name="ChatList" component={ChatListScreen} />
    <FeedStack.Screen name="ChatRoom" component={ChatRoomScreen as any} />
    <FeedStack.Screen name="NewChat" component={NewChatScreen} />
    <FeedStack.Screen name="Notifications" component={NotificationsScreen} />
    <FeedStack.Screen
      name="PetAssistant"
      component={AIPetAssistantScreen}
      options={{ presentation: 'modal' }}
    />
    <FeedStack.Screen
      name="SmartSearch"
      component={SmartSearchScreen as any}
      options={{ presentation: 'modal' }}
    />
    <FeedStack.Screen
      name="CreatePost"
      component={CreatePostScreen}
      options={{ presentation: 'modal' }}
    />
  </FeedStack.Navigator>
);

// ─── Explore Stack ────────────────────────────────────────────────────────────

const ExploreNavigator = () => (
  <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
    <ExploreStack.Screen name="ExploreHome" component={ExploreScreen} />
    <ExploreStack.Screen name="MapDiscovery" component={MapDiscoveryScreen} />
    <ExploreStack.Screen name="Communities" component={CommunitiesScreen} />
    <ExploreStack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
    <ExploreStack.Screen name="CommunityMembers" component={CommunityMembersScreen} />
    <ExploreStack.Screen name="Profile" component={ProfileScreen} />
    <ExploreStack.Screen name="EventDetail" component={EventDetailScreen as any} />
    <ExploreStack.Screen name="HashtagFeed" component={FeedScreen} />
    <ExploreStack.Screen
      name="CreateCommunity"
      component={CreateCommunityScreen}
      options={{ presentation: 'modal' }}
    />
    <ExploreStack.Screen
      name="EditCommunity"
      component={EditCommunityScreen}
      options={{ presentation: 'modal' }}
    />
    <ExploreStack.Screen
      name="SmartSearch"
      component={SmartSearchScreen as any}
      options={{ presentation: 'modal' }}
    />
  </ExploreStack.Navigator>
);

// ─── Events Stack ─────────────────────────────────────────────────────────────

const EventsNavigator = () => (
  <EventsStack.Navigator screenOptions={{ headerShown: false }}>
    <EventsStack.Screen name="MapDiscovery" component={MapDiscoveryScreen} />
    <EventsStack.Screen name="EventDetail" component={EventDetailScreen as any} />
  </EventsStack.Navigator>
);

// ─── Profile Stack ────────────────────────────────────────────────────────────

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen name="PetProfile" component={PetProfileScreen as any} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="AddPet" component={AddPetScreen} />
    <ProfileStack.Screen name="FollowersList" component={ProfileScreen} />
    <ProfileStack.Screen name="ChatRoom" component={ChatRoomScreen as any} />
  </ProfileStack.Navigator>
);

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { active: string; inactive: string; library?: 'ionicons' | 'material' }> = {
  Feed: { active: 'home', inactive: 'home-outline', library: 'ionicons' },
  Explore: { active: 'compass', inactive: 'compass-outline', library: 'ionicons' },
  Events: { active: 'calendar', inactive: 'calendar-outline', library: 'ionicons' },
  Profile: { active: 'person', inactive: 'person-outline', library: 'ionicons' },
};

const MainStack: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Following the design from the image strictly
  const tabBg = '#0D0D1A'; // Very dark navy/black background
  const tabBorder = 'rgba(255,255,255,0.05)'; // Subtle border
  const activeColor = '#7C3AED'; // Purple/violet for active state
  const inactiveColor = '#6B7280'; // Gray for inactive state

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          borderTopWidth: 0.5,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'Create') {
            return (
              <View style={styles.createBtn}>
                <Icon name="add" size={32} color="#FFFFFF" />
              </View>
            );
          }
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons?.active : icons?.inactive;
          
          return (
            <Icon 
              name={iconName || 'home-outline'} 
              size={26} 
              color={color}
            />
          );
        },
        tabBarLabel: ({ focused, color }) => {
          if (route.name === 'Create') return null;
          // Map internal route names to display labels matching the design
          const labelMap: Record<string, string> = {
            Feed: 'Home',
            Explore: 'Discover',
            Events: 'Events',
            Profile: 'Profile',
          };
          const label = labelMap[route.name] || route.name;
          return (
            <Text style={{ 
              fontSize: 11, 
              color, 
              fontWeight: focused ? '600' : '400',
              marginTop: 4,
            }}>
              {label}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen name="Explore" component={ExploreNavigator} />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent navigating to the Create tab — open as modal instead
            e.preventDefault();
            navigation.navigate('Feed', {
              screen: 'CreatePost',
            });
          },
        })}
        options={{ tabBarLabel: () => null }}
      />
      <Tab.Screen name="Events" component={EventsNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  createBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default MainStack;
