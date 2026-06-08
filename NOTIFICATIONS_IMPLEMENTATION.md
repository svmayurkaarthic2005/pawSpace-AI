# PawSpace Notifications Implementation

## Overview
Complete full-stack notifications system with real-time Socket.IO delivery, swipeable rows, tab filtering, and section grouping.

---

## Backend Implementation

### 1. Notification Model (`apps/backend/src/models/notification.model.ts`)
**Extended fields:**
- `groupKey` - For grouping similar notifications (e.g., "post_likes_{postId}")
- `entityImage` - Thumbnail URL for the entity
- `entityName` - Post caption snippet, event title, etc.
- `tab` - Filter category: 'all' | 'activity'
- `expiresAt` - TTL (30 days default)

**Indexes:**
- `{ recipient, isRead, createdAt }` - Inbox query
- `{ recipient, tab, createdAt }` - Tab filtering
- `{ expiresAt }` - TTL auto-expiry

**Notification Types:**
- `like` - Post liked
- `comment` - Comment on post
- `follow` - New follower
- `event_rsvp` - RSVP to event
- `chat` - New message
- `ai_suggestion` - AI event recommendations
- `community_post` - Post in community

---

### 2. Notification Service (`apps/backend/src/services/notification.service.ts`)

**createNotification:**
- Deduplication: checks for same sender+type+entityId within 1 hour
- Auto-generates message templates based on notification type
- Increments Redis unread counter
- Emits Socket.IO `notification:new` event to user's room
- Sends FCM push if user is offline
- Returns null if self-notification or duplicate

**getNotifications:**
- Paginated query with cursor-based pagination
- Filters by tab ('all' or 'activity')
- Populates sender details
- Returns notifications + nextCursor + hasMore + unreadCount

**markAllRead / markOneRead:**
- Updates MongoDB
- Updates Redis counter
- Emits Socket.IO `notification:count_update`

**deleteNotification / clearAll:**
- Removes from MongoDB
- Updates Redis counter

---

### 3. Notification Controller (`apps/backend/src/controllers/notification.controller.ts`)

**Routes:**
- `GET /notifications` - Get paginated notifications (query: tab, cursor, limit)
- `GET /notifications/unread-count` - Get unread count from Redis
- `POST /notifications/mark-read` - Mark all as read
- `POST /notifications/:id/read` - Mark one as read
- `DELETE /notifications/:id` - Delete one notification
- `DELETE /notifications` - Clear all notifications

---

### 4. Integration into Existing Services

**PostService (`apps/backend/src/services/post.service.ts`):**
- `likePost` - Creates 'like' notification with entityImage (post media)
- `createComment` - Creates 'comment' notification with comment text preview

**FollowService (`apps/backend/src/services/follow.service.ts`):**
- `follow` - Creates 'follow' notification

**EventService (`apps/backend/src/services/event.service.ts`):**
- `rsvpEvent` - Creates 'event_rsvp' notification when user RSVPs 'going'

---

### 5. Socket.IO Handler (`apps/backend/src/socket/handlers/notification.handler.ts`)

**Events:**
- `notification:read` - Client marks one notification as read
- On connection: emits `notification:count` with current unread count

**Server-to-Client Events:**
- `notification:new` - New notification created
- `notification:count` - Initial unread count on connect
- `notification:count_update` - Updated count after read/delete

---

### 6. Redis Cache Integration (`apps/backend/src/services/cache.service.ts`)

**Keys:**
- `notif:unread:{userId}` - Unread counter (TTL: 7 days)
- `notif:list:{userId}` - Cached notification list (up to 50, TTL: 7 days)

**Operations:**
- Increment on new notification
- Decrement on mark read
- Reset on mark all read
- Clear on logout/clear all

---

## Mobile Implementation

### 1. Notification Store (`apps/mobile/src/store/notificationStore.ts`)

Zustand store with:
- `unreadCount` - Current unread count
- `setUnreadCount` - Set count (from API)
- `incrementUnreadCount` - On new notification
- `decrementUnreadCount` - On mark read
- `resetUnreadCount` - On mark all read

---

### 2. Notification Types (`apps/mobile/src/types/index.ts`)

```typescript
export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  type: NotificationType;
  entityId?: string;
  entityType?: string;
  entityImage?: string;
  entityName?: string;
  groupKey?: string;
  message: string;
  isRead: boolean;
  tab: 'all' | 'activity';
  createdAt: string;
}
```

---

### 3. NotificationsScreen (`apps/mobile/src/screens/notifications/NotificationsScreen.tsx`)

**Features:**
- Two tabs: 'All' and 'Activity' with animated indicator
- Section grouping: New / Today / This Week / Earlier
- Infinite scroll with cursor pagination
- Pull to refresh
- Swipeable rows (left: mark read, right: delete)
- Real-time Socket.IO updates
- Optimistic updates for mark read/delete
- Auto-marks all as read 2 seconds after focus
- Navigate to entity on tap (post, user profile, event, chat, etc.)

**State Management:**
- React Query for data fetching/caching
- Zustand for unread count
- Socket.IO for real-time updates

---

### 4. Components

**NotificationsHeader:**
- Title + "Mark all read" button

**NotificationTabs:**
- Two tabs with animated underline indicator
- Smooth spring animation on tab switch

**NotificationSectionHeader:**
- Section titles with color coding
- "New" section has purple dot indicator

**NotificationRow:**
- Avatar with notification type badge (icon overlaid on bottom-right)
- Notification text with username bolded
- Relative timestamp
- Entity thumbnail (if available)
- Unread state: purple background tint

**AINotificationRow:**
- Special design for AI suggestion notifications
- Sparkle icon (✦) instead of avatar
- Purple gradient background
- "Based on your pets" subtitle
- Right chevron icon

**SwipeableNotificationRow:**
- Wraps NotificationRow or AINotificationRow
- Left swipe: Mark Read (green background)
- Right swipe: Delete (red background)
- Only shows "Mark Read" if notification is unread

**NotificationsEmptyState:**
- Bell icon with animated pulse ring
- "All caught up!" message

**NotificationSkeleton:**
- Shimmer loading state
- 8 skeleton rows + 2 section headers

---

### 5. FeedHeader Integration (`apps/mobile/src/components/feed/FeedHeader.tsx`)

**Notification Bell Badge:**
- Shows unread count from notificationStore
- Displays number up to 9, then "9+"
- Red badge with white text
- Only visible when unreadCount > 0

---

### 6. Navigation Integration (`apps/mobile/src/navigation/index.tsx`)

**RootNavigator:**
- Fetches `/notifications/unread-count` on auth
- Initializes notificationStore with count
- Runs once when user is authenticated

---

### 7. Socket.IO Integration (`apps/mobile/src/services/socket.service.ts`)

**New Events:**
- `notification:new` - Receives new notification, increments count, triggers haptic
- `notification:count` - Initial count on connect
- `notification:count_update` - Updated count from server

**Type Definitions:**
- Updated ServerToClientEvents interface
- Added notification event types

---

## Notification Navigation Routes

When user taps notification:

| Type | Navigate To | Params |
|------|-------------|--------|
| `like` | PostDetail | `{ postId }` |
| `comment` | PostDetail | `{ postId }` |
| `follow` | Profile | `{ userId }` |
| `event_rsvp` | EventDetail | `{ eventId }` |
| `chat` | ChatRoom | `{ recipientId, recipientName }` |
| `ai_suggestion` | Explore | `{ initialQuery }` |
| `community_post` | CommunityDetail | `{ communityId }` |

---

## Notification Message Templates

```typescript
like: "{username} liked your post about {entityName}"
comment: "{username} commented on your post: \"{entityName}\""
follow: "{username} started following you"
event_rsvp: "{username} is going to {entityName}"
chat: "{username} sent you a message"
ai_suggestion: "✦ AI found {entityName} events for you"
community_post: "{username} posted in {entityName}"
```

---

## Section Grouping Logic

```typescript
New: !isRead && createdAt >= 1 hour ago
Today: createdAt >= start of today && not in "New"
This week: createdAt >= 7 days ago && not in "Today"
Earlier: createdAt < 7 days ago
```

---

## Styling & Design

**Color Palette:**
- Primary Purple: `#7C3AED`
- Background: `#0D0D1A` (dark navy)
- Unread Row: `rgba(124,58,237,0.08)` (purple tint)
- AI Row: `rgba(124,58,237,0.06)` (lighter purple)
- Text Primary: `#fff`
- Text Secondary: `rgba(255,255,255,0.75)`
- Text Muted: `rgba(255,255,255,0.5)`

**Icon Colors by Type:**
- Like: `#EF4444` (red)
- Comment: `#7C3AED` (purple)
- Follow: `#1D9E75` (green)
- Event RSVP: `#EF9F27` (orange)
- Chat: `#7C3AED` (purple)
- Community: `#378ADD` (blue)
- AI: `#A78BFA` (light purple)

---

## Performance Optimizations

1. **Cursor-based pagination** - No offset/limit issues with large datasets
2. **Redis caching** - Unread count cached for instant access
3. **React Query caching** - 30s stale time for notifications
4. **Optimistic updates** - Instant UI feedback for mark read/delete
5. **Socket.IO rooms** - Targeted `user:{userId}` rooms for efficient delivery
6. **Deduplication** - Prevents spam from rapid likes/comments
7. **TTL expiry** - Auto-deletes notifications after 30 days
8. **Skeleton loading** - Perceived performance improvement

---

## Testing Checklist

### Backend
- [ ] Create notification on post like
- [ ] Create notification on comment
- [ ] Create notification on follow
- [ ] Create notification on event RSVP
- [ ] Deduplication works (no duplicate notifications within 1 hour)
- [ ] Self-notifications skipped
- [ ] Redis counter increments on new notification
- [ ] Redis counter decrements on mark read
- [ ] Socket.IO emits to correct user room
- [ ] FCM push sent when user offline
- [ ] TTL expiry after 30 days
- [ ] Tab filtering works (all vs activity)
- [ ] Cursor pagination works correctly
- [ ] Mark all read updates MongoDB + Redis
- [ ] Delete notification removes from DB

### Mobile
- [ ] Notifications screen loads with data
- [ ] Tab switch animates smoothly
- [ ] Section grouping displays correctly
- [ ] Unread notifications have purple tint
- [ ] Swipe to mark read works
- [ ] Swipe to delete works
- [ ] Tap notification navigates to entity
- [ ] Real-time notification arrives (Socket.IO)
- [ ] Unread badge updates in FeedHeader
- [ ] Pull to refresh works
- [ ] Infinite scroll loads more
- [ ] Empty state shows when no notifications
- [ ] Skeleton loader displays while loading
- [ ] Auto-mark as read after 2s focus delay
- [ ] AI notification row renders correctly
- [ ] Haptic feedback on new notification
- [ ] Optimistic updates feel instant
- [ ] Unread count initializes on app start

---

## Files Created/Modified

### Backend Created:
- `apps/backend/src/services/notification.service.ts`
- `apps/backend/src/controllers/notification.controller.ts`
- `apps/backend/src/routes/notification.routes.ts`

### Backend Modified:
- `apps/backend/src/models/notification.model.ts` - Extended schema
- `apps/backend/src/routes/index.ts` - Added notification routes
- `apps/backend/src/services/post.service.ts` - Integrated createNotification
- `apps/backend/src/services/follow.service.ts` - Integrated createNotification
- `apps/backend/src/services/event.service.ts` - Integrated createNotification
- `apps/backend/src/socket/handlers/notification.handler.ts` - Updated handlers
- `apps/backend/src/socket/socket.ts` - Added getIO/setIO exports
- `apps/backend/src/server.ts` - Added setIO call + notification routes

### Mobile Created:
- `apps/mobile/src/store/notificationStore.ts`
- `apps/mobile/src/screens/notifications/NotificationsScreen.tsx`
- `apps/mobile/src/components/notifications/NotificationsHeader.tsx`
- `apps/mobile/src/components/notifications/NotificationTabs.tsx`
- `apps/mobile/src/components/notifications/NotificationSectionHeader.tsx`
- `apps/mobile/src/components/notifications/NotificationRow.tsx`
- `apps/mobile/src/components/notifications/NotificationText.tsx`
- `apps/mobile/src/components/notifications/AINotificationRow.tsx`
- `apps/mobile/src/components/notifications/SwipeableNotificationRow.tsx`
- `apps/mobile/src/components/notifications/NotificationsEmptyState.tsx`
- `apps/mobile/src/components/notifications/NotificationSkeleton.tsx`
- `apps/mobile/src/utils/formatRelativeTime.ts`

### Mobile Modified:
- `apps/mobile/src/types/index.ts` - Updated Notification interface
- `apps/mobile/src/components/feed/FeedHeader.tsx` - Added unread badge
- `apps/mobile/src/navigation/index.tsx` - Added unread count fetch on auth
- `apps/mobile/src/services/socket.service.ts` - Added notification events

---

## Next Steps / Enhancements

1. **Notification Grouping** - "pawlover123 and 3 others liked your post"
2. **Mute Notifications** - Per-user mute for X hours
3. **Notification Preferences** - Toggle notification types in Settings
4. **Rich Notifications** - Action buttons (Like back, Reply)
5. **Notification History Export** - Download notification history
6. **AI Notification Scheduling** - Daily digest at preferred time
7. **Push Notification Deep Links** - Open app to specific screen
8. **Notification Sound Customization** - Choose notification sounds

---

## Production Deployment Notes

1. Ensure MongoDB TTL index is created (run migration if needed)
2. Set up Redis backup/persistence for unread counters
3. Monitor Socket.IO connection counts and rooms
4. Set up FCM server key in production env
5. Test notification delivery across time zones
6. Set up notification rate limiting per user
7. Monitor notification creation rate for abuse
8. Set up notification analytics (delivery rate, read rate, click-through)

---

**Implementation Complete ✅**
