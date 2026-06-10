import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * For physical Android devices, you MUST set API_URL in your .env file
 * to your computer's local IP address (e.g., http://192.168.1.100:5000)
 * 
 * Find your IP:
 * - Windows: Run `ipconfig` and look for IPv4 Address
 * - Mac/Linux: Run `ifconfig` or `ip addr`
 * 
 * DO NOT use localhost or 127.0.0.1 - physical devices cannot reach those.
 */

// Get base URL from environment variable if set
const ENV_API_URL = process.env.API_BASE_URL;

// Default host configuration for development
const getDefaultDevHost = (): string => {
  if (!__DEV__) {
    return 'https://api.pawspace.app';
  }

  // In development, use platform-specific defaults
  return Platform.select({
    // Android emulator can reach host machine via 10.0.2.2
    android: '10.0.2.2',
    // iOS simulator can use localhost
    ios: 'localhost',
    default: 'localhost',
  }) as string;
};

// Build API base URL
const buildApiUrl = (): string => {
  // If API_URL is explicitly set in .env, use it (supports custom IPs for physical devices)
  if (ENV_API_URL) {
    return ENV_API_URL;
  }

  // Otherwise, construct from default dev host
  const host = getDefaultDevHost();
  
  // Production URL already includes protocol
  if (!__DEV__) {
    return `${host}/api/v1`;
  }

  // Development URL
  return `http://${host}:5000/api/v1`;
};

// Build Socket URL (base without /api/v1 path)
const buildSocketUrl = (): string => {
  // If API_URL is explicitly set in .env, derive socket URL from it
  if (ENV_API_URL) {
    // Remove /api/v1 suffix if present
    return ENV_API_URL.replace(/\/api\/v1$/, '');
  }

  // Otherwise, construct from default dev host
  const host = getDefaultDevHost();
  
  // Production URL
  if (!__DEV__) {
    return host;
  }

  // Development URL
  return `http://${host}:5000`;
};

export const API_BASE_URL = buildApiUrl();
export const SOCKET_BASE_URL = buildSocketUrl();

// Log the configuration in development
if (__DEV__) {
  console.log('[Config] API Configuration:', {
    apiBaseUrl: API_BASE_URL,
    socketBaseUrl: SOCKET_BASE_URL,
    platform: Platform.OS,
    isEmulator: Platform.OS === 'android' && API_BASE_URL.includes('10.0.2.2'),
    envApiUrl: ENV_API_URL || 'not set',
  });
  
  // Warn if on Android and using emulator IP
  if (Platform.OS === 'android' && API_BASE_URL.includes('10.0.2.2')) {
    console.warn(
      '[Config] Using Android emulator IP (10.0.2.2).\n' +
      'If running on a physical device, set API_BASE_URL in .env to your computer\'s local IP address.\n' +
      'Example: API_BASE_URL=http://192.168.1.100:5000/api/v1'
    );
  }
}
