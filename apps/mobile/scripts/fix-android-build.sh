#!/bin/bash

echo "🔧 Fixing Android Build Issues..."
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")/.."

echo "📦 Step 1: Cleaning build artifacts..."
echo "  - Removing node_modules..."
rm -rf node_modules

echo "  - Cleaning Android build..."
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle

echo ""
echo "📦 Step 2: Reinstalling dependencies..."
npm install

echo ""
echo "🔗 Step 3: Relinking native modules..."
npx react-native-clean-project --remove-iOS-build --remove-iOS-pods

echo ""
echo "🏗️  Step 4: Cleaning Android gradle..."
cd android
./gradlew clean
cd ..

echo ""
echo "📱 Step 5: Rebuilding Android app..."
echo "  This may take a few minutes..."
npx react-native run-android --reset-cache

echo ""
echo "✅ Build process complete!"
echo ""
echo "If you still encounter issues:"
echo "  1. Close Metro bundler if running"
echo "  2. Uninstall app from device/emulator"
echo "  3. Run: npm start -- --reset-cache"
echo "  4. Run: npm run android"
