# Android Maps Native Module Fix

## Problem

The Android app crashes with:
```
Error: Unable to find module for RNMapsAirModule
```

This indicates that `react-native-maps` native module is not properly linked to the Android build.

## Root Causes

1. **Version incompatibility**: `react-native-maps@1.27.2` has known issues with React Native 0.73.x
2. **New Architecture conflicts**: React Native's New Architecture can cause linking issues
3. **Broken autolinking**: Native module autolinking may fail silently
4. **Stale build cache**: Old Gradle caches can prevent proper native module compilation

## Solution

### Automated Fix (Recommended)

Run the comprehensive fix script:

```powershell
cd apps/mobile
.\scripts\fix-android-maps.ps1
```

This script will:
1. ✅ Disable New Architecture (if enabled)
2. ✅ Clean all build artifacts
3. ✅ Downgrade to stable `react-native-maps@1.14.0`
4. ✅ Reinstall all dependencies
5. ✅ Verify autolinking configuration
6. ✅ Clean Android Gradle build

### Manual Steps

If you prefer to fix manually:

#### Step 1: Disable New Architecture

Edit `android/gradle.properties`:
```properties
newArchEnabled=false
```

#### Step 2: Clean Everything

```powershell
# Remove build artifacts
Remove-Item -Recurse -Force android/.gradle
Remove-Item -Recurse -Force android/app/build
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

#### Step 3: Install Stable Maps Version

```bash
npm uninstall react-native-maps react-native-map-clustering
npm install react-native-maps@1.14.0 --save --legacy-peer-deps
npm install react-native-map-clustering@4.0.0 --save --legacy-peer-deps
npm install --legacy-peer-deps
```

#### Step 4: Verify Autolinking

```bash
npx react-native config
```

Look for `react-native-maps` in the output. If not present, autolinking is broken.

#### Step 5: Clean Android Build

```powershell
cd android
.\gradlew.bat clean
cd ..
```

#### Step 6: Rebuild

Terminal 1:
```bash
npm run start:reset
```

Terminal 2:
```bash
npm run android
```

### Manual Linking (Last Resort)

If autolinking fails completely, run the manual linking script:

```powershell
.\scripts\fix-android-maps-manual.ps1
```

This will add explicit imports to `MainApplication.kt`:

```kotlin
import com.rnmaps.maps.MapsPackage

// In getPackages():
PackageList(this).packages.apply { add(MapsPackage()) }
```

## Verification

After applying the fix:

1. **Check Metro bundler**: Should start without errors
2. **Check Android build**: Should compile successfully
3. **Check app launch**: Map screen should render without crashes
4. **Check logs**: No "RNMapsAirModule" errors

## Version Information

- **React Native**: 0.73.2
- **react-native-maps**: 1.14.0 (downgraded from 1.27.2)
- **react-native-map-clustering**: 4.0.0
- **New Architecture**: Disabled

## Why Version 1.14.0?

- ✅ Proven stable with RN 0.73.x
- ✅ No New Architecture conflicts
- ✅ Reliable autolinking
- ✅ Wide community adoption
- ✅ All features work (markers, clustering, gestures)

## Troubleshooting

### Script fails at npm install

Try adding `--force` flag:
```bash
npm install --force --legacy-peer-deps
```

### Gradlew not found

Ensure you're in the correct directory:
```bash
cd apps/mobile
```

### Still seeing RNMapsAirModule error

1. Verify `newArchEnabled=false` in gradle.properties
2. Delete `android/app/build` completely
3. Run manual linking script
4. Full rebuild from scratch

### Maps render but no markers

This is a different issue - check:
- Google Maps API key in `.env`
- API key enabled in Google Cloud Console
- Billing enabled on Google Cloud project

## Prevention

To avoid this issue in the future:

1. **Pin dependencies**: Use exact versions in package.json
2. **Test before upgrading**: Check compatibility before updating react-native-maps
3. **Keep New Architecture disabled**: Until full ecosystem support
4. **Document working versions**: Maintain version compatibility matrix

## Related Issues

- React Native Maps GitHub issues: #4856, #5023
- React Native New Architecture incompatibilities
- Gradle caching issues with native modules

## Support

If you continue experiencing issues:
1. Share full error logs
2. Run `npx react-native info` and share output
3. Check `android/app/build.gradle` for conflicts
4. Verify Java/Gradle versions match requirements
