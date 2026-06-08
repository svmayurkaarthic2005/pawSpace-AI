# React Native Monorepo Autolinking Fix

## The Real Problem

```
⚠️  WARNING: react-native-maps NOT found in autolinking
```

This is **NOT** a version issue or New Architecture conflict. This is a **monorepo autolinking failure**.

## Why Autolinking Fails in Monorepos

### Standard React Native Project Structure
```
my-app/
├── node_modules/
│   └── react-native-maps/
├── android/
├── ios/
└── package.json
```

In standard projects, React Native CLI easily finds native modules in `../node_modules/`.

### Monorepo Structure (Your Setup)
```
myapp/
├── apps/
│   ├── mobile/              ← Your RN app is here
│   │   ├── android/
│   │   ├── ios/
│   │   ├── node_modules/    ← Modules installed here
│   │   └── package.json
│   └── backend/
├── node_modules/            ← Or modules might be hoisted here
└── package.json
```

In monorepos, the React Native CLI's autolinking logic can't reliably discover where `node_modules` is located, causing it to miss native modules completely.

## The Solution: `react-native.config.js`

This configuration file explicitly tells React Native CLI where to find native modules.

## Quick Fix

### Option 1: Automated (Recommended)

Run the monorepo fix script:

```powershell
cd apps/mobile
.\scripts\fix-android-maps-monorepo.ps1
```

This will:
1. ✅ Create `react-native.config.js` with proper paths
2. ✅ Clean all caches
3. ✅ Reinstall dependencies
4. ✅ Verify autolinking
5. ✅ Clean Android build

### Option 2: Manual Steps

#### 1. Create `apps/mobile/react-native.config.js`

```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  dependencies: {
    'react-native-maps': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-maps/lib/android',
          packageImportPath: 'import com.rnmaps.maps.MapsPackage;',
        },
        ios: {
          project: '../node_modules/react-native-maps/lib/ios/AirMaps.xcodeproj',
        },
      },
    },
  },
  assets: ['./src/assets/fonts/'],
};
```

#### 2. Clean Everything

```powershell
Remove-Item -Recurse -Force node_modules, android/.gradle, android/app/build, package-lock.json
```

#### 3. Reinstall

```bash
npm install --legacy-peer-deps
```

#### 4. Verify Autolinking

```bash
npx react-native config
```

**Expected output should include:**
```
react-native-maps:
  android: node_modules/react-native-maps/lib/android
  ios: node_modules/react-native-maps/lib/ios
```

If you see this, autolinking is **working**! ✅

If you **don't** see `react-native-maps`, autolinking is still **broken** and you need manual linking.

#### 5. Clean Android

```bash
cd android
.\gradlew.bat clean
cd ..
```

#### 6. Rebuild

Terminal 1:
```bash
npm run start:reset
```

Terminal 2:
```bash
npm run android
```

## If Autolinking Still Fails

Even with `react-native.config.js`, some monorepo setups need full manual linking.

### Manual Linking (Last Resort)

Run the manual linking script:

```powershell
.\scripts\fix-android-maps-manual-linking.ps1
```

Or do it manually:

#### 1. Edit `android/settings.gradle`

Add at the end:

```gradle
// Manual linking for react-native-maps
include ':react-native-maps'
project(':react-native-maps').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-maps/lib/android')
```

#### 2. Edit `android/app/build.gradle`

In the `dependencies` block, add:

```gradle
dependencies {
    implementation project(':react-native-maps')  // Add this line
    
    // ... rest of dependencies
}
```

#### 3. Edit `android/app/src/main/java/com/pawspace/MainApplication.kt`

Add import:

```kotlin
import com.rnmaps.maps.MapsPackage
```

Add to packages:

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(MapsPackage())  // Add this line
    }
```

#### 4. Clean and Rebuild

```bash
cd android
.\gradlew.bat clean
cd ..
npm run start:reset
npm run android
```

## Why This Happens in Monorepos

### Root Cause 1: Hoisted Dependencies

Some monorepo tools (Yarn Workspaces, npm workspaces, Lerna) hoist `node_modules` to the root:

```
myapp/
├── node_modules/           ← Dependencies hoisted here
│   └── react-native-maps/
└── apps/
    └── mobile/
        ├── node_modules/   ← Empty or partial
        └── android/        ← Looks in ../node_modules
```

React Native CLI looks in `../node_modules`, but in monorepos this might be `../../node_modules`.

### Root Cause 2: Different Node Resolution

Node.js module resolution walks up the directory tree, but React Native's native module discovery doesn't follow the same algorithm.

### Root Cause 3: Metro Bundler vs Native Build

- **Metro bundler** (JavaScript): Finds modules correctly using Node resolution
- **Gradle/Xcode** (Native): Relies on React Native CLI autolinking, which has a fixed path

This is why JavaScript imports work (`import MapView from 'react-native-maps'`) but native modules fail at runtime.

## Verification

After applying the fix:

### 1. Verify Autolinking
```bash
npx react-native config
```

Should show `react-native-maps` with paths.

### 2. Check Gradle Sync

Open Android Studio:
```bash
cd android
start android/build.gradle
```

Gradle should sync without errors. Check for:
- `:react-native-maps` project detected
- No "Could not find" errors

### 3. Check App Launch

Run the app and check logs:
```bash
npm run android
```

No `RNMapsAirModule` errors should appear.

### 4. Test Map Rendering

Navigate to a screen with `<MapView>`. Should render without crashes.

## Common Pitfalls

### ❌ Wrong: Installing in Root

```bash
# Don't do this in monorepo root
cd myapp/
npm install react-native-maps  # Wrong location!
```

### ✅ Right: Installing in Mobile App

```bash
cd apps/mobile/
npm install react-native-maps  # Correct location
```

### ❌ Wrong: Relative Paths

```javascript
// In react-native.config.js
sourceDir: './node_modules/react-native-maps/lib/android'  // Wrong - relative to CWD
```

### ✅ Right: Parent Directory

```javascript
sourceDir: '../node_modules/react-native-maps/lib/android'  // Correct - from android/ to node_modules
```

## Related Issues

This same issue affects other React Native libraries with native code:

- `react-native-maps`
- `react-native-vector-icons`
- `react-native-firebase`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-screens`

All may need entries in `react-native.config.js` for monorepo setups.

## Prevention

### For New Packages

When installing ANY React Native package with native code in a monorepo:

1. Install the package
2. Add to `react-native.config.js` if needed
3. Run `npx react-native config` to verify
4. Clean and rebuild native apps

### For Monorepo Setup

Consider using:
- React Native CLI workspaces support (if available)
- Explicit `react-native.config.js` from the start
- Documentation of required config for each native module

## Further Reading

- [React Native CLI Configuration](https://github.com/react-native-community/cli/blob/master/docs/configuration.md)
- [Autolinking in Monorepos](https://github.com/react-native-community/cli/issues/1238)
- [react-native-maps Setup](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md)

## Troubleshooting

### Still seeing "Module not found"

1. Delete `node_modules` completely
2. Clear npm cache: `npm cache clean --force`
3. Reinstall: `npm install --legacy-peer-deps`
4. Verify package exists: `ls node_modules/react-native-maps`

### Gradle sync fails

1. Check `settings.gradle` has correct path
2. Verify module exists at that path
3. Try opening `android/` in Android Studio for better error messages

### Maps render but markers don't work

This is a different issue - check:
- Google Maps API key
- API enabled in Google Cloud Console
- Billing enabled

### iOS builds but Android doesn't

iOS and Android have different linking mechanisms:
- iOS: Uses Podfile and CocoaPods
- Android: Uses Gradle and settings.gradle

Both need proper configuration in monorepos.
