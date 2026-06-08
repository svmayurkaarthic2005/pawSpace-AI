# Notification System Race Condition Fixes

## Issues Identified

### 1. **Mark One Read Race Condition**
**Problem:** When multiple requests to mark the same notification as read arrived simultaneously, both could find it unread and decrement the counter twice.

**Fix:** Added `isRead: false` filter to `findOneAndUpdate` query to ensure atomic operation. The query now only matches unread notifications, preventing duplicate decrements.

### 2. **Mark All Read Race Condition**
**Problem:** `markAllRead` would reset the Redis counter to 0 regardless of whether any documents were actually modified, causing inconsistencies if called multiple times concurrently.

**Fix:** Only reset counter if `modifiedCount > 0`, preventing unnecessary counter resets.

### 3. **Count Synchronization Issues**
**Problem:** Redis counter could drift out of sync with MongoDB due to concurrent operations or partial failures.

**Fix:** 
- Added `syncUnreadCount()` method to reconcile Redis with MongoDB
- Added automatic sync check in `getNotifications()` on first page load
- Added `/notifications/sync` endpoint for manual recovery

### 4. **Notification Creation Duplicates**
**Problem:** Multiple rapid notifications (e.g., concurrent likes) could create duplicates before the 1-hour deduplication window check completes.

**Fix:**
- Added compound index with partial filter expression for deduplication
- Added duplicate key error handling with graceful fallback
- Counter increment happens only after successful creation

### 5. **Client-Side Optimistic Update Conflicts**
**Problem:** Client optimistic updates could conflict with socket events, causing incorrect counts.

**Fix:** Already implemented correctly - client waits for authoritative `notification:count_update` socket event rather than locally incrementing/decrementing.

## Changes Made

### Backend Files

#### `apps/backend/src/services/notification.service.ts`
- ✅ Enhanced `markOneRead()` with atomic `isRead: false` filter
- ✅ Enhanced `markAllRead()` to only reset counter if documents modified
- ✅ Added `syncUnreadCount()` method for count reconciliation
- ✅ Enhanced `getNotifications()` with automatic sync on first page load
- ✅ Added duplicate key error handling in `createNotification()`

#### `apps/backend/src/services/cache.service.ts`
- ✅ Added `setUnreadCount()` method for setting authoritative count
- ✅ Added `syncUnreadCount()` helper method

#### `apps/backend/src/controllers/notification.controller.ts`
- ✅ Added `syncCount()` controller method

#### `apps/backend/src/routes/notification.routes.ts`
- ✅ Added `POST /notifications/sync` route

#### `apps/backend/src/models/notification.model.ts`
- ✅ Added compound index for deduplication with partial filter expression

### Frontend Files

#### `apps/mobile/src/screens/notifications/NotificationsScreen.tsx`
- ✅ Removed unused imports (View, useCallback, useFocusEffect)
- ✅ Already properly implemented - uses authoritative socket counts

## How It Works Now

### Normal Flow (No Race Condition)
1. Notification created → MongoDB document saved
2. Redis counter incremented atomically
3. Socket event sent with new count
4. Client receives authoritative count

### Mark as Read Flow (Race-Protected)
1. Request arrives to mark notification as read
2. `findOneAndUpdate` with `isRead: false` filter executes atomically
3. Only if document was unread → counter decremented
4. Socket event sent with new count
5. Concurrent requests for same notification return false (already read)

### Auto-Recovery Flow
1. User loads notifications (first page, no cursor)
2. Backend queries both Redis count and MongoDB count
3. If mismatch detected → logs warning and syncs
4. Socket event sent with corrected count
5. User sees accurate count immediately

### Manual Recovery
Endpoint available if issues persist:
```bash
POST /notifications/sync
Authorization: Bearer <token>
```

## Redis Counter Guarantees

- ✅ `INCR` and `DECR` are atomic operations
- ✅ Counters never go below 0 (clamped in `decrementUnreadCount`)
- ✅ Auto-sync on first page load prevents drift
- ✅ Manual sync endpoint available for recovery

## Database Indexes

### New Compound Index
```javascript
{ 
  recipient: 1, 
  sender: 1, 
  type: 1, 
  entityId: 1, 
  createdAt: 1 
}
```

**With Partial Filter:**
- Only applies when `sender` and `entityId` exist
- Prevents duplicate notifications for same action
- Complements the 1-hour deduplication window check

## Testing Recommendations

### 1. Concurrent Mark Read
```bash
# Send multiple simultaneous requests to mark same notification read
for i in {1..10}; do
  curl -X POST "http://localhost:3000/notifications/{id}/read" \
    -H "Authorization: Bearer $TOKEN" &
done
wait
# Verify count decremented only once
```

### 2. Concurrent Likes
```bash
# Multiple users like the same post rapidly
# Verify only one notification created per user
```

### 3. Count Sync Recovery
```bash
# Manually corrupt Redis count
redis-cli SET "notif:unread:{userId}" 999
# Load notifications in app
# Verify count auto-corrects
```

### 4. Mark All Read Concurrency
```bash
# Send multiple mark-all-read requests
for i in {1..5}; do
  curl -X POST "http://localhost:3000/notifications/mark-read" \
    -H "Authorization: Bearer $TOKEN" &
done
wait
# Verify count is 0 and no errors
```

## Monitoring

Add these logs to track race condition recovery:

```
[getNotifications] Count mismatch for user {userId}: Redis={count}, MongoDB={count}. Syncing...
[createNotification] Duplicate notification prevented for user {recipient}
[markOneRead] Notification already read or not found (race prevented)
```

## Performance Impact

- ✅ Minimal - atomic operations are fast
- ✅ Auto-sync only runs on first page load
- ✅ Indexes improve query performance
- ✅ No additional database roundtrips in hot path

## Backwards Compatibility

- ✅ Existing clients continue to work
- ✅ New index is non-blocking (background)
- ✅ Old notifications unaffected
- ✅ Gradual rollout safe
