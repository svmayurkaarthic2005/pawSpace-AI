#!/bin/bash

# Script to fix react-native-maps native module issues
# Run this from apps/mobile directory

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Fixing React Native Maps Module                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from apps/mobile directory"
    echo "   cd apps/mobile && bash scripts/fix-maps.sh"
    exit 1
fi

# Step 1: Clean Android build
echo "📦 Step 1: Cleaning Android build..."
cd android
if [ -f "gradlew" ]; then
    chmod +x gradlew
    ./gradlew clean
    ./gradlew cleanBuildCache
    echo "✅ Android build cleaned"
else
    echo "⚠️  Warning: gradlew not found, skipping gradle clean"
fi
cd ..

# Step 2: Remove build artifacts
echo ""
echo "🗑️  Step 2: Removing build artifacts..."
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/.idea
echo "✅ Build artifacts removed"

# Step 3: Clear Metro cache
echo ""
echo "🧹 Step 3: Clearing Metro bundler cache..."
rm -rf node_modules/.cache
echo "✅ Metro cache cleared"

# Step 4: Reinstall node_modules (optional)
echo ""
read -p "Do you want to reinstall node_modules? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📥 Reinstalling node_modules..."
    rm -rf node_modules
    npm install
    echo "✅ node_modules reinstalled"
fi

# Step 5: Instructions for next steps
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Next Steps                                                    ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  1. Start Metro bundler with reset cache:                     ║"
echo "║     npm run start:reset                                       ║"
echo "║                                                                ║"
echo "║  2. In a NEW terminal, rebuild the app:                       ║"
echo "║     npm run android                                           ║"
echo "║                                                                ║"
echo "║  3. If still not working, check that Google Maps API key      ║"
echo "║     is set in android/app/src/main/AndroidManifest.xml        ║"
echo "║                                                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "✨ Cleanup complete!"
