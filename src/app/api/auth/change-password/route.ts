import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseClient(sessionToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  // Use service role key if available, otherwise anon key
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key);
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChangePasswordRequest = await request.json();

    // Validate input
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (body.newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (body.currentPassword === body.newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const authToken = request.cookies.get('sb-session-token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized - no session token' },
        { status: 401 }
      );
    }

    // Get the Supabase client
    const supabase = getSupabaseClient(authToken);

    // Get user info
    const { data: userData, error: userError } = await supabase.auth.getUser(authToken);
    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid user' },
        { status: 401 }
      );
    }

    const userEmail = userData.user.email;
    const userId = userData.user.id;

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: body.currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Check if we have service role key for admin operations
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasServiceKey) {
      return NextResponse.json(
        { error: 'Password change is not available. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 503 }
      );
    }

    // Update password using admin API with service key
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: body.newPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to change password: ' + updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password change error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
