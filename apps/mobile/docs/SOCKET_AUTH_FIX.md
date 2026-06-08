# Socket.IO Authentication Error Fix

## Problem

Socket connection fails with:
```
ERROR  [Socket] Connection error: {
  "attempt": 1,
  "description": "Invalid or expired token",
  "message": "Invalid or expired token"
}
```

After initial connection, the socket loses auth and keeps trying to reconnect with the same expired token in an infinite loop.

## Root Cause

1. **Token Expiration**: JWT tokens expire after a certain period (typically 15-60 minutes)
2. **No Token Refresh on Socket Error**: When socket gets `connect_error` with auth failure, it was only logging the error but not fetching a fresh token
3. **Stale Token Reuse**: Socket.IO was reusing the same expired token from initial connection
4. **Missing Keychain Sync**: Socket wasn't checking Keychain for refreshed tokens (which API interceptor may have already updated)

## Solution Flow

### 1. API Token Refresh (Already Working)
The API service already handles token refresh:
- API interceptor catches 401 errors
- Automatically refreshes token using refresh token
- Saves new tokens to Keychain
- Notifies socket service via callback

### 2. Socket Auth Error Handling (Now Fixed)
When socket receives `connect_error` with auth failure:

```typescript
// Detects auth-related errors
if (err.message.includes('Invalid or expired token') || 
    err.message.includes('jwt expired')) {
  
  // 1. Fetch fresh token from Keychain
  const credentials = await Keychain.getGenericPassword({
    service: STORAGE_KEYS.ACCESS_TOKEN,
  });
  
  // 2. Update socket auth with fresh token
  this.socket.auth = { token: freshToken };
  
  // 3. Disconnect and reconnect with new token
  this.socket.disconnect();
  this.reconnectAttempts = 0; // Reset counter
  
  setTimeout(() => this.socket.connect(), 1000);
}
```

### 3. Token Refresh Callback (Now Improved)
The `reconnectWithNewToken()` method is now more robust:

```typescript
async reconnectWithNewToken(): Promise<void> {
  // Get latest token from Keychain
  const credentials = await Keychain.getGenericPassword({
    service: STORAGE_KEYS.ACCESS_TOKEN,
  });
  
  if (!credentials) {
    this.disconnect();
    return;
  }
  
  // Update auth and reconnect
  if (this.socket) {
    this.socket.auth = { token: credentials.password };
    this.socket.disconnect();
    this.reconnectAttempts = 0;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    this.socket.connect();
  }
}
```

## How It Works Together

### Scenario 1: Token Expires During Socket Connection

1. Socket tries to connect with expired token
2. Backend rejects with "Invalid or expired token"
3. Socket's `connect_error` handler detects auth error
4. Socket fetches fresh token from Keychain (may already be refreshed by API)
5. Socket updates `auth` object with fresh token
6. Socket reconnects successfully

### Scenario 2: Token Expires During API Call

1. API call fails with 401
2. API interceptor catches error
3. API calls `/auth/refresh` endpoint
4. New tokens saved to Keychain
5. API interceptor calls `tokenRefreshCallback()`
6. Socket's `reconnectWithNewToken()` executes
7. Socket fetches fresh token from Keychain
8. Socket reconnects with new token
9. Both API and Socket now using fresh tokens

### Scenario 3: Multiple Token Refreshes

1. API refresh happens (updates Keychain)
2. Socket immediately tries to reconnect but might use stale in-memory token
3. Socket gets auth error
4. Socket's error handler fetches latest from Keychain
5. Socket reconnects with actually fresh token

## Key Improvements

### Before
- ❌ Socket logged auth errors but didn't act
- ❌ Reconnection used same expired token
- ❌ No synchronization with Keychain
- ❌ Infinite failed reconnection attempts
- ❌ Manual app restart required

### After
- ✅ Socket detects auth errors and fetches fresh token
- ✅ Reconnection uses latest token from Keychain
- ✅ Synchronized with API token refresh
- ✅ Reconnect attempts reset with fresh token
- ✅ Automatic recovery without user intervention

## Testing

To verify the fix works:

### 1. Normal Operation
```
LOG  [Socket] Connected: xyz123
LOG  [Socket] Reconnected after 1 attempts
```

### 2. Token Expiration Recovery
```
ERROR [Socket] Connection error: Invalid or expired token
LOG   [Socket] Auth error detected, fetching fresh token...
LOG   [Socket] Got fresh token, updating auth...
LOG   [Socket] Connected: abc456
```

### 3. API Triggers Socket Refresh
```
LOG  [API] Token refreshed successfully
LOG  [Socket] Reconnecting with new token...
LOG  [Socket] Got fresh token, reconnecting...
LOG  [Socket] Connected: def789
```

## Configuration

### Token Lifetimes
Backend should be configured with:
- **Access Token**: 15-60 minutes
- **Refresh Token**: 7-30 days
- **Socket Reconnection**: Max 10 attempts

### Keychain Services
Tokens stored in separate services:
- `STORAGE_KEYS.ACCESS_TOKEN`: Current JWT
- `STORAGE_KEYS.REFRESH_TOKEN`: Refresh JWT

### Socket Options
```typescript
{
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  timeout: 20000,
}
```

## Troubleshooting

### Still seeing auth errors

1. **Check token expiration time**
   ```bash
   # Decode JWT to see expiration
   jwt-cli decode <your-token>
   ```

2. **Verify backend refresh endpoint**
   ```bash
   curl -X POST http://localhost:5000/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "your-refresh-token"}'
   ```

3. **Check Keychain has both tokens**
   - Clear app data and re-login
   - Verify both ACCESS_TOKEN and REFRESH_TOKEN are saved

### Socket keeps disconnecting

1. **Backend logs** - Check if auth middleware is rejecting
2. **Token format** - Ensure "Bearer " prefix is correct
3. **Network** - Check for unstable connection
4. **Backend restart** - May invalidate existing tokens

### Infinite reconnection loop

1. **Max attempts reached** - Socket gives up after 10 tries
2. **No refresh token** - User needs to re-login
3. **Backend down** - Socket can't reach refresh endpoint
4. **Refresh token expired** - User needs to re-authenticate

## Prevention

### Backend Best Practices
- Set reasonable token expiration times
- Implement refresh token rotation
- Log auth failures with context
- Rate limit token refresh attempts

### Mobile Best Practices
- Always save both tokens together
- Clear tokens on logout
- Handle network errors gracefully
- Don't store tokens in plain text
- Test token expiration scenarios

## Related Files

- `apps/mobile/src/services/socket.service.ts` - Socket connection logic
- `apps/mobile/src/services/api.ts` - API interceptor with token refresh
- `apps/mobile/src/store/authStore.ts` - Auth state and token management
- `apps/backend/src/middleware/auth.ts` - Backend JWT validation
- `apps/backend/src/socket/socket.ts` - Socket.IO server auth

## References

- Socket.IO Authentication: https://socket.io/docs/v4/middlewares/#sending-credentials
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- React Native Keychain: https://github.com/oblador/react-native-keychain
