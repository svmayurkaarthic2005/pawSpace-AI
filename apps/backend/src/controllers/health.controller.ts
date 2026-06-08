import { Request, Response } from 'express';
import { env } from '../config/env';

/**
 * Health check endpoint with service status
 */
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      googleMaps: env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY.length > 20 ? 'configured' : 'not_configured',
      cloudinary: env.CLOUDINARY_API_KEY ? 'configured' : 'not_configured',
      firebase: env.FIREBASE_PROJECT_ID ? 'configured' : 'not_configured',
      groq: env.GROQ_API_KEY ? 'configured' : 'not_configured',
    },
    warnings: [] as string[],
  };

  // Check for common configuration issues
  if (!env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY.length < 20) {
    health.warnings.push(
      'Google Maps API key not configured. Event creation and location features will fail. See EVENTS_FIX_GUIDE.md'
    );
  }

  if (env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
    health.warnings.push(
      'Google Maps API key is still the placeholder value. Replace it with a real API key from https://console.cloud.google.com/'
    );
  }

  const statusCode = health.warnings.length > 0 ? 200 : 200; // Still return 200, but warnings indicate issues
  res.status(statusCode).json(health);
};

/**
 * Detailed service configuration check
 */
export const configCheck = async (_req: Request, res: Response): Promise<void> => {
  const config = {
    environment: env.NODE_ENV,
    services: {
      googleMaps: {
        configured: !!(env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY.length > 20),
        isPlaceholder: env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here',
        keyLength: env.GOOGLE_MAPS_API_KEY?.length || 0,
        features: {
          geocoding: !!(env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY.length > 20),
          placesSearch: !!(env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY.length > 20),
          directions: !!(env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY.length > 20),
        },
      },
      cloudinary: {
        configured: !!(env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
        features: {
          imageUpload: !!(env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
        },
      },
      firebase: {
        configured: !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY),
        features: {
          pushNotifications: !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY),
        },
      },
      groq: {
        configured: !!env.GROQ_API_KEY,
        features: {
          aiAssistant: !!env.GROQ_API_KEY,
          eventRecommendations: !!env.GROQ_API_KEY,
        },
      },
    },
    recommendations: [] as string[],
  };

  // Add recommendations
  if (!config.services.googleMaps.configured || config.services.googleMaps.isPlaceholder) {
    config.recommendations.push(
      '⚠️  Configure Google Maps API key for event creation and location features'
    );
    config.recommendations.push(
      '📖 See EVENTS_FIX_GUIDE.md for setup instructions'
    );
  }

  res.json(config);
};
