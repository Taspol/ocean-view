# 🔐 Session & Authentication System - Complete Setup

Your Ocean Fishing application now has a complete session-based authentication system. Users **must log in first** before accessing protected pages.

---

## ✅ What's Implemented

### 1. **Automatic Login Requirement**
- Protected routes redirect unauthenticated users to login
- After login, users are sent back to their intended page
- Middleware prevents access to protected pages without a valid session

### 2. **Protected Pages**
These pages now require login:
- ✅ `/maps` - Map visualization
- ✅ `/weather` - Weather forecast  
- ✅ `/dashboard` - Dashboard
- ✅ `/liff` - LINE LIFF pages

### 3. **Session Management**
- Sessions stored securely in cookies (httpOnly)
- Automatic session validation on page load
- Graceful redirect to login when session expires

### 4. **User Profile Data Stored** (from login)
- Email (required, unique)
- Password (hashed by Supabase)
- LINE ID (optional)
- Birthdate (optional)
- Created & updated timestamps

---

## 🚀 How It Works

### Flow Diagram
```
1. User visits /maps (protected page)
   ↓
2. Middleware checks for valid session
   ↓
3. No session found?
   ↓
4. Redirect to /login?redirectTo=/maps
   ↓
5. User enters email & password
   ↓
6. Click "Log In"
   ↓
7. Credentials verified against Supabase
   ↓
8. Session created & stored in cookie
   ↓
9. Redirect back to /maps
   ↓
10. Content now visible (user is authenticated)
```

---

## 📁 Files Created for Session Protection

| File | Purpose |
|------|---------|
| `middleware.ts` | Server-side route protection |
| `src/lib/protectedRoute.tsx` | Client-side protection component |
| `src/lib/authContext.tsx` | Auth state & hooks |
| `src/app/api/auth/session/route.ts` | Session validation endpoint |
| `src/app/(auth)/login/LoginContent.tsx` | Login form with redirect logic |
| `src/app/maps/MapsContent.tsx` | Protected map page (example) |
| `src/app/weather/WeatherContent.tsx` | Protected weather page (example) |

---

## 💻 How to Use

### Protect a Page - Option 1: Use ProtectedRoute Component

**File:** `src/app/mypage/page.tsx`

```typescript
'use client';

import { ProtectedRoute } from '@/lib/protectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>This page requires login</h1>
        <p>Only authenticated users can see this</p>
      </div>
    </ProtectedRoute>
  );
}
```

### Protect a Page - Option 2: Add to Middleware

**File:** `middleware.ts`

```typescript
const PROTECTED_ROUTES = [
  '/maps',
  '/weather',
  '/dashboard',
  '/mypage',  // Add your page here
];
```

### Check User Login Status

Use the `useAuth()` hook anywhere:

```typescript
'use client';

import { useAuth } from '@/lib/authContext';

export default function Navbar() {
  const { user, logOut } = useAuth();

  return (
    <nav>
      {user ? (
        <>
          <span>Logged in as: {user.email}</span>
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

## 🧪 Test It

### Test Protected Route
1. Start dev server: `pnpm dev`
2. Go to `http://localhost:3000/maps` (without logging in)
3. Should redirect to login page
4. After login, should redirect back to `/maps`

### Test Logout
1. When logged in, click "Log Out" button
2. Should redirect to login page
3. Protected pages should be inaccessible

### Test Session Persistence
1. Log in and navigate around
2. Refresh page (F5)
3. Should stay logged in
4. Close and reopen browser
5. Session should persist (Supabase handles this)

---

## 🔒 Security Features

✅ **Middleware Protection** - Server-side route validation  
✅ **httpOnly Cookies** - Session tokens can't be accessed by JavaScript  
✅ **Secure Flag** - Cookies only sent over HTTPS in production  
✅ **SameSite Policy** - Protects against CSRF attacks  
✅ **Row Level Security** - Database enforces user data isolation  
✅ **Password Hashing** - Handled securely by Supabase  

---

## 📚 Key Hooks & Components

### `useAuth()` - Access Auth State
```typescript
const { user, loading, error, logIn, signUp, logOut, clearError } = useAuth();

// user = { id, email, line_id, birthdate, created_at, updated_at }
// loading = true while checking session
// error = last auth error message (if any)
```

### `useRequireAuth()` - Enforce Login
```typescript
const { user, loading, isAuthenticated } = useRequireAuth();

// Automatically redirects to login if not authenticated
// Use this in components that REQUIRE authentication
```

### `<ProtectedRoute>` - Protect Component
```typescript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// If logged in: shows YourComponent
// If not: shows loading then redirects to login
```

---

## 🌐 API Endpoints

### Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "line_id": "optional",
  "birthdate": "1990-01-15"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Logout
```bash
POST /api/auth/logout
```

### Check Session
```bash
POST /api/auth/session

Response:
{
  "authenticated": true,
  "user": { ... }
}
```

---

## 🔧 Common Tasks

### Add User to Database After Signup
The system already does this automatically! When a user signs up, they're added to the Supabase `users` table with all their profile info.

### Redirect After Login
Users are automatically redirected to:
- The page they were trying to access (if redirected from a protected route)
- Home page `/` (if they came directly to login)

### Log Out User
```typescript
const { logOut } = useAuth();
await logOut(); // User is logged out and redirected to login
```

### Get Current User Info
```typescript
const { user } = useAuth();

console.log(user.email);     // User's email
console.log(user.line_id);   // Their LINE ID (if set)
console.log(user.birthdate); // Their birthdate (if set)
```

---

## ⚠️ Important Notes

1. **Login page is PUBLIC** - Users don't need to be logged in to access `/login`
2. **Home page is PUBLIC** - The `/` route doesn't require login (change in `middleware.ts` if needed)
3. **Logout endpoint exists** - API route at `/api/auth/logout`
4. **Session persists** - Users stay logged in across browser restarts (Supabase manages this)
5. **Middleware runs first** - Server-side protection happens before React renders

---

## 🐛 Troubleshooting

### "I can still access protected pages without logging in"
- Make sure page is in `PROTECTED_ROUTES` list in `middleware.ts`
- Restart dev server: `pnpm dev`

### "Login doesn't redirect me back to the page I wanted"
- Check that login page is receiving the `redirectTo` query parameter
- Open DevTools and check URL: `http://localhost:3000/login?redirectTo=/maps`

### "I'm not staying logged in after refresh"
- Clear browser cookies and try again
- Check Supabase config in `.env.local`
- Restart dev server

### "useAuth() returns null even though I'm logged in"
- Make sure `<AuthProvider>` wraps your component in `src/app/layout.tsx`
- Check browser console for errors

---

## 📖 Related Docs

- [SESSION_GUIDE.md](SESSION_GUIDE.md) - Detailed guide with more examples
- [SESSION_QUICK_REFERENCE.md](SESSION_QUICK_REFERENCE.md) - Quick copy-paste examples
- [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) - Initial auth setup
- [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) - Implementation details

---

## 🎉 You're All Set!

Your authentication system is now complete and working. Users must log in first to access protected pages, and their sessions are securely managed by Supabase.

**Next steps:**
1. Test the login flow (see "Test It" section above)
2. Add more protected routes as needed
3. Customize the login UI if desired
4. Deploy to production when ready
