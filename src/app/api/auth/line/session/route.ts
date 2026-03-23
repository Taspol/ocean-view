import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface LineSessionRequest {
  rawLineUserId?: string;
  idToken?: string;
  accessToken?: string;
}

function getSupabaseClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const anon = createClient(supabaseUrl, supabaseAnonKey);

  return { admin, anon };
}

export async function POST(request: NextRequest) {
  try {
    const body: LineSessionRequest = await request.json();
    const rawLineUserId = body.rawLineUserId?.trim();
    const idToken = body.idToken?.trim();
    const accessToken = body.accessToken?.trim();

    if (!rawLineUserId || (!idToken && !accessToken)) {
      return NextResponse.json(
        { error: 'rawLineUserId and either idToken or accessToken are required' },
        { status: 400 }
      );
    }

    if (idToken) {
      const lineChannelId = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
      if (!lineChannelId) {
        return NextResponse.json(
          { error: 'Missing LINE_CHANNEL_ID environment variable' },
          { status: 500 }
        );
      }

      const verifyBody = new URLSearchParams({
        id_token: idToken,
        client_id: lineChannelId,
      });

      const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: verifyBody,
      });

      if (!verifyResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid LINE ID token' },
          { status: 401 }
        );
      }

      const verifyPayload = (await verifyResponse.json()) as { sub?: string };
      if (!verifyPayload.sub || verifyPayload.sub !== rawLineUserId) {
        return NextResponse.json(
          { error: 'LINE ID token does not match provided rawLineUserId' },
          { status: 401 }
        );
      }
    } else if (accessToken) {
      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid LINE access token' },
          { status: 401 }
        );
      }

      const profilePayload = (await profileResponse.json()) as { userId?: string };
      if (!profilePayload.userId || profilePayload.userId !== rawLineUserId) {
        return NextResponse.json(
          { error: 'LINE access token does not match provided rawLineUserId' },
          { status: 401 }
        );
      }
    }

    const { admin, anon } = getSupabaseClients();

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('id, email, line_id, birthdate, created_at, updated_at')
      .eq('line_id', rawLineUserId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || 'Failed to check LINE ID' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { needsSignup: true, rawLineUserId },
        { status: 404 }
      );
    }

    if (!profile.email) {
      return NextResponse.json(
        { error: 'User profile is missing email' },
        { status: 500 }
      );
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    });

    if (linkError || !linkData.properties?.hashed_token) {
      return NextResponse.json(
        { error: linkError?.message || 'Failed to generate login link' },
        { status: 500 }
      );
    }

    const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (otpError || !otpData.session || !otpData.user) {
      return NextResponse.json(
        { error: otpError?.message || 'Failed to create session from LINE ID' },
        { status: 500 }
      );
    }

    const response = NextResponse.json(
      {
        message: 'LINE login successful',
        user: otpData.user,
        profile,
      },
      { status: 200 }
    );

    response.cookies.set('sb-session-token', otpData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('LINE session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}