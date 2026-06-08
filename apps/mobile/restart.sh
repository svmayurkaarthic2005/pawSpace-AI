#!/bin/bash

echo "🔄 Restarting React Native app with clean cache..."

# Clear Metro cache
echo "📦 Clearing Metro cache..."
rm -rf node_modules/.cache

# Clear watchman (if available)
if command -v watchman &> /dev/null; then
    echo "👀 Clearing Watchman..."
    watchman watch-del-all
fi

# Clean Android build
echo "🤖 Cleaning Android build..."
cd android
./gradlew clean
cd ..

# Start Metro with reset cache
echo "🚀 Starting Metro bundler with reset cache..."
echo "   After Metro starts, open a NEW terminal and run: npm run android"
npx react-native start --reset-cache
