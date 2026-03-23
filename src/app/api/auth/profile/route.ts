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

interface UpdateProfileRequest {
  email?: string;
  line_id?: string;
  birthdate?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateProfileRequest = await request.json();
    
    const authToken = request.cookies.get('sb-session-token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized - no session token' },
        { status: 401 }
      );
    }

    // Get the Supabase client
    const supabase = getSupabaseClient(authToken);

    // Get user info using the session token
    const { data: userData, error: userError } = await supabase.auth.getUser(authToken);
    if (userError || !userData.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid user' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email is already taken (by another user)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', body.email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }

      // Try to update email in auth using service role key if available
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (hasServiceKey) {
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          email: body.email,
        });

        if (authError) {
          return NextResponse.json(
            { error: 'Failed to update email in auth: ' + authError.message },
            { status: 400 }
          );
        }
      } else {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not set - email in auth will not be updated');
      }
    }

    // Update profile in users table
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.email) updateData.email = body.email;
    if (body.line_id !== undefined) updateData.line_id = body.line_id || null;
    if (body.birthdate !== undefined) updateData.birthdate = body.birthdate || null;

    const { data: updatedProfile, error: profileError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to update profile: ' + profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
