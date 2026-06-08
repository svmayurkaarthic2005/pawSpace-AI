# React Native Maps Fix Guide

## Problem
The error `RNMapsAirModule could not be found` means the native module for react-native-maps is not properly linked or compiled into the Android app.

## Quick Fix (Recommended)

Run this automated script:

```powershell
cd apps/mobile
./scripts/fix-maps-android.ps1
```

Then follow the on-screen instructions.

## Manual Fix Steps

If the script doesn't work, follow these manual steps:

### Step 1: Stop Everything
```bash
# Stop Metro bundler (Ctrl+C in its terminal)
# Or kill all node processes
taskkill /F /IM node.exe
```

### Step 2: Clean Android Build
```bash
cd apps/mobile/android
gradlew.bat clean
cd ..
```

### Step 3: Remove Build Artifacts
```bash
# From apps/mobile directory
Remove-Item -Recurse -Force android/app/build
Remove-Item -Recurse -Force android/build
Remove-Item -Recurse -Force android/.gradle
```

### Step 4: Clear Metro Cache
```bash
# From apps/mobile directory
npx react-native start --reset-cache
```

Keep this terminal open!

### Step 5: Rebuild (in NEW terminal)
```bash
cd apps/mobile
npx react-native run-android
```

This will take 5-10 minutes for a complete rebuild.

## Verification Checklist

After rebuild, verify these configurations are correct:

### ✅ Package.json
```json
"react-native-maps": "^1.27.2"
```

### ✅ AndroidManifest.xml
Location: `apps/mobile/android/app/src/main/AndroidManifest.xml`

```xml
<application>
  <!-- Google Maps API Key -->
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyC3fsrBckfPWI1VELnmdmaOWnLJpclkfVw"/>
</application>
```

### ✅ build.gradle
Location: `apps/mobile/android/app/build.gradle`

```gradle
dependencies {
    // ... other dependencies
    
    // Google Maps
    implementation 'com.google.android.gms:play-services-maps:18.2.0'
}

// At the bottom
apply from: file("../../../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); 
applyNativeModulesAppBuildGradle(project)
```

### ✅ MainApplication.kt
Location: `apps/mobile/android/app/src/main/java/com/mayur/pawspace/MainApplication.kt`

The file should use `PackageList(this).packages` which handles autolinking:

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
      // Packages that cannot be autolinked yet can be added manually here
    }
```

## Common Issues & Solutions

### Issue 1: "Could not determine the dependencies"
**Solution:** Clean gradle cache
```bash
cd android
gradlew.bat clean
gradlew.bat --stop
Remove-Item -Recurse -Force .gradle
cd ..
```

### Issue 2: "Duplicate class found"
**Solution:** Check for conflicting versions
```bash
cd android
gradlew.bat app:dependencies
```
Look for multiple versions of the same library.

### Issue 3: "SDK location not found"
**Solution:** Create `android/local.properties`:
```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Issue 4: Metro bundler shows old code
**Solution:** Reset cache completely
```bash
npx react-native start --reset-cache
# Also clear watchman
watchman watch-del-all
```

### Issue 5: Google Maps not showing
**Solution:** Verify API key is valid
1. Go to https://console.cloud.google.com/
2. Enable "Maps SDK for Android"
3. Create/verify API key
4. Add key to AndroidManifest.xml

## Why This Happens

React Native Maps requires:
1. **JavaScript package** (installed via npm) ✅
2. **Native Android code** (compiled into APK) ❌

The error means #2 is missing. This happens when:
- Installing maps package after app was already built
- Gradle cache issues
- Metro bundler using old cached code
- Autolinking didn't run properly

## Complete Clean & Rebuild

If nothing else works, nuclear option:

```bash
# 1. Delete everything
cd apps/mobile
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force android/build
Remove-Item -Recurse -Force android/app/build
Remove-Item -Recurse -Force android/.gradle

# 2. Reinstall from root
cd ../..
npm install

# 3. Clean and rebuild
cd apps/mobile/android
gradlew.bat clean
cd ..

# 4. Start fresh
npx react-native start --reset-cache
# In new terminal:
npx react-native run-android
```

## Expected Build Output

When successful, you should see:

```
> Task :react-native-maps:compileDebugJavaWithJavac
> Task :react-native-maps:bundleDebugAar
...
BUILD SUCCESSFUL in 8m 32s
```

And in the app, you should NOT see the modal error about maps.

## Testing Maps Work

After successful build, test with this code:

```typescript
import MapView from 'react-native-maps';

<MapView
  style={{ width: '100%', height: 300 }}
  initialRegion={{
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
/>
```

If you see a map, it works! 🎉

## Need Help?

If the issue persists after trying all steps:

1. Check Android Studio for build errors:
   - Open `apps/mobile/android` in Android Studio
   - Build → Rebuild Project
   - Check Build Output for detailed errors

2. Verify React Native version compatibility:
   - React Native 0.73.2 ✅
   - react-native-maps 1.27.2 ✅
   - These versions are compatible

3. Check system requirements:
   - JDK 17 or higher
   - Android SDK 33 or higher
   - Gradle 8.x
   - Node.js 18 or higher

## Additional Resources

- [React Native Maps Docs](https://github.com/react-native-maps/react-native-maps)
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Gradle Build Issues](https://developer.android.com/studio/build/dependencies)
