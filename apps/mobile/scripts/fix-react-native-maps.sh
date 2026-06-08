#!/bin/bash
# ============================================================================
# React Native Maps Fix Script for macOS/Linux
# Fixes RNMapsAirModule native linking issue
# ============================================================================

set -e

echo "========================================"
echo "React Native Maps Native Fix"
echo "========================================"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Step 1: Stop Metro
echo "[1/10] Stopping Metro Bundler..."
pkill -f "react-native.*start" || true
echo "✓ Metro stopped"
sleep 2

# Step 2: Clean Android build caches
echo ""
echo "[2/10] Cleaning Android build caches..."
cd android
./gradlew clean
echo "✓ Gradle clean completed"

# Clean additional Android caches
rm -rf .gradle
rm -rf app/build
rm -rf build
echo "✓ Android caches removed"

cd "$PROJECT_ROOT"

# Step 3: Clean node_modules
echo ""
echo "[3/10] Cleaning node_modules..."
rm -rf node_modules
echo "✓ node_modules removed"

# Step 4: Clean npm cache
echo ""
echo "[4/10] Cleaning npm cache..."
npm cache clean --force
echo "✓ npm cache cleaned"

# Step 5: Install compatible react-native-maps version
echo ""
echo "[5/10] Installing compatible react-native-maps..."
echo "Installing react-native-maps@1.18.0 (tested for RN 0.73)"
npm install react-native-maps@1.18.0 --save-exact
echo "✓ react-native-maps installed"

# Step 6: Install all dependencies
echo ""
echo "[6/10] Installing all dependencies..."
npm install
echo "✓ Dependencies installed"

# Step 7: Verify react-native-maps exists
echo ""
echo "[7/10] Verifying react-native-maps installation..."
if [ -d "node_modules/react-native-maps" ]; then
    echo "✓ react-native-maps found in node_modules"
else
    echo "✗ react-native-maps NOT found!"
    exit 1
fi

# Step 8: Verify newArchEnabled is false
echo ""
echo "[8/10] Verifying New Architecture is disabled..."
if grep -q "newArchEnabled=false" android/gradle.properties; then
    echo "✓ newArchEnabled=false confirmed"
else
    echo "⚠ Setting newArchEnabled=false..."
    sed -i.bak 's/newArchEnabled=true/newArchEnabled=false/' android/gradle.properties
    echo "✓ newArchEnabled set to false"
fi

# Step 9: Clean Metro bundler cache
echo ""
echo "[9/10] Cleaning Metro bundler cache..."
rm -rf $TMPDIR/metro-* || true
rm -rf $TMPDIR/react-* || true
echo "✓ Metro cache cleaned"

# Step 10: Instructions for rebuild
echo ""
echo "[10/10] Setup Complete!"
echo ""
echo "========================================"
echo "NEXT STEPS - READ CAREFULLY"
echo "========================================"
echo ""
echo "1. REBUILD the Android app (DO NOT just reload):"
echo "   npx react-native run-android"
echo ""
echo "2. If you see 'RNMapsAirModule' error STILL:"
echo "   a. Uninstall the app from emulator completely"
echo "   b. Run: adb uninstall com.mayur.pawspace"
echo "   c. Rebuild: npx react-native run-android"
echo ""
echo "3. For emulator location timeout:"
echo "   a. Open emulator Extended Controls (...)"
echo "   b. Go to Location tab"
echo "   c. Set location manually (e.g., 13.0827, 80.2707)"
echo "   d. Click 'Send Location'"
echo ""
echo "========================================"
echo ""
