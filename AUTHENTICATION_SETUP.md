# Authentication Setup Guide

This guide will help you set up Supabase authentication for your Ocean Fishing application.

## Prerequisites

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new Supabase project

## Step 1: Configure Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and paste it into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy your **anon public** key and paste it into `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Your `.env.local` should look like:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 2: Create the Users Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase_setup.sql` in the project root
4. Copy the entire SQL content
5. Paste it into the SQL editor in Supabase
6. Click **Run** to execute the migration

This will create:
- The `users` table with fields: `id`, `email`, `line_id`, `birthdate`, `created_at`, `updated_at`
- Proper indexes and foreign key relationships
- Row Level Security (RLS) policies for user data protection

## Step 3: Enable Email/Password Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure email settings if needed

## Features Implemented

### Sign Up
Users can create an account with:
- **Email** (required) - unique identifier
- **Password** (required) - minimum 6 characters
- **LINE ID** (optional) - for LINE integration
- **Birthdate** (optional) - user profile information

### Login
Users can log in with:
- **Email** - registered email address
- **Password** - their password

### Data Storage
All user data is securely stored in the Supabase database with:
- Row Level Security (RLS) enabled
- Automatic timestamp tracking
- Foreign key relationships with auth users

## Testing the Authentication

1. Start your development server: `pnpm dev`
2. Navigate to `http://localhost:3000/login`
3. Try signing up with a new account
4. Try logging in with your credentials
5. Check your Supabase **Table Editor** to see the new user records

## API Routes

### Sign Up
- **Endpoint**: `POST /api/auth/signup`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "line_id": "optional_line_id",
    "birthdate": "1990-01-01"
  }
  ```

### Login
- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

## Using the Auth Context

In any client component, you can use the `useAuth` hook:

```typescript
import { useAuth } from '@/lib/authContext';

export default function MyComponent() {
  const { user, loading, error, logIn, signUp, logOut } = useAuth();

  return (
    <div>
      {user && <p>Welcome, {user.email}</p>}
      <button onClick={() => logOut()}>Log Out</button>
    </div>
  );
}
```

## Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **RLS Policies** - Only authenticated users can read/update their own data
3. **Password Requirements** - Minimum 6 characters (you can increase this)
4. **Email Verification** - Consider enabling email verification in Supabase settings for production

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server

### "Failed to create user profile" error
- Verify that the `users` table exists in Supabase
- Check that RLS policies are correctly set up
- Ensure the service role can insert data

### Signup not working
- Check your Supabase email provider settings
- Verify the database table schema matches the SQL migration
- Check browser console for specific error messages
