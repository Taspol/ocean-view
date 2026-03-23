# Session & Protected Routes Guide

This guide explains how to require users to log in before accessing certain pages and features in your Ocean Fishing application.

## How It Works

The authentication system uses multiple layers to protect routes:

1. **Middleware** - Server-side route protection
2. **Protected Route Component** - Client-side protection
3. **useAuth Hook** - Check authentication status anywhere

---

## 🔒 Method 1: Middleware (Server-Side Protection)

The middleware automatically protects certain routes at the server level.

### Protected Routes (by default)
```
/dashboard
/maps
/weather
/liff
```

### How It Works
- User tries to access a protected route
- Middleware checks if they have a valid session
- If NOT logged in → Redirect to `/login?redirectTo=/intended-page`
- If logged in → Allow access

### To Add More Protected Routes

Edit [middleware.ts](middleware.ts):

```typescript
const PROTECTED_ROUTES = [
  '/dashboard',
  '/maps',
  '/weather',
  '/liff',
  '/profile',        // Add this
  '/settings',       // Add this
];
```

---

## 🛡️ Method 2: ProtectedRoute Component (Client-Side Protection)

Wrap any page component with the `ProtectedRoute` component for client-side protection.

### Example: Protecting a Dashboard Page

**File:** `src/app/dashboard/page.tsx`

```typescript
'use client';

import { ProtectedRoute } from '@/lib/protectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        <p>Only authenticated users can see this</p>
      </div>
    </ProtectedRoute>
  );
}
```

### What Happens
1. Component tries to render
2. If user is NOT logged in → Loading state → Redirect to login
3. If user IS logged in → Display content

---

## 🎯 Method 3: useRequireAuth Hook (Advanced)

Use the `useRequireAuth` hook for more control over authentication checks.

### Example: Custom Protected Page

**File:** `src/app/profile/page.tsx`

```typescript
'use client';

import { useRequireAuth } from '@/lib/protectedRoute';

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useRequireAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Redirecting...
  }

  return (
    <div>
      <h1>User Profile</h1>
      <p>Email: {user?.email}</p>
      <p>LINE ID: {user?.line_id || 'Not set'}</p>
      <p>Birthdate: {user?.birthdate || 'Not set'}</p>
    </div>
  );
}
```

---

## 📋 Method 4: useAuth Hook (Check Status Anywhere)

Use the `useAuth` hook to check authentication status in any component.

### Example: Conditional Rendering

```typescript
'use client';

import { useAuth } from '@/lib/authContext';

export default function Navbar() {
  const { user, logOut } = useAuth();

  return (
    <nav>
      {user ? (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={logOut}>Log Out</button>
        </>
      ) : (
        <a href="/login">Log In</a>
      )}
    </nav>
  );
}
```

---

## 🔀 Automatic Redirect After Login

When users log in, they're automatically redirected to:
1. The page they were trying to access (if they came from a protected route)
2. The home page `/` (if they came directly to login)

### Example Flow

```
User tries to access /maps (protected)
     ↓
Middleware redirects to /login?redirectTo=/maps
     ↓
User enters credentials and clicks "Log In"
     ↓
System redirects them back to /maps
```

---

## 🔄 Session Information

### Get Current Session
```typescript
import { useAuth } from '@/lib/authContext';

const { user, loading } = useAuth();

console.log(user); // { id, email, line_id, birthdate, created_at, updated_at }
```

### Logout
```typescript
const { logOut } = useAuth();

await logOut(); // User is logged out and redirected to login
```

---

## 🛠️ API Routes for Sessions

### Check Session Status
```bash
POST /api/auth/session

Response:
{
  "authenticated": true,
  "user": { ... }
}
```

---

## 📝 Complete Example: Protected Dashboard

**File:** `src/app/dashboard/page.tsx`

```typescript
'use client';

import { ProtectedRoute, useRequireAuth } from '@/lib/protectedRoute';
import { useAuth } from '@/lib/authContext';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user, logOut } = useAuth();

  return (
    <div>
      <header>
        <h1>Dashboard</h1>
        <button onClick={logOut}>Log Out</button>
      </header>

      <main>
        <h2>Welcome, {user?.email}!</h2>
        
        <section>
          <h3>Your Profile</h3>
          <p>Email: {user?.email}</p>
          <p>LINE ID: {user?.line_id || 'Not set'}</p>
          <p>Birthdate: {user?.birthdate || 'Not set'}</p>
          <p>Member since: {user?.created_at}</p>
        </section>
      </main>
    </div>
  );
}
```

---

## ✅ Security Best Practices

✓ **Use HTTPS** - Never send sessions over unencrypted connections  
✓ **httpOnly Cookies** - Session tokens are httpOnly (not accessible via JS)  
✓ **Secure Flag** - Cookies only sent over HTTPS in production  
✓ **SameSite Policy** - Prevents CSRF attacks  
✓ **RLS Policies** - Database data is protected by Row Level Security  

---

## 🧪 Testing Authentication

### Test Protected Routes
1. Start the app: `pnpm dev`
2. Try accessing `/dashboard` without logging in
3. You should be redirected to `/login?redirectTo=/dashboard`
4. After login, you should be redirected back to `/dashboard`

### Test useAuth Hook
1. Create a component that uses `useAuth()`
2. Log in and check that `user` is populated
3. Log out and check that `user` becomes `null`

---

## 🚨 Troubleshooting

### Users Can Still Access Protected Routes Without Logging In
- Make sure route is listed in `PROTECTED_ROUTES` in [middleware.ts](middleware.ts)
- Restart the dev server: `pnpm dev`

### Middleware Not Working
- Verify [middleware.ts](middleware.ts) exists in project root
- Check the `matcher` configuration matches your routes

### Redirect Loop
- Check that `/login` is NOT in `PROTECTED_ROUTES`
- Verify auth context is wrapped around entire app in [src/app/layout.tsx](src/app/layout.tsx)

### User Not Persisting After Refresh
- Ensure Supabase session management is working
- Check browser's Application → Cookies tab
- Verify `sb-session-token` cookie exists

---

## 📚 Key Files

- [middleware.ts](../../middleware.ts) - Server-side route protection
- [src/lib/authContext.tsx](../../src/lib/authContext.tsx) - Auth context provider & hooks
- [src/lib/protectedRoute.tsx](../../src/lib/protectedRoute.tsx) - Protected route component
- [src/app/api/auth/session/route.ts](../../src/app/api/auth/session/route.ts) - Session check endpoint
