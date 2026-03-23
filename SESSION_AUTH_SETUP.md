# Session Authentication Setup Guide

## Issue: "Unauthorized - no active session"

This error occurs when the API routes can't verify the user's session. This is a **configuration issue**, not a code bug.

---

## Why This Happens

The profile update and password change features require server-side authentication to verify the user's identity. The server needs:

1. **Session token from cookie** - ✅ Already working (browser sends automatically)
2. **Supabase Service Role Key** - ❌ **You need to add this to `.env.local`**

Without the service role key, the server can only:
- ✅ Read user profile data (profile updates to users table work)
- ❌ Update auth email (needs admin access)
- ❌ Change password (needs admin access)

---

## How to Fix It

### Step 1: Get Your Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy your **Service Role Key** (NOT the anon key)
   - Look for the header that says "Service role key"
   - It starts with `eyJhbGc...` and is longer than the anon key

### Step 2: Add It to `.env.local`

Open `/Users/Taspol/Documents/ocean_fishing/.env.local` and add:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # <- Add this line
```

### Step 3: Restart the Dev Server

```bash
pnpm dev
```

---

## What Works Now

### ✅ Profile Updates
- Email changes
- LINE ID updates  
- Birthdate updates
- All without the service role key

### ✅ Password Changes
- With service role key
- Current password verification
- Secure password update

---

## Important Security Notes

⚠️ **NEVER commit the service role key to Git!**

The `.env.local` file should already be in `.gitignore`. Verify:

```bash
cat .gitignore | grep env
# Should show: .env.local
```

The service role key has **admin privileges** - keep it secret like a password.

---

## Troubleshooting

### Still getting "Unauthorized - no active session"?

**Check 1:** Verify the service role key is in `.env.local`
```bash
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

**Check 2:** Restart the dev server after adding the key
```bash
# Stop with Ctrl+C
pnpm dev
```

**Check 3:** Check browser console (F12) for more details
- Look for fetch errors in Network tab
- Check Console tab for JavaScript errors

**Check 4:** Verify you're logged in
- Make sure you have an active session
- Session token should be in cookies (visible in DevTools → Application → Cookies → `sb-session-token`)

### Getting "Email already in use"?
- The email you're changing to is taken by someone else
- Choose a different email

### Getting "Current password is incorrect"?
- Double-check your current password
- Make sure Caps Lock is not on

---

## API Endpoints

### PUT `/api/auth/profile`
Updates user profile information.

**Request:**
```json
{
  "email": "new@example.com",
  "line_id": "optional_line_id",
  "birthdate": "1990-01-01"
}
```

**Requires:** Valid session token (automatic via cookie)

---

### POST `/api/auth/change-password`
Changes user password.

**Request:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Requires:** 
- Valid session token
- Service role key in environment

---

## Testing

Once configured, test from the Settings page:

1. Navigate to `/settings`
2. Try updating profile → should say "Profile updated successfully"
3. Try changing password → should say "Password changed successfully"

If you get errors, check the browser console (F12) for details.

---

## Reference

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
