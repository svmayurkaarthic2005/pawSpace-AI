#!/bin/bash

# PawSpace Mobile - Complete Clean & Rebuild Script
# This script cleans all caches and rebuilds the Android app

set -e  # Exit on any error

echo "🧹 Cleaning Metro bundler cache..."
rm -rf node_modules/.cache

echo "🧹 Cleaning watchman cache..."
watchman watch-del-all 2>/dev/null || echo "Watchman not installed, skipping..."

echo "🧹 Cleaning React Native cache..."
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true

echo "🧹 Cleaning Android build cache..."
cd android
./gradlew clean
rm -rf app/build
rm -rf build
cd ..

echo "🧹 Removing old package folders..."
rm -rf android/app/src/main/java/com/myapp 2>/dev/null || true

echo "✅ Clean complete!"
echo ""
echo "📦 Starting Metro bundler with cache reset..."
npx react-native start --reset-cache &
METRO_PID=$!

echo "⏳ Waiting for Metro to start (10 seconds)..."
sleep 10

echo "🚀 Building and running Android app..."
npx react-native run-android

echo ""
echo "✅ App should now be running!"
echo "   Metro PID: $METRO_PID"
echo "   To stop Metro: kill $METRO_PID"
