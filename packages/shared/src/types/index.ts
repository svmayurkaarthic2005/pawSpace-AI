// ─── User Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location?: GeoPoint;
  followersCount: number;
  followingCount: number;
  petsCount: number;
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
  | 'mention'
  | 'pet_birthday'
  | 'ai_insight';

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
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
