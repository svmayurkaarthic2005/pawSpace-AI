# Notification & Race Condition Fixes

## Issues Identified and Fixed

### 1. **Race Condition: Notification Count Initialization**
**Problem:** The mobile app fetched the unread count via REST API while the socket might emit `notification:count` independently, causing conflicts.

**Fix:**
- Updated `apps/mobile/src/navigation/index.tsx` to listen for `notification:count` from socket as the primary source
- Added REST API as a fallback with a 2-second timeout
- Socket events now have priority to avoid duplicate/conflicting updates

### 2. **Race Condition: Auto Mark-All-Read on Focus**
**Problem:** The `NotificationsScreen` automatically marked all notifications as read after 2 seconds, racing with manual mark operations and socket updates.

**Fix:**
- Removed the auto-mark-all behavior in `apps/mobile/src/screens/notifications/NotificationsScreen.tsx`
- Users must now explicitly use the "Mark All Read" button
- Eliminates unexpected count resets and improves user control

### 3. **Race Condition: Double-Decrement on Mark Read**
**Problem:** When marking a notification as read, both optimistic UI updates AND socket events updated the count, causing double decrements.

**Fix:**
- Removed `notificationStore.decrementUnreadCount()` from optimistic updates
- Backend now sends the authoritative count via `notification:count_update`
- Client trusts the backend count completely

### 4. **Race Condition: Socket Listeners Recreation**
**Problem:** Socket event listeners were recreated every time `activeTab` changed, potentially losing events or creating duplicate handlers.

**Fix:**
- Removed `activeTab` from socket useEffect dependencies
- Socket listeners now update ALL tabs (both 'all' and 'activity')
- Prevents notifications from disappearing when switching tabs

### 5. **Race Condition: Concurrent Notification Creation**
**Problem:** Multiple notifications created simultaneously could increment the Redis counter incorrectly due to read-modify-write races.

**Fix:**
- Implemented atomic `incrementUnreadCount()` in `apps/backend/src/services/cache.service.ts` using Redis INCR
- Implemented atomic `decrementUnreadCount()` with bounds checking
- Updated `apps/backend/src/services/notification.service.ts` to use atomic operations

### 6. **Missing Initial Count Socket Event**
**Problem:** Backend sent `notification:count` on connection but mobile app didn't listen for it.

**Fix:**
- Added `notification:count` listener in navigation initialization
- Added documentation comment in socket service

### 7. **Notification Count Going Negative**
**Problem:** Due to race conditions, the notification count could sometimes go negative.

**Fix:**
- Added defensive checks in `apps/mobile/src/store/notificationStore.ts`
- Added warning logs when negative counts are detected
- Backend `decrementUnreadCount()` now prevents negative values and auto-corrects to 0

### 8. **Missing Error Handling in Notification Tap**
**Problem:** API call failures when marking notifications as read weren't properly handled.

**Fix:**
- Removed direct API call from `handleNotificationTap`
- Now uses mutation which has proper error handling and rollback

### 9. **Empty Cache Handling**
**Problem:** Socket events could crash when trying to update query cache that didn't exist yet.

**Fix:**
- Added defensive checks in socket event handlers
- Initialize cache structure if it doesn't exist
- Prevents null pointer errors on first notification

## Backend Changes

### `apps/backend/src/services/notification.service.ts`
- ✅ Use atomic Redis increment for unread count
- ✅ Emit authoritative count with every notification
- ✅ Use atomic decrement when marking as read
- ✅ Ensure count never goes below zero

### `apps/backend/src/services/cache.service.ts`
- ✅ Added `incrementUnreadCount()` using Redis INCR
- ✅ Added `decrementUnreadCount()` with negative protection
- ✅ Added comprehensive documentation

## Frontend Changes

### `apps/mobile/src/navigation/index.tsx`
- ✅ Listen for `notification:count` socket event
- ✅ REST API fallback with timeout
- ✅ Proper cleanup of socket listeners

### `apps/mobile/src/screens/notifications/NotificationsScreen.tsx`
- ✅ Removed auto-mark-all-read behavior
- ✅ Removed optimistic count decrement
- ✅ Fixed socket listener dependencies
- ✅ Update all tabs on new notification
- ✅ Added defensive cache initialization

### `apps/mobile/src/store/notificationStore.ts`
- ✅ Added validation and warning logs
- ✅ Marked increment/decrement as deprecated
- ✅ Added documentation about socket-driven updates

### `apps/mobile/src/services/socket.service.ts`
- ✅ Added documentation about notification:count event

## Testing Recommendations

1. **Concurrent Notifications**
   - Create multiple notifications rapidly
   - Verify count increments correctly
   - Check that no notifications are lost

2. **Mark Read Operations**
   - Mark individual notifications as read
   - Mark all as read
   - Verify count updates correctly without going negative

3. **Socket Reconnection**
   - Disconnect and reconnect
   - Verify count is restored correctly
   - Check that no duplicate notifications appear

4. **Tab Switching**
   - Receive notification while on 'activity' tab
   - Switch to 'all' tab
   - Verify notification appears in correct tab

5. **Offline/Online Transitions**
   - Go offline, create notifications
   - Come back online
   - Verify count syncs correctly

## Architecture Notes

**Single Source of Truth:** The backend Redis counter is now the authoritative source for notification counts. All client updates come through socket events.

**Atomic Operations:** Redis INCR/DECR operations ensure thread-safe counter updates even with high concurrency.

**Defensive Programming:** Multiple layers of validation prevent negative counts and handle edge cases gracefully.

**Event Ordering:** Socket events are ordered and reliable within a session, ensuring consistent state updates.
