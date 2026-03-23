import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create supabase client only when the route is actually called
function getSupabaseClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const anon = createClient(supabaseUrl, supabaseAnonKey);
  const admin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

  return { anon, admin };
}

interface SignupRequest {
  email: string;
  password: string;
  line_id?: string;
  birthdate?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAuthUser(
  admin: any,
  userId: string,
  maxAttempts = 6
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (!error && data.user) {
      return true;
    }

    if (attempt < maxAttempts) {
      await sleep(300 * attempt);
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { anon, admin } = getSupabaseClients();

    const { email, password, line_id, birthdate } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        {
          error:
            'SUPABASE_SERVICE_ROLE_KEY is required to create users without email verification',
        },
        { status: 500 }
      );
    }

    // Create auth user as already email-confirmed (skip verification email flow).
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create user profile in users table.
    let profileError: { code?: string; message?: string } | null = null;

    const authUserVisible = await waitForAuthUser(admin, authData.user.id);

    if (!authUserVisible) {
      profileError = {
        code: 'AUTH_USER_NOT_VISIBLE',
        message: 'Auth user not visible yet for profile upsert',
      };
    } else {
      // Even after visibility check, keep retries for transient FK checks.
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const { error } = await admin
          .from('users')
          .upsert(
            {
              id: authData.user.id,
              email,
              line_id: line_id || null,
              birthdate: birthdate || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (!error) {
          profileError = null;
          break;
        }

        profileError = error;

        if (error.code === '23503' && attempt < 5) {
          await sleep(300 * attempt);
          continue;
        }

        break;
      }
    }

    if (profileError) {
      if (line_id) {
        return NextResponse.json(
          {
            error:
              'LINE connection could not be saved. Please try signup again so LINE login can work automatically.',
            code: profileError.code || 'PROFILE_UPSERT_FAILED',
          },
          { status: 500 }
        );
      }

      // Don't fail signup; profile can be created lazily on first authenticated flow.
      console.warn('User profile creation deferred during signup:', profileError);
    }

    // Sign in immediately to create session cookie for the frontend.
    const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { error: signInError?.message || 'Signup succeeded but automatic login failed' },
        { status: 500 }
      );
    }

    // Create response with session data
    const response = NextResponse.json(
      { 
        message: 'User created successfully',
        user: signInData.user,
        requiresEmailConfirmation: false,
      },
      { status: 201 }
    );

    // Set session cookie
    if (signInData.session?.access_token) {
      response.cookies.set('sb-session-token', signInData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
