#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  SETTING UP VOICE INPUT FOR PAWSPACE                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")/.." || exit 1

echo "[1/3] Installing @react-native-voice/voice package..."
npm install @react-native-voice/voice

if [ $? -eq 0 ]; then
    echo "✓ Voice package installed successfully"
else
    echo "✗ Failed to install voice package"
    exit 1
fi

echo ""
echo "[2/3] Checking Android permissions..."

MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

if grep -q "RECORD_AUDIO" "$MANIFEST_FILE"; then
    echo "✓ RECORD_AUDIO permission already added"
else
    echo "⚠ RECORD_AUDIO permission missing - please add manually"
    echo "  Add this line to AndroidManifest.xml:"
    echo "  <uses-permission android:name=\"android.permission.RECORD_AUDIO\" />"
fi

echo ""
echo "[3/3] Setup complete!"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  NEXT STEPS                                                    ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  1. Rebuild the app:                                          ║"
echo "║     npx react-native run-android                              ║"
echo "║                                                                ║"
echo "║  2. Test voice input:                                         ║"
echo "║     - Go to Discover tab                                      ║"
echo "║     - Tap microphone icon                                     ║"
echo "║     - Speak your search query                                 ║"
echo "║                                                                ║"
echo "║  3. Grant microphone permission when prompted                 ║"
echo "║                                                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Make the script executable
chmod +x "$0"
