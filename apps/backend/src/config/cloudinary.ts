import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const uploadImage = async (
  filePathOrBuffer: string | Buffer,
  folder: string = 'pawspace',
  options: Record<string, unknown> = {},
): Promise<UploadResult> => {
  // Handle buffer uploads
  if (Buffer.isBuffer(filePathOrBuffer)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          ...options,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );
      uploadStream.end(filePathOrBuffer);
    });
  }

  // Handle file path uploads
  const result = await cloudinary.uploader.upload(filePathOrBuffer, {
    folder,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    ...options,
  });

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const uploadVideo = async (
  buffer: Buffer,
  folder: string = 'pawspace/posts',
): Promise<{ url: string; publicId: string; thumbnail?: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        eager: [{ width: 400, height: 400, crop: 'fill', format: 'jpg' }],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Video upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          thumbnail: result.eager?.[0]?.secure_url,
        });
      },
    );
    uploadStream.end(buffer);
  });
};

export const getOptimizedUrl = (
  publicId: string,
  width?: number,
  height?: number,
): string => {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    secure: true,
  });
};
