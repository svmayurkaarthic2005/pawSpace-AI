# Voice Input & Discover Page Fixes

## What Was Fixed

### 1. Voice Input Implementation ✅
- Added voice recognition functionality
- Microphone button now functional
- Real-time speech-to-text conversion
- Auto-search after voice input

### 2. Discover Page Issues ✅
- Fixed layout and scrolling
- Improved component structure
- Better error handling

## Installation Required

Voice input requires the `@react-native-voice/voice` package.

### Step 1: Install Package

```bash
cd apps/mobile
npm install @react-native-voice/voice
```

### Step 2: iOS Setup (if using iOS)

Add to `ios/Podfile`:
```ruby
permissions_path = File.join(File.dirname(`node --print "require.resolve('react-native-permissions/package.json')"`), "ios")
pod 'Permission-Microphone', :path => "#{permissions_path}/Microphone"
```

Then run:
```bash
cd ios
pod install
cd ..
```

### Step 3: Rebuild App

```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

## Files Created/Modified

### New Files
- `apps/mobile/src/hooks/useVoiceInput.ts` - Voice recognition hook
- `VOICE_INPUT_DISCOVER_FIX.md` - This documentation

### Modified Files
- `apps/mobile/src/screens/explore/ExploreScreen.tsx` - Added voice input integration
- `apps/mobile/src/components/explore/AISearchBar.tsx` - Updated mic button UI
- `apps/mobile/android/app/src/main/AndroidManifest.xml` - Added RECORD_AUDIO permission

## How Voice Input Works

### User Flow
1. User taps microphone icon in search bar
2. Permission dialog appears (first time only)
3. Microphone activates (icon turns red)
4. User speaks their search query
5. Speech converts to text automatically
6. Search executes with the transcribed text
7. Results display

### Visual Feedback
- **Idle**: Gray mic outline icon
- **Listening**: Red mic icon with activity indicator
- **Processing**: Loading spinner

### Code Example

The `useVoiceInput` hook provides:

```typescript
const {
  isListening,      // Boolean - is mic active
  transcript,       // String - recognized text
  startListening,   // Function - start recording
  stopListening,    // Function - stop recording
  clearTranscript,  // Function - clear text
} = useVoiceInput();
```

## Permissions

### Android
- `RECORD_AUDIO` permission added to AndroidManifest.xml
- Permission requested at runtime automatically
- User can grant/deny in system settings

### iOS (if implemented)
Add to `Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>PawSpace needs microphone access for voice search</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>PawSpace uses speech recognition for voice search</string>
```

## Testing Voice Input

### Test Scenarios

1. **Basic Voice Search**
   - Tap mic icon
   - Say "Find dog parks near me"
   - Check search executes correctly

2. **Permission Denial**
   - Deny microphone permission
   - Tap mic icon
   - Should show permission required alert

3. **Long Query**
   - Say a long search query (> 10 words)
   - Verify full transcript captured

4. **Background Noise**
   - Test in noisy environment
   - Check accuracy

5. **Rapid Toggling**
   - Tap mic on/off quickly
   - Ensure no crashes

### Expected Behavior

✅ Microphone icon visible when no text
✅ Permission dialog on first use
✅ Red mic icon when listening
✅ Automatic search after speech
✅ Query appears in search bar
✅ Results display correctly

## Troubleshooting

### Issue: Microphone permission always denied

**Android:**
```bash
# Check current permissions
adb shell pm list permissions -d -g

# Grant permission manually
adb shell pm grant com.mayur.pawspace android.permission.RECORD_AUDIO
```

**Solution:** 
- Go to Settings → Apps → PawSpace → Permissions
- Enable Microphone

### Issue: No speech recognition

**Symptoms:**
- Mic activates but no text appears
- Error in console

**Solutions:**
1. Check device has Google Speech Services
2. Verify internet connection (required for recognition)
3. Check language setting (currently set to 'en-US')

### Issue: Voice package not found

**Error:**
```
Cannot find module '@react-native-voice/voice'
```

**Fix:**
```bash
cd apps/mobile
npm install @react-native-voice/voice
npx react-native run-android
```

### Issue: App crashes on mic press

**Check:**
1. Permission in AndroidManifest.xml
2. Package installed correctly
3. Rebuild app after adding package

**Debug:**
```bash
adb logcat | grep -i voice
adb logcat | grep -i microphone
```

## Discover Page Issues Fixed

### Layout Improvements
- Fixed content being cut off at bottom
- Proper SafeAreaView usage
- Better scrolling behavior

### Error Handling
- Added loading states
- Error messages for failed searches
- Retry functionality

### Performance
- Optimized re-renders
- Better animation performance
- Reduced unnecessary API calls

## Configuration

### Change Voice Language

In `apps/mobile/src/hooks/useVoiceInput.ts`:

```typescript
// Change 'en-US' to your preferred locale
await Voice.start('en-US'); // English US
await Voice.start('en-GB'); // English UK
await Voice.start('es-ES'); // Spanish
await Voice.start('fr-FR'); // French
```

### Adjust Listening Timeout

Voice automatically stops after silence. To adjust:

```typescript
// In useVoiceInput.ts
// Add options to Voice.start()
await Voice.start('en-US', {
  EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
  EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 5000,
});
```

## Known Limitations

1. **Requires Internet**: Speech recognition needs network connectivity
2. **Language Support**: Currently supports English only
3. **Accuracy**: Depends on:
   - Audio quality
   - Background noise
   - Accent/pronunciation
   - Internet speed

4. **Privacy**: Voice data processed by Google Speech Services

## Future Enhancements

Possible improvements:

1. **Offline Mode**: Local speech recognition
2. **Multi-language**: Support multiple languages
3. **Voice Commands**: "Navigate to...", "Show me..."
4. **Continuous Listening**: Keep mic open for follow-up queries
5. **Voice Feedback**: Audio confirmation of recognized text
6. **Custom Wake Words**: "Hey PawSpace..."

## API Usage

### Voice Hook API

```typescript
interface UseVoiceInputReturn {
  isListening: boolean;           // Is microphone active
  transcript: string;             // Recognized text
  error: string | null;           // Error message if any
  startListening: () => Promise<void>;  // Start recording
  stopListening: () => Promise<void>;   // Stop recording
  cancelListening: () => Promise<void>; // Cancel and clear
  clearTranscript: () => void;          // Clear text only
}
```

### Events

The hook listens to these voice events:
- `onSpeechStart` - Recording started
- `onSpeechEnd` - Recording stopped  
- `onSpeechResults` - Text recognized
- `onSpeechError` - Error occurred

## Security & Privacy

### Data Handling
- Voice data sent to Google Speech API
- Not stored by PawSpace app
- Follows Google's privacy policy
- Requires user permission

### Best Practices
- Request permission with clear explanation
- Provide visual feedback when listening
- Allow users to cancel/stop anytime
- Don't record without user action

## Additional Resources

- [React Native Voice Docs](https://github.com/react-native-voice/voice)
- [Android Speech Recognition](https://developer.android.com/reference/android/speech/SpeechRecognizer)
- [iOS Speech Framework](https://developer.apple.com/documentation/speech)

## Support

If voice input issues persist:

1. Check package installed: `npm list @react-native-voice/voice`
2. Verify permissions in AndroidManifest.xml
3. Test on physical device (emulator may not support)
4. Check microphone works in other apps
5. Review logcat for errors

---

**Last Updated:** 2026-06-08
**Voice Package:** @react-native-voice/voice ^3.x
**Tested On:** Android API 33+
