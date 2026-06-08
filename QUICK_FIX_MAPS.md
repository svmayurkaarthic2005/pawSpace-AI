# 🚀 QUICK FIX - React Native Maps Error

## The Error You're Seeing

```
Failed to load expo-native-modules-autolinking npm package.
RNMapsAirModule could not be found
FBReactModule interop: Failed...
```

## ⚡ Fastest Fix (3 Commands)

Open PowerShell in the project root and run:

```powershell
# 1. Stop Metro bundler (if running)
taskkill /F /IM node.exe

# 2. Clean Android
cd apps/mobile/android
./gradlew.bat clean
cd ..

# 3. Rebuild with cache reset
npx react-native start --reset-cache
```

**Keep the Metro terminal open**, then in a NEW terminal:

```powershell
cd apps/mobile
npx react-native run-android
```

Wait 5-10 minutes for the rebuild to complete.

## 🎯 Automated Fix (Even Easier!)

Double-click this file:
```
apps/mobile/FIX_MAPS.bat
```

Or run from PowerShell:
```powershell
cd apps/mobile
./scripts/fix-maps-android.ps1
```

Then follow the on-screen instructions.

## ✅ How to Know It Worked

After the rebuild:
1. App starts without the red error modal
2. You can navigate to the Map/Events tab
3. Map displays correctly (not blank)

## ❌ If It Still Doesn't Work

Try the nuclear option:

```powershell
cd apps/mobile

# Delete all build artifacts
Remove-Item -Recurse -Force android/app/build
Remove-Item -Recurse -Force android/build  
Remove-Item -Recurse -Force android/.gradle

# Clean and rebuild
cd android
./gradlew.bat clean
cd ..

# Fresh start
npx react-native start --reset-cache
# In new terminal:
npx react-native run-android
```

## 📖 Need More Details?

See full documentation:
- `REACT_NATIVE_MAPS_FIX.md` - Complete troubleshooting guide
- `scripts/fix-maps-android.ps1` - Automated fix script

## 🔑 Key Points

1. **Always clean before rebuilding** - `gradlew.bat clean`
2. **Always reset Metro cache** - `--reset-cache` flag
3. **Wait for full rebuild** - First build after clean takes 5-10 min
4. **Don't use hot reload** - Need full native rebuild
5. **Google Maps API key is already configured** - No need to change it

## ⚠️ Common Mistakes

- ❌ Using hot reload after adding native module
- ❌ Not waiting for full rebuild to complete
- ❌ Not resetting Metro cache
- ❌ Trying to fix in Expo Go (won't work, need dev build)

## 🎓 Why This Happens

React Native Maps has both:
- JavaScript code (installed ✅)
- Native Android code (needs compilation ❌)

The error means the native code wasn't compiled into your APK. This happens when:
1. Maps was added after app was already built
2. Gradle cached old build without maps
3. Metro bundled old JavaScript

Solution = Clean everything + Full rebuild

## ✨ After It Works

The map should display on:
- Events tab (MapDiscoveryScreen)
- When viewing event locations
- Any MapView component in the app

Happy mapping! 🗺️
