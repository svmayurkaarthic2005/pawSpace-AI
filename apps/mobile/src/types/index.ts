// ─── User Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  coverImage?: string;
  bio?: string;
  location?: GeoPoint;
  locationName?: string;
  followersCount: number;
  followingCount: number;
  petsCount: number;
  isProfileComplete?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Pet Types ────────────────────────────────────────────────────────────────

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other';

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  age?: number;
  weight?: number;
  bio?: string;
  avatarUrl?: string;
  photos: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Post Types ───────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  authorId: string;
  petId?: string;
  caption: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video';
  location?: GeoPoint;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Geo Types ────────────────────────────────────────────────────────────────

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'event_rsvp'
  | 'chat'
  | 'ai_suggestion'
  | 'community_post';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  type: NotificationType;
  entityId?: string;
  entityType?: string;
  entityImage?: string;
  entityName?: string;
  groupKey?: string;
  message: string;
  isRead: boolean;
  tab: 'all' | 'activity';
  createdAt: string;
}

export interface SerializedNotification {
  _id: string;
  type: string;
  message: string;
  sender?: { _id: string; username: string; avatar?: string };
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Chat / Messaging Types ───────────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatItem {
  _id: string;
  participants: UserProfile[];
  lastMessage?: {
    _id: string;
    sender: UserProfile;
    content: {
      type: 'text' | 'image' | 'ai_suggestion';
      text?: string;
      mediaUrl?: string;
      publicId?: string;
    };
    createdAt: string;
  };
  lastMessageAt: string;
  otherUser: UserProfile & {
    lastSeen?: string;
    isOnline?: boolean;
  };
  isOnline: boolean;
  isMuted: boolean;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: { skipOnboarding?: boolean } | undefined;
  Main: undefined;
  IncomingCall: {
    channelName: string;
    fromUserId: string;
    callerName: string;
    callerAvatar?: string;
  };
  VideoCall: {
    channelName: string;
    remoteUserId: string;
    remoteUserName: string;
    remoteUserAvatar?: string;
    isCaller: boolean;
  };
};

export type AuthStackParamList = {
  Splash: undefined;
  OnboardingWelcome: undefined;
  OnboardingProfile: undefined;
  OnboardingDiscover: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  AddPet: {
    name: string;
    username: string;
    email: string;
    password: string;
  };
  RegisterComplete: undefined;
  ForgotPassword: undefined;
  CompleteProfile: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Explore: undefined;
  Create: undefined;
  Events: undefined;
  Profile: undefined;
};

export type FeedStackParamList = {
  FeedHome: undefined;
  PostDetail: { postId: string };
  PetProfile: { petId: string };
  EditPet: { petId: string };
  Profile: { userId: string };
  FollowersList: { userId: string; type: 'followers' | 'following' };
  ChatRoom: { conversationId: string; recipientName: string };
  NewChat: undefined;
  PetAssistant: { petId?: string } | undefined;
  SmartSearch: undefined;
  CreatePost: undefined;
  Notifications: undefined;
  ChatList: undefined;
};

export type ExploreStackParamList = {
  ExploreHome: undefined;
  MapDiscovery: undefined;
  Communities: undefined;
  CommunityDetail: { communityId: string; community?: Community };
  CommunityMembers: { communityId: string };
  CreateCommunity: undefined;
  EditCommunity: { communityId: string };
  SmartSearch: undefined;
  Profile: { userId: string };
  FollowersList: { userId: string; type: 'followers' | 'following' };
  EventDetail: { eventId: string };
  HashtagFeed: { hashtag: string };
  ChatRoom: { conversationId: string; recipientName: string };
};

export type EventsStackParamList = {
  MapDiscovery: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  PetProfile: { petId: string };
  EditPet: { petId: string };
  EditProfile: undefined;
  Settings: undefined;
  AddPet: undefined;
  FollowersList: { userId: string; type: 'followers' | 'following' };
  ChatRoom: { conversationId: string; recipientName: string };
  PasswordSecurity: undefined;
  PrivacySettings: undefined;
  LinkedAccounts: undefined;
  ThemeSettings: undefined;
  LanguageSettings: undefined;
  BlockedUsers: undefined;
};

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Search & Explore Types ───────────────────────────────────────────────────

export type SearchType = 'event' | 'community' | 'user' | 'post' | 'mixed';

export interface SearchIntent {
  type: SearchType;
  species: string[];
  location: string | null;
  dateRange: {
    label: string;
    days: number;
  } | null;
  keywords: string[];
  radius: number;
}

export interface SearchResults {
  posts: Post[];
  events: Event[];
  communities: Community[];
  users: UserProfile[];
}

export interface SmartSearchResponse {
  intent: SearchIntent;
  results: SearchResults;
  totalCount: number;
  suggestion: string | null;
}

export interface TrendingHashtag {
  tag: string;
  postCount: number;
  isHot: boolean;
}

export interface NearbyUser extends UserProfile {
  distance: number;
  pet?: Pet;
}

export interface ExploreData {
  hashtags: TrendingHashtag[];
  posts: Post[];
  communities: Community[];
  nearbyUsers: NearbyUser[];
}

export interface Event {
  id: string;
  creator: UserProfile;
  title: string;
  description: string;
  coverImage?: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  startDate: string;
  endDate: string;
  petFriendlySpecies: string[];
  maxAttendees?: number;
  rsvpCount: number;
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  distance?: number;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  accentColor?: string;
  creator: UserProfile;
  memberCount: number;
  postCount: number;
  species: string[];
  isPrivate: boolean;
  tags: string[];
  isMember?: boolean;
  lastActivityAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  bio?: string;
  followerCount?: number;
  isVerified?: boolean;
}


// ─── Community Types ──────────────────────────────────────────────────────────

export interface CommunityMembership {
  community: Community;
  hasUnread: boolean;
  unreadCount: number;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: string;
}

export interface CommunityDetail extends Community {
  accentColor?: string;
  rules?: string;
  pinnedPostId?: string;
  lastActivityAt: string;
  isMember: boolean;
  isAdmin: boolean;
}

export interface CommunityPostMedia {
  url: string;
  publicId: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface CommunityPost {
  _id: string;
  community: {
    _id: string;
    name: string;
    slug: string;
  };
  author: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
    isVerified?: boolean;
  };
  content: string;
  media: CommunityPostMedia[];
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  user: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
    bio?: string;
    followerCount?: number;
  };
  role: 'member' | 'moderator' | 'admin';
  joinedAt: string;
}

export interface DiscoverCommunitiesResponse {
  allCommunities: Community[];
}

export interface CommunityDetailResponse {
  community: CommunityDetail;
  isMember: boolean;
  isAdmin: boolean;
  pinnedPost: CommunityPost | null;
  memberCount: number;
}
