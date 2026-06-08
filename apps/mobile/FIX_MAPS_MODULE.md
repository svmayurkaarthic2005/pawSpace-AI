# Fix RNMapsAirModule Error

The error `RNMapsAirModule could not be found` means the native module for react-native-maps isn't properly linked. Follow these steps:

## Solution 1: Clean and Rebuild (Recommended)

### For Android:

```bash
cd apps/mobile

# 1. Stop Metro bundler (Ctrl+C if running)

# 2. Clean Android build
cd android
./gradlew clean
cd ..

# 3. Clear Metro cache
npx react-native start --reset-cache
```

**In a new terminal:**

```bash
cd apps/mobile

# 4. Rebuild and run the app
npx react-native run-android
```

## Solution 2: Complete Clean (If Solution 1 doesn't work)

```bash
cd apps/mobile

# 1. Remove node_modules and reinstall
rm -rf node_modules
npm install

# 2. Clean Android
cd android
./gradlew clean
./gradlew cleanBuildCache
cd ..

# 3. Clear all caches
rm -rf android/app/build
rm -rf android/.gradle
npx react-native start --reset-cache
```

**In a new terminal:**

```bash
cd apps/mobile
npx react-native run-android
```

## Solution 3: Manual Linking Check (Last Resort)

If the above doesn't work, check that react-native-maps is properly installed:

```bash
cd apps/mobile

# Verify the package is installed
npm list react-native-maps

# If not found, reinstall it
npm install react-native-maps@1.27.2

# Then follow Solution 1 steps again
```

## Verify the Fix

After rebuilding, you should see the app start without the `RNMapsAirModule` error. The module should appear in the "Modules loaded" list instead of "NotFound".

## Note

The error happens because:
1. Native modules weren't properly linked during the initial build
2. The native code needs to be recompiled to include the maps module
3. Metro bundler had cached the old module state

The clean build forces Android to recompile with the correct native modules.
