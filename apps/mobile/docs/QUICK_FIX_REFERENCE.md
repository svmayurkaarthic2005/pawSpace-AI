# Quick Fix Reference

## Problem: RNMapsAirModule Not Found

### Diagnosis

Run this first:
```bash
npx react-native config
```

**If you DON'T see `react-native-maps` in the output** → Autolinking is broken (monorepo issue)

## Solutions (In Order)

### 1. Automated Monorepo Fix ⭐ (Try This First)

```powershell
cd apps/mobile
.\scripts\fix-android-maps-monorepo.ps1
```

**What it does:**
- Creates `react-native.config.js`
- Cleans caches
- Reinstalls dependencies
- Verifies autolinking

**Time:** 5-10 minutes

### 2. Manual Autolinking Fix

If script fails, do manually:

```bash
# Create react-native.config.js (see below)
# Clean
rm -rf node_modules android/.gradle android/app/build package-lock.json

# Reinstall
npm install --legacy-peer-deps

# Verify
npx react-native config  # Should show react-native-maps

# Rebuild
cd android
.\gradlew.bat clean
cd ..
npm run start:reset
npm run android
```

### 3. Full Manual Linking (Last Resort)

If autolinking still fails after config:

```powershell
.\scripts\fix-android-maps-manual-linking.ps1
```

**What it does:**
- Modifies `settings.gradle`
- Modifies `app/build.gradle`
- Modifies `MainApplication.kt`
- Full manual linking

**Time:** 2-3 minutes

## Required File: `react-native.config.js`

Create in `apps/mobile/`:

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

## Verification Checklist

After any fix:

- [ ] `npx react-native config` shows `react-native-maps`
- [ ] `npm run android` builds successfully
- [ ] App launches without crashes
- [ ] No "RNMapsAirModule" errors in logs
- [ ] Maps render on screen

## Quick Commands

```bash
# Verify autolinking
npx react-native config

# Check package installed
npm list react-native-maps

# Clean everything
rm -rf node_modules android/.gradle android/app/build

# Fresh install
npm install --legacy-peer-deps

# Clean Gradle
cd android && .\gradlew.bat clean && cd ..

# Start with cache reset
npm run start:reset

# Build Android
npm run android
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `react-native-maps NOT found in autolinking` | Monorepo structure | Create `react-native.config.js` |
| `RNMapsAirModule not found` | Native module not linked | Manual linking required |
| `Could not find :react-native-maps` | Gradle can't find module | Check `settings.gradle` path |
| `Package com.rnmaps.maps does not exist` | Import missing | Add import to `MainApplication.kt` |

## File Locations

All scripts are in `apps/mobile/scripts/`:

- `fix-android-maps-monorepo.ps1` - Main fix (autolinking)
- `fix-android-maps-manual-linking.ps1` - Manual linking
- `fix-android-maps.ps1` - Old version fix (less relevant)
- `fix-android-maps-manual.ps1` - Old manual fix

All docs are in `apps/mobile/docs/`:

- `MONOREPO_AUTOLINKING_FIX.md` - Detailed explanation
- `ANDROID_MAPS_FIX.md` - General maps issues
- `SOCKET_AUTH_FIX.md` - Socket authentication
- `QUICK_FIX_REFERENCE.md` - This file

## Decision Tree

```
Is react-native-maps in package.json?
├─ NO → npm install react-native-maps@1.14.0
└─ YES → Continue

Does `npx react-native config` show react-native-maps?
├─ NO → Autolinking broken (monorepo issue)
│        └─ Run: fix-android-maps-monorepo.ps1
│           └─ Still broken?
│              └─ Run: fix-android-maps-manual-linking.ps1
└─ YES → Autolinking working
         └─ Still getting errors?
            └─ Check API key, permissions, manifest
```

## Support

If none of these work:

1. Share output of `npx react-native config`
2. Share `android/settings.gradle` content
3. Share `android/app/build.gradle` content
4. Share full error logs from `npm run android`
5. Check if other native modules work (helps isolate issue)
