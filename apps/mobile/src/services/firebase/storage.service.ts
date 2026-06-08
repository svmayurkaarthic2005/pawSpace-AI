import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

/**
 * Firebase Storage Service
 * Handle file uploads and downloads
 */

export class FirebaseStorageService {
  /**
   * Upload a file to Firebase Storage
   */
  static async uploadFile(
    localFilePath: string,
    storagePath: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Convert file path for Android
      const path = Platform.OS === 'android' 
        ? localFilePath.replace('file://', '') 
        : localFilePath;

      const reference = storage().ref(storagePath);
      const task = reference.putFile(path);

      // Listen to upload progress
      if (onProgress) {
        task.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }

      await task;

      // Get download URL
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: Array<{ localPath: string; storagePath: string }>,
    onProgress?: (index: number, progress: number) => void
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) =>
        this.uploadFile(
          file.localPath,
          file.storagePath,
          onProgress ? (progress) => onProgress(index, progress) : undefined
        )
      );

      return await Promise.all(uploadPromises);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload multiple files');
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  static async deleteFile(storagePath: string): Promise<void> {
    try {
      const reference = storage().ref(storagePath);
      await reference.delete();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  /**
   * Get download URL for a file
   */
  static async getDownloadURL(storagePath: string): Promise<string> {
    try {
      const reference = storage().ref(storagePath);
      return await reference.getDownloadURL();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get download URL');
    }
  }

  /**
   * List files in a directory
   */
  static async listFiles(storagePath: string): Promise<string[]> {
    try {
      const reference = storage().ref(storagePath);
      const result = await reference.list();
      
      return result.items.map((item) => item.fullPath);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to list files');
    }
  }

  /**
   * Generate a unique storage path for a file
   */
  static generateStoragePath(
    userId: string,
    folder: 'profiles' | 'pets' | 'posts' | 'events',
    fileName: string
  ): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    return `${folder}/${userId}/${timestamp}.${extension}`;
  }
}

export default FirebaseStorageService;
