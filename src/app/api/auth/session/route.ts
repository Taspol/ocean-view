import { createSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    // Create response with session data
    const response = NextResponse.json(
      { 
        authenticated: true,
        user: data.session.user,
      },
      { status: 200 }
    );

    // Set session cookie (optional, for middleware verification)
    if (data.session.access_token) {
      response.cookies.set('sb-session-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}
