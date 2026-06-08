# Quick Fix: Events Page Error

## The Problem
Events are not appearing on the map because Google Maps API is not configured.

## Quick Fix (5 minutes)

### Step 1: Get Google Maps API Key

1. Go to https://console.cloud.google.com/
2. Create/select project
3. Enable these APIs:
   - **Geocoding API**
   - **Places API**
   - **Directions API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 2: Add API Key to Backend

Edit `apps/backend/.env`:
```env
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
```
(Replace with your actual key)

### Step 3: Verify Configuration

```bash
cd apps/backend
npm run check-config
```

Should show: ✅ Google Maps API

### Step 4: Restart Backend

```bash
npm run dev
```

### Step 5: Fix Existing Events (if you have any)

```bash
npm run fix-events
```

## Verify It Works

1. Open http://localhost:5000/health in browser
2. Should show: `"googleMaps": "configured"`
3. No warnings should appear

## Test Event Creation

1. Open mobile app
2. Create new event
3. Should appear on map at correct location

## Still Having Issues?

See `EVENTS_FIX_GUIDE.md` for detailed troubleshooting.

## Common Issues

### ❌ "Unable to geocode the provided address"
**Cause**: API key not configured or invalid  
**Fix**: Check `.env` file has correct API key

### ❌ Events at location (0, 0) in database
**Cause**: Events created before API was configured  
**Fix**: Run `npm run fix-events`

### ⚠️ API key is placeholder
**Cause**: Using `your_google_maps_api_key_here`  
**Fix**: Replace with real API key from Google Cloud Console

---

**Need help?** Check `EVENTS_FIX_GUIDE.md` for complete instructions.
