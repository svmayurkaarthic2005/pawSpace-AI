#!/bin/bash
# PawSpace - Clean Up Node 24 Corruption
# Run this AFTER installing Node 20 LTS

echo "========================================"
echo "PawSpace - Node 24 Cleanup Script"
echo "========================================"
echo ""

# Check Node version
NODE_VERSION=$(node -v)
echo "Current Node version: $NODE_VERSION"

if [[ $NODE_VERSION == v24.* ]]; then
    echo "❌ ERROR: You're still using Node 24!"
    echo "Please install Node 20 LTS first:"
    echo "  https://nodejs.org/"
    echo "  Download 'LTS' version (Node 20)"
    exit 1
fi

if [[ $NODE_VERSION == v20.* ]]; then
    echo "✅ Node 20 detected - proceeding with cleanup"
else
    echo "⚠️  Warning: Node version is $NODE_VERSION (expected v20.x.x)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo ""
echo "Cleaning corrupted files..."
echo ""

# Clean node_modules
echo "Deleting node_modules..."
rm -rf node_modules
echo "✅ node_modules deleted"

# Clean package-lock
echo "Deleting package-lock.json..."
rm -f package-lock.json
echo "✅ package-lock.json deleted"

# Clean Android builds
echo "Deleting Android build artifacts..."
rm -rf android/.gradle
rm -rf android/build
rm -rf android/app/build
echo "✅ Android builds deleted"

# Clean Metro cache
echo "Deleting Metro cache..."
rm -rf .metro
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
echo "✅ Metro cache deleted"

echo ""
echo "========================================"
echo "Cleanup Complete! ✅"
echo "========================================"
echo ""

echo "Next steps:"
echo "1. npm install"
echo "2. npm install @shopify/flash-list@1.6.3 --legacy-peer-deps"
echo "3. npx react-native start --reset-cache"
echo "4. (new terminal) npx react-native run-android"
echo ""
read -p "Run these commands now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Installing packages..."
    npm install
    
    echo ""
    echo "Installing FlashList v1.6.3..."
    npm install @shopify/flash-list@1.6.3 --legacy-peer-deps
    
    echo ""
    echo "========================================"
    echo "Setup Complete! ✅"
    echo "========================================"
    echo ""
    echo "Now run in Terminal 1:"
    echo "  npx react-native start --reset-cache"
    echo ""
    echo "Then in Terminal 2:"
    echo "  cd android"
    echo "  ./gradlew clean"
    echo "  cd .."
    echo "  npx react-native run-android"
else
    echo ""
    echo "Manual steps - run these commands:"
    echo "  npm install"
    echo "  npm install @shopify/flash-list@1.6.3 --legacy-peer-deps"
    echo "  npx react-native start --reset-cache"
    echo "  (new terminal) npx react-native run-android"
fi

echo ""
