# Profile Update & Password Change Feature

## Overview
Users can now update their profile information and change their password through the new Settings page.

## What Was Added

### 1. New API Routes

#### `POST /api/auth/change-password`
Updates user password after verifying current password.

**Request:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Validation:**
- Current password verified against auth
- New password must be at least 6 characters
- New password must be different from current password

---

#### `PUT /api/auth/profile`
Updates user profile information (email, line_id, birthdate).

**Request:**
```json
{
  "email": "string (optional)",
  "line_id": "string (optional)",
  "birthdate": "string (optional)"
}
```

**Validation:**
- Email format validation
- Duplicate email check (for other users only)
- Updates both auth email and users table

---

### 2. Updated Auth Context

**New functions in `useAuth()` hook:**

```typescript
// Update user profile
updateProfile(profileData: {
  email?: string;
  line_id?: string;
  birthdate?: string;
}): Promise<UserProfile>

// Change password
changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void>
```

Both functions:
- Handle errors and set error state in context
- Update local user state after successful changes
- Include proper error messages

---

### 3. New Settings Page

**Location:** `/settings` (protected route)

**Features:**
- **Profile Tab:** Update email, LINE ID, birthdate
- **Password Tab:** Change password with confirmation
- Tab-based interface for organization
- Real-time validation
- Success/error message display
- Loading states

**CSS:** `src/app/settings/settings.module.css`

---

### 4. Updated Middleware

Added `/settings` to protected routes list. Users must be logged in to access.

---

### 5. Updated Sidebar

Settings link already in place in `src/components/Sidebar.tsx` for navigation.

---

## Usage Example

```tsx
import { useAuth } from '@/lib/authContext';

export function MyComponent() {
  const { user, updateProfile, changePassword, error } = useAuth();

  // Update profile
  const handleProfileUpdate = async () => {
    try {
      const updated = await updateProfile({
        line_id: 'new_line_id',
        birthdate: '1990-01-01',
      });
      console.log('Updated profile:', updated);
    } catch (err) {
      console.error('Failed to update:', error);
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    try {
      await changePassword('oldPassword123', 'newPassword456');
      console.log('Password changed');
    } catch (err) {
      console.error('Failed to change password:', error);
    }
  };

  return (
    <>
      <button onClick={handleProfileUpdate}>Update Profile</button>
      <button onClick={handlePasswordChange}>Change Password</button>
    </>
  );
}
```

---

## Database Considerations

- User profile changes are persisted in Supabase `users` table
- Password changes are handled by Supabase Auth
- Email updates sync between auth and users table
- RLS policies control access (users can only modify their own data)

---

## Security Notes

- Session tokens checked for all profile/password operations
- Email uniqueness verified before updates
- Current password verified before password changes
- Passwords validated for minimum length (6 characters)
- All operations use HTTPS (in production)
