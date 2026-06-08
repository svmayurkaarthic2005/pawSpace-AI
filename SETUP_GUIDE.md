# Create Post Screen - Setup Guide

## Prerequisites

- Node.js 18+ installed
- React Native development environment set up
- Android Studio or Xcode configured
- Backend server running
- MongoDB and Redis running

## Step 1: Install Dependencies

### Mobile App
```bash
cd apps/mobile
npm install --save --legacy-peer-deps @gorhom/bottom-sheet react-native-video
```

### Backend (if needed)
```bash
cd apps/backend
npm install
```

## Step 2: Configure Environment Variables

### Backend (.env)
```env
# Add to existing .env file
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

**Get Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Places API
   - Geocoding API
4. Go to Credentials → Create Credentials → API Key
5. Restrict the API key to your backend server IP
6. Copy the API key to your .env file

### Mobile (.env)
No changes needed. The app uses the backend proxy for Google Maps.

## Step 3: Platform-Specific Setup

### iOS
1. Install CocoaPods dependencies:
```bash
cd apps/mobile/ios
pod install
cd ..
```

2. Add location permissions to `ios/PawSpace/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to help you find nearby pet-friendly places</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to help you find nearby pet-friendly places</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photos to let you share pet moments</string>
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to let you capture pet moments</string>
```

### Android
1. Add permissions to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

2. For React Native 0.73+, ensure `react-native-video` is linked:
```bash
cd android
./gradlew clean
cd ..
```

## Step 4: Rebuild Native Code

### iOS
```bash
npm run ios
# or
react-native run-ios
```

### Android
```bash
npm run android
# or
react-native run-android
```

## Step 5: Start Development Servers

### Terminal 1: Backend
```bash
cd apps/backend
npm run dev
```

### Terminal 2: Mobile Metro
```bash
cd apps/mobile
npm start
```

## Step 6: Test the Implementation

1. Launch the app on simulator/device
2. Log in with a test account
3. Navigate to the Feed screen
4. Tap the "+" (Create) button in the bottom tab bar
5. The Create Post screen should open as a modal

### Test Checklist
- [ ] Pick image from gallery
- [ ] Apply a filter (Warm, Cool, etc.)
- [ ] Write a caption with hashtag (e.g., "#goldenretriever")
- [ ] Tap a hashtag suggestion
- [ ] Tag a pet (you'll need at least one pet added to your profile)
- [ ] Generate AI caption (requires pet to be tagged)
- [ ] Search for a location
- [ ] Use current location (grant permission if prompted)
- [ ] Press "Share" and verify post appears in feed

## Troubleshooting

### "Module not found" errors
```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear watchman
watchman watch-del-all

# Reinstall dependencies
rm -rf node_modules
npm install
```

### "Bottom sheet not working"
```bash
# Rebuild native code
cd ios && pod install && cd ..
npm run ios
```

### "Location permission always denied"
- iOS: Check Settings → Privacy → Location Services → PawSpace
- Android: Check Settings → Apps → PawSpace → Permissions

### "Upload fails"
- Verify backend is running on port 5000
- Check backend logs for errors
- Verify Cloudinary credentials in backend .env
- Check file size limits (default: 10MB per image, 50MB for video)

### "AI caption generation fails"
- Verify GROQ_API_KEY is set in backend .env
- Check backend logs for AI service errors
- Verify Groq API quota hasn't been exceeded

### "Google Places returns no results"
- Verify GOOGLE_MAPS_API_KEY is set in backend .env
- Check Google Cloud Console for API quota usage
- Ensure Places API and Geocoding API are enabled
- Verify API key restrictions allow your backend server

### Backend port mismatch
The mobile app expects the backend on port **5000**, not 3000.

If your backend runs on a different port:
1. Update `apps/mobile/src/constants/index.ts`:
```typescript
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:YOUR_PORT/api/v1'
  : 'https://api.pawspace.app/api/v1';
```

## Testing on Physical Devices

### iOS Device
1. Connect device via USB
2. Select device in Xcode
3. Run: `npm run ios --device "Device Name"`

### Android Device
1. Enable USB debugging on device
2. Connect via USB
3. Run: `adb devices` to verify connection
4. Update API URL for device network:
```typescript
// In constants/index.ts
export const API_BASE_URL = __DEV__
  ? 'http://YOUR_COMPUTER_IP:5000/api/v1'
  : 'https://api.pawspace.app/api/v1';
```
5. Run: `npm run android`

## Production Checklist

Before deploying to production:

- [ ] Replace mock community data with real API
- [ ] Implement real upload progress with XMLHttpRequest
- [ ] Add error tracking (Sentry, etc.)
- [ ] Add analytics events
- [ ] Test on low-end devices
- [ ] Test with slow network (throttle in dev tools)
- [ ] Add image compression settings based on network speed
- [ ] Implement retry logic for failed uploads
- [ ] Add draft saving for interrupted uploads
- [ ] Test with various image formats (HEIC, PNG, GIF)
- [ ] Test video upload and playback
- [ ] Verify Cloudinary costs and optimize transformations
- [ ] Set up CDN caching rules
- [ ] Configure rate limits for AI caption generation
- [ ] Add telemetry for feature usage
- [ ] Implement A/B testing for UI variations

## Performance Optimization

### Image Optimization
- Images are automatically converted to WebP on Cloudinary
- Max width capped at 1080px
- Quality set to "auto" for optimal size/quality balance

### Video Optimization
- Thumbnail generated at 1 second mark
- Thumbnail size: 640x640px
- Consider implementing adaptive bitrate for video playback

### Network Optimization
- Use pagination for pet/community lists
- Cache recent locations in AsyncStorage
- Debounce location search (400ms)
- Cache hashtag suggestions

### Memory Optimization
- Use FastImage for image caching
- Clear large objects after upload
- Monitor memory usage with React DevTools

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs
3. Check mobile device logs (Xcode/Logcat)
4. Verify all environment variables are set
5. Ensure all permissions are granted

## Next Steps

After successful setup:
1. Customize filters and add more
2. Integrate with your analytics platform
3. Add post scheduling feature
4. Implement draft posts
5. Add collaborative posts (tag multiple users)
6. Implement post insights/analytics

## Resources

- [React Native Image Picker](https://github.com/react-native-image-picker/react-native-image-picker)
- [Bottom Sheet](https://github.com/gorhom/react-native-bottom-sheet)
- [React Native Video](https://github.com/react-native-video/react-native-video)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Google Maps Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Groq AI API](https://console.groq.com/docs)
