# Events Page Error - Fix Guide

## Problem Identified

The events feature was failing because:

1. **Missing Google Maps API Key**: The `GOOGLE_MAPS_API_KEY` was commented out in `apps/backend/.env`
2. **Invalid Coordinates**: Without the API key, the event service was creating events with placeholder coordinates `[0, 0]` (null island in the Atlantic Ocean)
3. **Geospatial Query Failures**: MongoDB's `$geoNear` aggregation was failing or returning no results for events with invalid coordinates

## Changes Made

### 1. Fixed Event Service (`apps/backend/src/services/event.service.ts`)

**Before:**
```typescript
coordinates: {
  type: 'Point',
  coordinates: [0, 0], // TODO: Integrate alternative geocoding service
},
```

**After:**
```typescript
// Geocode address to get coordinates
const geocoded = await geocodeAddress(input.address);
if (!geocoded) {
  throw new AppError(
    'Unable to geocode the provided address. Please provide a more specific address or check if Google Maps API is configured.',
    400,
    true,
    'GEOCODE_FAILED'
  );
}

coordinates: {
  type: 'Point',
  coordinates: [geocoded.lng, geocoded.lat], // [lng, lat] for GeoJSON
},
```

### 2. Updated Environment Configuration (`apps/backend/.env`)

Uncommented the Google Maps API key:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Created Fix Script (`apps/backend/src/scripts/fix-event-coordinates.ts`)

A script to fix existing events with invalid coordinates.

## Setup Instructions

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable these APIs:
   - **Geocoding API** (for address → coordinates)
   - **Places API** (for location search)
   - **Directions API** (for navigation)
4. Create credentials → API Key
5. Restrict the API key (recommended):
   - Application restrictions: HTTP referrers (for web) or IP addresses (for server)
   - API restrictions: Select only the APIs listed above

### Step 2: Add API Key to Backend

Edit `apps/backend/.env`:
```env
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Important**: Replace the placeholder with your actual API key.

### Step 3: Restart Backend Server

```bash
cd apps/backend
npm run dev
```

The server should now log:
```
✓ Google Maps API configured
```

### Step 4: Fix Existing Events (Optional)

If you have existing events with invalid coordinates:

```bash
cd apps/backend
npx ts-node src/scripts/fix-event-coordinates.ts
```

This will:
- Find all events with coordinates `[0, 0]`
- Geocode their addresses
- Update the coordinates
- Show a summary of fixed/failed events

### Step 5: Test Event Creation

1. Open the mobile app
2. Navigate to Create Event
3. Fill in event details with a real address (e.g., "Central Park, New York, NY")
4. Submit the event
5. Verify the event appears on the map at the correct location

## Verification

### Check if API Key is Working

Test the geocoding endpoint:
```bash
curl "http://localhost:5000/api/map/geocode?q=Central+Park+New+York"
```

Should return location suggestions.

### Check Event Coordinates

Query the database:
```javascript
// In MongoDB shell or Compass
db.events.find({
  "location.coordinates.coordinates": { $ne: [0, 0] }
})
```

Events should have real coordinates like `[-73.9654, 40.7829]` (Central Park).

## API Rate Limits & Costs

**Google Maps API pricing** (as of 2024):
- Geocoding: $5 per 1,000 requests (free $200/month credit)
- Places Autocomplete: $2.83 per 1,000 requests  
- Directions: $5 per 1,000 requests

For development:
- The free $200 credit covers ~40,000 geocoding requests/month
- Set up billing alerts in Google Cloud Console

For production:
- Implement caching (Redis) for frequently geocoded addresses
- Consider alternative services like Mapbox or OpenStreetMap for geocoding

## Troubleshooting

### Error: "Unable to geocode the provided address"

**Causes:**
1. Google Maps API key not configured
2. Invalid API key
3. API not enabled in Google Cloud Console
4. Billing not enabled (required even for free tier)
5. API key restrictions too strict

**Solutions:**
1. Check `.env` file has valid API key
2. Verify API key in Google Cloud Console
3. Enable Geocoding API
4. Enable billing in Google Cloud Console
5. Temporarily remove API restrictions for testing

### Events Not Showing on Map

**Causes:**
1. Events have invalid coordinates `[0, 0]`
2. User location not available
3. Events outside search radius

**Solutions:**
1. Run the fix script: `npx ts-node src/scripts/fix-event-coordinates.ts`
2. Grant location permission in the mobile app
3. Increase search radius in map settings

### "Maps Module Error" in Mobile App

This is a React Native maps configuration issue, unrelated to the events backend error. See `apps/mobile/MAPS_TROUBLESHOOTING.md` for resolution.

## Alternative Solutions

If you don't want to use Google Maps:

### Option 1: OpenStreetMap (Nominatim)

Free and open-source geocoding:
```typescript
async function geocodeWithNominatim(address: string) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: address,
      format: 'json',
      limit: 1,
    },
    headers: { 'User-Agent': 'PawSpace/1.0' },
  });
  const result = response.data[0];
  return result ? { lat: parseFloat(result.lat), lng: parseFloat(result.lon) } : null;
}
```

### Option 2: Mapbox Geocoding

Generous free tier (100,000 requests/month):
```typescript
async function geocodeWithMapbox(address: string) {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
    { params: { access_token: MAPBOX_TOKEN } }
  );
  const result = response.data.features[0];
  return result ? { lng: result.center[0], lat: result.center[1] } : null;
}
```

### Option 3: Manual Coordinate Entry

Allow users to manually set coordinates:
- Add lat/lng fields to event creation form
- Show map with draggable pin
- Auto-fill from device GPS

## Testing Checklist

- [ ] Google Maps API key added to `.env`
- [ ] Backend server restarted
- [ ] Geocoding endpoint returns results
- [ ] New events created with valid coordinates
- [ ] Existing events fixed (if any)
- [ ] Events visible on map at correct locations
- [ ] Location search autocomplete working
- [ ] Event details show correct address and map preview

## Related Files

- `apps/backend/src/services/event.service.ts` - Event creation logic
- `apps/backend/src/utils/googleMaps.util.ts` - Geocoding utilities
- `apps/backend/src/models/event.model.ts` - Event schema with geospatial index
- `apps/backend/src/repositories/event.repository.ts` - Database queries
- `apps/backend/src/controllers/event.controller.ts` - API endpoints
- `apps/backend/.env` - Configuration (not in git)

## Summary

The events page error was caused by missing geocoding configuration. With the Google Maps API key properly configured, events will now:
1. Have valid coordinates when created
2. Appear on the map at correct locations  
3. Be searchable by proximity
4. Support directions and navigation

The fix is complete and the events feature should now work as expected!
