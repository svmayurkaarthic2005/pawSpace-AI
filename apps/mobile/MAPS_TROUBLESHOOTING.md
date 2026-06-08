# React Native Maps Troubleshooting Guide

## Problem: RNMapsAirModule could not be found

This error occurs when the native Android module for `react-native-maps` is not properly linked.

### Root Causes
1. ✅ JavaScript package installed BUT
2. ❌ Native Android build does NOT include the maps module
3. ❌ Build cache contains old/broken native code
4. ❌ New Architecture compatibility issues

## Quick Fix

### Windows PowerShell
```powershell
cd apps/mobile
.\scripts\fix-react-native-maps.ps1
```

### macOS/Linux
```bash
cd apps/mobile
chmod +x scripts/fix-react-native-maps.sh
./scripts/fix-react-native-maps.sh
```

## What the Fix Does

1. **Stops Metro** - Prevents cached code issues
2. **Cleans Gradle caches** - Removes old native builds
3. **Deletes node_modules** - Fresh start for dependencies
4. **Installs compatible version** - `react-native-maps@1.18.0` for RN 0.73
5. **Verifies configuration** - Checks `newArchEnabled=false`
6. **Cleans Metro cache** - Removes bundler cache

## Manual Steps (if script fails)

### 1. Clean Everything
```bash
# Stop all processes
# Close all terminals running Metro

# Android clean
cd android
./gradlew clean  # Windows: .\gradlew.bat clean
cd ..

# Delete caches
rm -rf android/.gradle
rm -rf android/app/build
rm -rf android/build
rm -rf node_modules
```

### 2. Install Compatible Version
```bash
npm cache clean --force
npm install react-native-maps@1.18.0 --save-exact
npm install
```

### 3. Verify Configuration

**Check android/gradle.properties:**
```properties
newArchEnabled=false  # MUST be false for maps to work
hermesEnabled=true    # OK
```

**Check android/settings.gradle:**
- Should NOT have manual `include ':react-native-maps'` entries
- Autolinking handles it automatically

**Check MainApplication.kt:**
- Should NOT manually import MapsPackage
- PackageList autolinking handles it

### 4. Complete Rebuild
```bash
# Uninstall old app
adb uninstall com.mayur.pawspace

# Rebuild from scratch (NOT just reload!)
npx react-native run-android
```

## Version Compatibility

| React Native | react-native-maps | Status |
|-------------|-------------------|---------|
| 0.73.x      | 1.18.0           | ✅ Tested & Works |
| 0.73.x      | 1.20.1           | ⚠️ May have issues |
| 0.76.x      | 1.20.1           | ✅ Recommended |

## Common Issues

### Issue 1: Still seeing RNMapsAirModule error after fix

**Solution:**
```bash
# Completely uninstall and rebuild
adb uninstall com.mayur.pawspace
cd android
./gradlew clean
cd ..
rm -rf android/app/build
npx react-native run-android
```

### Issue 2: Location request timed out

This is a **separate issue** from RNMapsAirModule.

**Solution:**
1. Open Android Emulator
2. Click Extended Controls (...) 
3. Go to Location tab
4. Set location manually:
   - Example: Latitude: `13.0827`, Longitude: `80.2707` (Chennai)
5. Click "Send Location"

Or use ADB:
```bash
adb emu geo fix 80.2707 13.0827
```

### Issue 3: Google Maps API key issues

**Check AndroidManifest.xml:**
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ACTUAL_API_KEY_HERE"/>
```

Get your key from: https://console.cloud.google.com/google/maps-apis

**Required APIs:**
- Maps SDK for Android
- Places API
- Directions API

### Issue 4: Metro bundler shows maps but app crashes

**Solution:**
```bash
# Clear Metro cache completely
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*

# Windows:
# Delete %LOCALAPPDATA%\Temp\metro-*

# Restart Metro with clean cache
npx react-native start --reset-cache
```

## Verification Checklist

After running the fix, verify:

- [ ] `node_modules/react-native-maps` exists
- [ ] `android/gradle.properties` has `newArchEnabled=false`
- [ ] No manual linking entries in `android/settings.gradle`
- [ ] No manual MapsPackage in `MainApplication.kt`
- [ ] App builds without errors: `npx react-native run-android`
- [ ] Map component renders in app
- [ ] No red screen errors about RNMapsAirModule

## Still Having Issues?

### Check Native Module is Included

```bash
# Build the app in debug mode
cd android
./gradlew :app:bundleDebugJsAndAssets

# Check if maps is included in the build
grep -r "RNMapsAirModule" app/build/
```

### Check Autolinking

```bash
# See what packages are autolinked
npx react-native config
```

Look for `react-native-maps` in the output. It should be listed under Android packages.

### Enable Verbose Logging

Edit `android/app/build.gradle`:
```gradle
react {
    // ... other config
    verbose = true
}
```

Then rebuild to see detailed autolinking logs.

## Success Indicators

You know it's working when:

1. ✅ App builds successfully
2. ✅ No "RNMapsAirModule" errors in logcat
3. ✅ Map component renders (even if showing "For development purposes only" watermark)
4. ✅ You can pan/zoom the map
5. ✅ Markers appear if you add them

## Need More Help?

Check the logs:
```bash
# Android logcat
adb logcat | grep -i "maps\|RNMaps"

# React Native logs
npx react-native log-android
```

Look for:
- Native module registration errors
- API key issues
- Permission errors
- Memory issues
