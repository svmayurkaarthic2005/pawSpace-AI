import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';

// ✅ Initialize cloudinary by importing the config
import { env } from '../config/env';
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export interface CloudinaryVideoResult extends CloudinaryUploadResult {
  thumbnail: string;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
  gravity?: 'auto' | 'face' | 'center';
  quality?: 'auto' | number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  radius?: number | 'max';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Upload a buffer to Cloudinary via a stream.
 */
const uploadFromBuffer = (
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<{ secure_url: string; public_id: string; eager?: Array<{ secure_url: string }> }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) return reject(error ?? new Error('Upload failed'));
      resolve(result);
    });
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ─── Upload Image ─────────────────────────────────────────────────────────────

/**
 * Upload an image buffer to Cloudinary.
 * Automatically converts to WebP, applies quality:auto.
 */
export const uploadImage = async (
  buffer: Buffer,
  folder: string = 'pawspace/posts',
  options: Partial<UploadApiOptions> = {},
): Promise<CloudinaryUploadResult> => {
  const result = await uploadFromBuffer(buffer, {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'webp' },
      { width: 1080, crop: 'limit' }, // cap at 1080px wide
    ],
    ...options,
  });

  return { url: result.secure_url, publicId: result.public_id };
};

// ─── Delete Image ─────────────────────────────────────────────────────────────

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple assets in one call.
 */
export const deleteImages = async (publicIds: string[]): Promise<void> => {
  if (publicIds.length === 0) return;
  await cloudinary.api.delete_resources(publicIds);
};

// ─── Upload Video ─────────────────────────────────────────────────────────────

/**
 * Upload a video buffer to Cloudinary.
 * Generates a thumbnail via eager transformation.
 */
export const uploadVideo = async (
  buffer: Buffer,
  folder: string = 'pawspace/videos',
): Promise<CloudinaryVideoResult> => {
  const result = await uploadFromBuffer(buffer, {
    folder,
    resource_type: 'video',
    eager: [
      // Generate a thumbnail at 1 second
      { width: 640, height: 640, crop: 'fill', format: 'jpg', start_offset: '1' },
    ],
    eager_async: false,
    transformation: [{ quality: 'auto' }],
  });

  const thumbnail = result.eager?.[0]?.secure_url ?? result.secure_url;

  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbnail,
  };
};

// ─── Generate Transformation URL ─────────────────────────────────────────────

/**
 * Generate an optimized Cloudinary URL with transformations.
 */
export const generateTransformation = (
  publicId: string,
  options: TransformationOptions = {},
): string => {
  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'webp',
    radius,
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        height,
        crop,
        gravity,
        quality,
        fetch_format: format,
        ...(radius !== undefined && { radius }),
      },
    ],
    secure: true,
  });
};

/**
 * Generate an avatar URL (square, face-crop, WebP).
 */
export const generateAvatarUrl = (publicId: string, size: number = 200): string =>
  generateTransformation(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
    format: 'webp',
    radius: 'max',
  });
