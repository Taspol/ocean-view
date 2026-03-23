# 🔐 Session & Authentication Quick Reference

## TL;DR - Protect a Page in 30 Seconds

### Option 1: Use ProtectedRoute Component (Easiest)
```typescript
'use client';

import { ProtectedRoute } from '@/lib/protectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <h1>Only logged-in users see this</h1>
    </ProtectedRoute>
  );
}
```

### Option 2: Use Middleware (Already Done!)
Just make sure your route is in the protected list in `middleware.ts`:
```typescript
const PROTECTED_ROUTES = ['/maps', '/weather', '/dashboard'];
```

---

## Check If User Is Logged In

```typescript
'use client';

import { useAuth } from '@/lib/authContext';

export default function Component() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Welcome {user.email}!</div>;
}
```

---

## Log Out User

```typescript
'use client';

import { useAuth } from '@/lib/authContext';

export default function LogoutButton() {
  const { logOut } = useAuth();

  return <button onClick={logOut}>Log Out</button>;
}
```

---

## Get User Data

```typescript
const { user } = useAuth();

// User has:
// - id: UUID
// - email: string
// - line_id?: string
// - birthdate?: string (YYYY-MM-DD)
// - created_at: timestamp
// - updated_at: timestamp

console.log(user.email);
console.log(user.line_id);
console.log(user.birthdate);
```

---

## Auto-Redirect After Login

By default, after the user logs in:
1. If they came from a protected route → they go to that route
2. Otherwise → they go to `/`

Example: User tries `/maps` → gets redirected to `/login?redirectTo=/maps` → logs in → goes back to `/maps`

---

## Protected Routes (Already Set Up)

These routes require login:
- ✅ `/maps`
- ✅ `/weather`
- ✅ `/dashboard`
- ✅ `/liff`

To add more: Edit `middleware.ts` and add to `PROTECTED_ROUTES`

---

## Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Server-side route protection |
| `src/lib/authContext.tsx` | Auth context & `useAuth()` hook |
| `src/lib/protectedRoute.tsx` | `ProtectedRoute` component |
| `src/app/api/auth/*` | Auth API endpoints |
| `SESSION_GUIDE.md` | Full documentation |

---

## Common Patterns

### Navbar with Conditional Rendering
```typescript
'use client';

import { useAuth } from '@/lib/authContext';

export default function Navbar() {
  const { user, logOut } = useAuth();

  return (
    <nav>
      {user ? (
        <>
          <span>{user.email}</span>
          <button onClick={logOut}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </nav>
  );
}
```

### Dashboard with User Info
```typescript
'use client';

import { useRequireAuth } from '@/lib/protectedRoute';

export default function Dashboard() {
  const { user, isAuthenticated } = useRequireAuth();

  if (!isAuthenticated) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Email: {user?.email}</p>
      <p>Member since: {user?.created_at}</p>
    </div>
  );
}
```

### Profile Page
```typescript
'use client';

import { ProtectedRoute } from '@/lib/protectedRoute';
import { useAuth } from '@/lib/authContext';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Your Profile</h1>
      <p>Email: {user?.email}</p>
      <p>LINE ID: {user?.line_id || 'Not set'}</p>
      <p>Birthday: {user?.birthdate || 'Not set'}</p>
    </div>
  );
}
```

---

## Flow Diagram

```
Unauthenticated User
         ↓
Tries to access /maps
         ↓
Middleware checks session
         ↓
No session found
         ↓
Redirect to /login?redirectTo=/maps
         ↓
User logs in
         ↓
Session created
         ↓
Redirected back to /maps
         ↓
Middleware checks session
         ↓
Session valid
         ↓
User sees /maps content
```

---

## Troubleshooting

**"I'm still seeing login page even after logging in"**
- Clear browser cookies
- Restart dev server: `pnpm dev`
- Check DevTools → Application → Cookies for `sb-session-token`

**"Protected route not working"**
- Make sure route is in `PROTECTED_ROUTES` in `middleware.ts`
- Restart dev server

**"useAuth returns null even though I'm logged in"**
- Make sure your component is wrapped by `<AuthProvider>` (done in `src/app/layout.tsx`)
- Check browser console for errors

---

## 🔒 Security Features Already Enabled

✅ HTTPS-only cookies in production  
✅ httpOnly flag (prevents XSS theft)  
✅ SameSite=Lax (prevents CSRF)  
✅ Secure flag in production  
✅ Database Row Level Security (RLS)  
✅ Password hashing (Supabase handles it)  

---

<details>
<summary>Need more details? See SESSION_GUIDE.md</summary>

For complete documentation including:
- Detailed setup instructions
- All available hooks and components  
- Advanced authentication patterns
- Troubleshooting guide
- Best practices

See [SESSION_GUIDE.md](SESSION_GUIDE.md)
</details>
