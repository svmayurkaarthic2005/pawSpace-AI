# Map Discovery Screen - Setup Guide

## Overview
The Map Discovery screen is a fully functional React Native screen using Google Maps (react-native-maps) with:
- Real-time nearby event and pet owner discovery
- Custom map markers with clustering
- Floating search bar with place autocomplete
- Bottom sheet with two tabs (Events / Pet Owners)
- Filter sheet for species, radius, and date
- AI-powered icebreakers for "Say Hi"
- Full location permission handling
- Turn-by-turn directions

## Dependencies Installed
```bash
npm install --legacy-peer-deps react-native-maps @gorhom/bottom-sheet @react-native-community/slider react-native-permissions react-native-haptic-feedback react-native-map-clustering @react-native-community/geolocation
```

## Android Setup

### 1. build.gradle Configuration
File: `apps/mobile/android/app/build.gradle`

The GOOGLE_MAPS_API_KEY has been added to manifestPlaceholders:
```gradle
manifestPlaceholders = [
    usesCleartextTraffic: "true",
    GOOGLE_MAPS_API_KEY: System.getenv("GOOGLE_MAPS_API_KEY") ?: ""
]
```

### 2. AndroidManifest.xml
File: `apps/mobile/android/app/src/main/AndroidManifest.xml`

The Google Maps API key meta-data is already configured:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="AIzaSyC3fsrBckfPWI1VELnmdmaOWnLJpclkfVw"/>
```

### 3. Permissions
Already configured in AndroidManifest.xml:
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION

## iOS Setup

### 1. AppDelegate Configuration
File: `apps/mobile/ios/myapp/AppDelegate.swift`

Google Maps has been initialized:
```swift
import GoogleMaps

GMSServices.provideAPIKey(googleMapsApiKey)
```

### 2. Info.plist
File: `apps/mobile/ios/myapp/Info.plist`

Location usage descriptions have been added:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>PawSpace needs your location to show nearby pet events and owners</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>PawSpace uses your location to show nearby pets and events</string>
```

### 3. Podfile
Run after setup:
```bash
cd apps/mobile/ios
pod install
```

## Environment Variables

### Mobile (.env)
```bash
GOOGLE_MAPS_API_KEY=AIzaSyC3fsrBckfPWI1VELnmdmaOWnLJpclkfVw
```

### Backend (.env)
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Backend Routes Created

### GET /api/v1/map/events
Fetch nearby events with geospatial query
- Query params: lat, lng, radius (km), species (comma-separated), dateFilter
- Returns: Array of events with distance

### GET /api/v1/map/users
Fetch nearby pet owners
- Query params: lat, lng, radius (km), species (optional)
- Returns: Array of users with their first pet

### POST /api/v1/map/location
Update user's current location
- Body: { lat, lng, accuracy }
- Caches in Redis with 5-minute TTL

### GET /api/v1/map/geocode
Search for places (autocomplete)
- Query params: q (search query), lat, lng (proximity)
- Returns: Array of place results

### GET /api/v1/map/directions
Get turn-by-turn directions
- Query params: originLat, originLng, destLat, destLng, mode (walking/driving)
- Returns: { coordinates: [], duration, distance }

## Database

### UserLocation Model
- Geospatial 2dsphere index on location.coordinates
- TTL index (1 hour) on updatedAt
- Automatically deletes stale locations

## Component Structure

```
src/screens/map/
└── MapDiscoveryScreen.tsx          # Main screen

src/components/map/
├── GoogleMap.tsx                    # MapView wrapper with markers
├── EventMarker.tsx                  # Custom event markers
├── UserMarker.tsx                   # Custom user markers
├── FloatingSearchBar.tsx            # Top search bar with autocomplete
├── LocationPermissionModal.tsx      # Initial permission request
├── LocationDeniedBanner.tsx         # Shown when permission denied
├── SelectedEventPopup.tsx           # Event detail popup on marker tap
├── SelectedUserPopup.tsx            # User detail popup on marker tap
├── MapBottomSheet.tsx               # Bottom sheet with tabs
├── NearbyEventsList.tsx             # Events tab content
├── NearbyOwnersList.tsx             # Pet owners tab content
└── FilterSheet.tsx                  # Filter bottom sheet

src/hooks/
└── useLocation.ts                   # Location permission & tracking hook

src/utils/
├── formatDistance.ts                # Format km/m distances
├── formatEventDate.ts               # Format event dates
└── decodePolyline.ts                # Decode Google polyline for routes

src/constants/
└── googleMapDarkStyle.json          # Dark theme for Google Maps
```

## Usage

### Add to Navigation
The screen should be added to your tab or stack navigator:
```typescript
<Tab.Screen
  name="Discover"
  component={MapDiscoveryScreen}
  options={{
    tabBarIcon: ({ color }) => <Icon name="map" color={color} size={24} />,
    headerShown: false,
  }}
/>
```

### Features

1. **Location Permission**
   - Automatic permission request on mount
   - Permission modal for initial request
   - Denied/blocked banner with "Open Settings" button

2. **Map Markers**
   - Events: Color-coded by type (meetup, training, vet, social)
   - Users: Pet avatar with purple ring
   - Clustering: Automatic grouping at low zoom levels
   - tracksViewChanges={false} for performance

3. **Search**
   - Debounced autocomplete (400ms)
   - Proximity-biased results
   - Tap result to animate map

4. **Filters**
   - Species: Dog, Cat, Bird, Rabbit, Other
   - Radius: 1-50 km slider
   - Date: Any, Today, Weekend, This week

5. **Bottom Sheet**
   - 3 snap points: 20%, 45%, 85%
   - Two tabs: Events / Pet Owners
   - Tap event/user to navigate to detail
   - Tap event image to focus marker

6. **Popups**
   - Event: Shows cover, title, date, distance, RSVP count, "Directions" & "View Details" buttons
   - User: Shows pet/avatar, name, breed, distance, "Say Hi" button

7. **Directions**
   - Fetches route from Google Directions API
   - Draws polyline on map
   - Fits map to show both origin and destination

8. **Say Hi**
   - Fetches AI icebreaker from /ai/conversation-starters
   - Creates/gets chat from /chats
   - Navigates to ChatRoom with pre-filled message

## Performance Optimizations

1. **Marker Performance**
   - `tracksViewChanges={false}` on all markers
   - Only set `tracksViewChanges={true}` temporarily when marker state changes
   - Limits re-renders on map pan/zoom

2. **Clustering**
   - Uses react-native-map-clustering
   - minPoints=3 to group nearby markers
   - Reduces marker count at low zoom

3. **Query Optimization**
   - MongoDB geospatial aggregation with $geoNear
   - Indexed location.coordinates with 2dsphere
   - Query limited to 50 events, 60 users
   - 60s stale time, 2-minute refetch interval

4. **Location Updates**
   - distanceFilter: 50m (only update if moved 50+ meters)
   - interval: 15s
   - Throttled backend updates

## Testing

### Android
```bash
cd apps/mobile
npx react-native run-android
```

### iOS
```bash
cd apps/mobile
cd ios && pod install && cd ..
npx react-native run-ios
```

## Troubleshooting

### Android: Map shows blank
- Ensure GOOGLE_MAPS_API_KEY is in .env
- Check Android API key is enabled for "Maps SDK for Android"
- Rebuild: `npx react-native run-android`

### iOS: Map shows blank
- Run `cd ios && pod install`
- Ensure iOS API key is enabled for "Maps SDK for iOS"
- Clean build: `npx react-native run-ios --clean`

### Location permission not working
- Android: Check ACCESS_FINE_LOCATION in AndroidManifest.xml
- iOS: Check Info.plist has NSLocationWhenInUseUsageDescription
- Emulator: Set location in emulator settings

### Markers not appearing
- Check API response in network tab
- Verify location.coordinates format: [lng, lat] (not [lat, lng])
- Check MongoDB 2dsphere index exists

## API Key Setup

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
4. Create API key in "Credentials"
5. Restrict key:
   - Android: Add app package name + SHA-1 certificate fingerprint
   - iOS: Add bundle identifier
   - Server: Restrict to server IP
6. Add to .env files

## Next Steps

1. Test on physical devices for real location tracking
2. Add more event types and custom marker icons
3. Implement saved locations/favorites
4. Add map style toggle (light/dark)
5. Implement marker clustering customization
6. Add distance-based notifications
