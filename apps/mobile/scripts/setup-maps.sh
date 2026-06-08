#!/bin/bash

# Map Discovery Setup Script for PawSpace
# This script helps set up Google Maps integration

set -e

echo "🗺️  PawSpace Map Discovery Setup"
echo "=================================="
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from apps/mobile directory"
    exit 1
fi

echo "✅ Running from correct directory"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Add your Google Maps API key to .env:"
    echo "   GOOGLE_MAPS_API_KEY=your_api_key_here"
    echo ""
else
    echo "✅ .env file exists"
    
    # Check if GOOGLE_MAPS_API_KEY is set
    if grep -q "GOOGLE_MAPS_API_KEY=" .env; then
        KEY=$(grep "GOOGLE_MAPS_API_KEY=" .env | cut -d '=' -f2)
        if [ -z "$KEY" ] || [ "$KEY" = "your_google_maps_api_key_here" ]; then
            echo "⚠️  GOOGLE_MAPS_API_KEY not set in .env"
            echo "   Please add your API key: GOOGLE_MAPS_API_KEY=your_api_key_here"
        else
            echo "✅ GOOGLE_MAPS_API_KEY is configured"
        fi
    else
        echo "⚠️  GOOGLE_MAPS_API_KEY not found in .env"
        echo "   Please add: GOOGLE_MAPS_API_KEY=your_api_key_here"
    fi
fi
echo ""

# Check dependencies
echo "📦 Checking dependencies..."

DEPS=(
    "react-native-maps"
    "@gorhom/bottom-sheet"
    "@react-native-community/slider"
    "react-native-permissions"
    "react-native-haptic-feedback"
    "react-native-map-clustering"
    "@react-native-community/geolocation"
)

MISSING_DEPS=()

for DEP in "${DEPS[@]}"; do
    if grep -q "\"$DEP\"" package.json; then
        echo "  ✅ $DEP"
    else
        echo "  ❌ $DEP (missing)"
        MISSING_DEPS+=("$DEP")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Some dependencies are missing. Install with:"
    echo "   npm install --legacy-peer-deps ${MISSING_DEPS[@]}"
    exit 1
fi

echo ""
echo "✅ All dependencies installed"
echo ""

# iOS Setup
echo "🍎 iOS Setup"
echo "------------"

if [ -d "ios" ]; then
    echo "  ✅ iOS folder exists"
    
    # Check Podfile
    if [ -f "ios/Podfile" ]; then
        if grep -q "react-native-google-maps" ios/Podfile; then
            echo "  ✅ Podfile has react-native-google-maps"
        else
            echo "  ⚠️  Podfile missing react-native-google-maps"
            echo "     Add: pod 'react-native-google-maps', :path => rn_maps_path"
        fi
    fi
    
    # Check Info.plist
    if [ -f "ios/myapp/Info.plist" ]; then
        if grep -q "NSLocationWhenInUseUsageDescription" ios/myapp/Info.plist; then
            echo "  ✅ Info.plist has location permissions"
        else
            echo "  ⚠️  Info.plist missing location permissions"
        fi
    fi
    
    echo ""
    echo "  Run: cd ios && pod install"
else
    echo "  ⚠️  iOS folder not found"
fi

echo ""

# Android Setup
echo "🤖 Android Setup"
echo "----------------"

if [ -d "android" ]; then
    echo "  ✅ Android folder exists"
    
    # Check build.gradle
    if [ -f "android/app/build.gradle" ]; then
        if grep -q "GOOGLE_MAPS_API_KEY" android/app/build.gradle; then
            echo "  ✅ build.gradle has GOOGLE_MAPS_API_KEY placeholder"
        else
            echo "  ⚠️  build.gradle missing GOOGLE_MAPS_API_KEY"
        fi
    fi
    
    # Check AndroidManifest.xml
    if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
        if grep -q "com.google.android.geo.API_KEY" android/app/src/main/AndroidManifest.xml; then
            echo "  ✅ AndroidManifest.xml has Google Maps API key"
        else
            echo "  ⚠️  AndroidManifest.xml missing Google Maps API key meta-data"
        fi
        
        if grep -q "ACCESS_FINE_LOCATION" android/app/src/main/AndroidManifest.xml; then
            echo "  ✅ AndroidManifest.xml has location permissions"
        else
            echo "  ⚠️  AndroidManifest.xml missing location permissions"
        fi
    fi
else
    echo "  ⚠️  Android folder not found"
fi

echo ""
echo "=================================="
echo "✅ Setup check complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Add Google Maps API key to .env"
echo "   2. iOS: cd ios && pod install"
echo "   3. Run: npx react-native run-android or run-ios"
echo ""
echo "📚 Documentation: MAP_DISCOVERY_SETUP.md"
echo ""
