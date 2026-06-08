# Navigation Fix - NewChat Screen

## Problem
The app was crashing with error:
```
The action 'NAVIGATE' with payload {"name":"NewChat"} was not handled
```

This happened because:
- `ChatListScreen` was calling `navigation.navigate('NewChat')` 
- `NewChatScreen.tsx` existed but was NOT registered in any navigator
- React Navigation couldn't find the route

## Files Modified

### 1. `apps/mobile/src/navigation/MainStack.tsx`

**Added import:**
```typescript
import { NewChatScreen } from '../screens/chat/NewChatScreen';
```

**Registered screen in FeedStack:**
```typescript
<FeedStack.Screen name="NewChat" component={NewChatScreen} />
```

Also reordered screens for better logical grouping:
- ChatList → ChatRoom → NewChat are now together

### 2. `apps/mobile/src/screens/chat/NewChatScreen.tsx`

**Fixed navigation parameters** to match ChatRoomScreen expectations:

**Before:**
```typescript
navigation.navigate('ChatRoom', {
  recipientId: user._id,
  recipientName: user.username,
  recipientAvatar: user.avatar,
  isOnline: false,
});
```

**After:**
```typescript
// First create/get chat
const response = await api.post('/chats', { userId: user._id });
const chat = response.data.data;

// Then navigate with correct params
navigation.navigate('ChatRoom', {
  chatId: chat._id,
  otherUser: {
    _id: user._id,
    username: user.username,
    name: user.name || user.username,
    avatar: user.avatar,
  },
});
```

## Why This Fix Works

1. **Screen Registration**: NewChat is now properly registered in the FeedStack navigator, so React Navigation knows about it

2. **Parameter Consistency**: NewChatScreen now:
   - Creates/gets a chat via API first (required to get chatId)
   - Passes the same `otherUser` object structure that ChatRoomScreen expects
   - Matches the parameters used by ChatListScreen

3. **Chat Creation Flow**: 
   - User searches for someone
   - Selects a user
   - API call creates or retrieves existing chat
   - Navigates to ChatRoom with proper chatId and user info

## Testing

After this fix, you can:
- ✅ Click the "+" button in ChatListScreen
- ✅ Search for users
- ✅ Select a user to start a chat
- ✅ Navigate to ChatRoom without errors
- ✅ Create new chats or open existing ones

## Related Screens

The chat flow now works as:
1. **ChatListScreen** - Shows all chats, has "New Chat" button
2. **NewChatScreen** - Search users, select one to chat with
3. **ChatRoomScreen** - Actual chat conversation

All three screens are now properly registered and pass consistent parameters.
