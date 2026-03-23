import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
    : anon;

  return { anon, admin };
}

async function resolveSessionFromCookie(request: NextRequest) {
  const authToken = request.cookies.get('sb-session-token')?.value;
  if (!authToken) {
    return { user: null, profile: null };
  }

  const { anon, admin } = getSupabaseClients();
  const { data: userData, error: userError } = await anon.auth.getUser(authToken);

  if (userError || !userData.user?.id) {
    return { user: null, profile: null };
  }

  const { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();

  return { user: userData.user, profile: profile || null };
}

async function handleSessionRequest(request: NextRequest) {
  try {
    const { user, profile } = await resolveSessionFromCookie(request);

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user,
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSessionRequest(request);
}

export async function POST(request: NextRequest) {
  return handleSessionRequest(request);
}
