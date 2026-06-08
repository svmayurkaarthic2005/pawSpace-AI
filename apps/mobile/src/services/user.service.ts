import api from './api';
import { User } from '../types';

interface UpdateProfilePayload {
  name: string;
  username: string;
  bio: string;
  locationName: string;
  avatar?: string;
  coverImage?: string;
  isProfileComplete?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const userApi = {
  /**
   * Update the current user's profile
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>('/users/profile', payload);
    return data.data;
  },

  /**
   * Update profile with avatar upload
   */
  async updateProfileWithAvatar(formData: FormData): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${userId}/profile`);
    return data.data;
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/users/me');
    return data.data;
  },

  /**
   * Get nearby users (geolocation-based discovery)
   */
  async getNearbyUsers(): Promise<User[]> {
    const { data } = await api.get<ApiResponse<User[]>>('/users/nearby');
    return data.data;
  },
};
