import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostMedia {
  url: string;
  publicId: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface PostAuthor {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
}

export interface PostPet {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  images: Array<{ url: string; publicId: string; isProfile: boolean }>;
}

export interface Post {
  _id: string;
  author: PostAuthor;
  pet?: PostPet;
  caption: string;
  hashtags: string[];
  media: PostMedia[];
  likesCount: number;
  commentsCount: number;
  location?: { name: string; coordinates: [number, number] };
  visibility: 'public' | 'followers';
  isAI: boolean;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: PostAuthor;
  text: string;
  parentComment?: string;
  repliesCount: number;
  likesCount: number;
  createdAt: string;
}

export interface FeedPage {
  items: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export const postApi = {
  async getFeed(cursor?: string, limit = 20): Promise<FeedPage> {
    const params: Record<string, string> = { limit: String(limit) };
    if (cursor) params.cursor = cursor;
    const { data } = await api.get<{ data: FeedPage }>('/posts/feed', { params });
    return data.data;
  },

  async getExplorePosts(page = 1, limit = 20): Promise<{ items: Post[]; total: number }> {
    const { data } = await api.get<{ data: { items: Post[]; total: number } }>('/posts/explore', {
      params: { page, limit },
    });
    return data.data;
  },

  async getPostById(postId: string): Promise<Post> {
    const { data } = await api.get<{ data: Post }>(`/posts/${postId}`);
    return data.data;
  },

  async createPost(formData: FormData): Promise<Post> {
    const { data } = await api.post<{ data: Post }>('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}`);
  },

  async likePost(postId: string): Promise<{ likesCount: number; liked: boolean }> {
    const { data } = await api.post<{ data: { likesCount: number; liked: boolean } }>(
      `/posts/${postId}/like`,
    );
    return data.data;
  },

  async getComments(postId: string, page = 1): Promise<{ items: Comment[]; total: number }> {
    const { data } = await api.get<{ data: { items: Comment[]; total: number } }>(
      `/posts/${postId}/comments`,
      { params: { page } },
    );
    return data.data;
  },

  async addComment(postId: string, text: string, parentCommentId?: string): Promise<Comment> {
    const { data } = await api.post<{ data: Comment }>(`/posts/${postId}/comments`, {
      text,
      parentCommentId,
    });
    return data.data;
  },
};

export const petApi = {
  async getMyPets(): Promise<PostPet[]> {
    const { data } = await api.get<{ data: PostPet[] }>('/pets');
    return data.data;
  },

  async createPet(petData: {
    name: string; species: string; breed?: string;
    age?: number; gender: string; bio?: string;
  }): Promise<PostPet> {
    const { data } = await api.post<{ data: PostPet }>('/pets', petData);
    return data.data;
  },

  async getPetById(petId: string): Promise<PostPet & {
    owner: PostAuthor; followerCount: number; bio?: string;
    age?: number; gender: string; createdAt: string; isFollowing?: boolean;
  }> {
    const { data } = await api.get(`/pets/${petId}`);
    return data.data;
  },

  async getPetPosts(petId: string, page = 1): Promise<{ items: Post[]; total: number }> {
    const { data } = await api.get<{ data: { items: Post[]; total: number } }>('/posts/explore', {
      params: { page, petId },
    });
    return data.data;
  },

  async updatePet(petId: string, petData: {
    name?: string; species?: string; breed?: string;
    age?: number; gender?: string; bio?: string;
  }): Promise<PostPet> {
    const { data } = await api.put<{ data: PostPet }>(`/pets/${petId}`, petData);
    return data.data;
  },

  async deletePet(petId: string): Promise<void> {
    await api.delete(`/pets/${petId}`);
  },

  async addPetPhoto(petId: string, formData: FormData): Promise<PostPet> {
    const { data } = await api.post<{ data: PostPet }>(`/pets/${petId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};

export const followApi = {
  async toggleFollow(userId: string): Promise<{ following: boolean; followerCount: number; requested?: boolean }> {
    const { data } = await api.post<{ data: { following: boolean; followerCount: number; requested?: boolean } }>(
      `/follows/users/${userId}`,
    );
    return data.data;
  },

  async acceptRequest(requesterId: string): Promise<void> {
    await api.post(`/follows/requests/${requesterId}/accept`);
  },

  async rejectRequest(requesterId: string): Promise<void> {
    await api.post(`/follows/requests/${requesterId}/reject`);
  },

  async getRequests(page = 1): Promise<{ items: any[]; total: number }> {
    const { data } = await api.get<{ data: { items: any[]; total: number } }>(
      '/follows/requests',
      { params: { page } }
    );
    return data.data;
  },

  async removeFollower(followerId: string): Promise<void> {
    await api.delete(`/follows/followers/${followerId}`);
  },
};

export const blockApi = {
  async blockUser(userId: string): Promise<void> {
    await api.post(`/blocks/${userId}`);
  },

  async unblockUser(userId: string): Promise<void> {
    await api.delete(`/blocks/${userId}`);
  },

  async getBlockedUsers(): Promise<any[]> {
    const { data } = await api.get<{ data: any[] }>('/blocks');
    return data.data;
  },
};
