import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create supabase client only when the route is actually called
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
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

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const supabase = getSupabaseClient();

    const { email, password, line_id, birthdate } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
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
    // On some setups, FK checks can race briefly after auth.signUp, so retry a few times.
    let profileError: { code?: string; message?: string } | null = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const { error } = await supabase
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

      // 23503 = foreign_key_violation (usually auth.users row not visible yet)
      if (error.code === '23503' && attempt < 3) {
        await sleep(350 * attempt);
        continue;
      }

      break;
    }

    if (profileError) {
      // Don't fail signup; profile can be created lazily on first authenticated flow.
      console.warn('User profile creation deferred during signup:', profileError);
    }

    // Create response with session data
    const response = NextResponse.json(
      { 
        message: 'User created successfully',
        user: authData.user,
      },
      { status: 201 }
    );

    // Set session cookie if session exists
    if (authData.session?.access_token) {
      response.cookies.set('sb-session-token', authData.session.access_token, {
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
