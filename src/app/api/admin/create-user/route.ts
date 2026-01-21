import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current user's session to verify they're an admin
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { username, email, supervisor_name, password } = body;

    // Validate required fields
    if (!username || !email || !supervisor_name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صحيح' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'إسم المستخدم موجود بالفعل. الرجاء اختيار إسم آخر' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل. الرجاء اختيار بريد آخر' },
        { status: 400 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create user with admin client (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username,
        supervisor_name,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile was created by trigger, if not create it
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (!existingProfile) {
      // Trigger didn't create profile, create it manually
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          username: username,
          supervisor_name: supervisor_name,
          role: 'user',
          status: 'active',
        });

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);

        // If profile creation fails, delete the auth user to keep consistency
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

        return NextResponse.json(
          { error: `خطأ في إنشاء الملف الشخصي: ${createProfileError.message}` },
          { status: 500 }
        );
      }

      // Create user settings
      await supabaseAdmin
        .from('user_settings')
        .insert({
          user_id: authData.user.id,
          dashboard_access: true,
          admin_privileges: false,
        });
    } else {
      // Profile exists (created by trigger), update it with correct username/supervisor
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          username: username,
          supervisor_name: supervisor_name,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Warning: Failed to update profile:', updateError);
        // Don't fail if update fails, profile exists
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم إضافة المستخدم بنجاح',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: username,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in create-user API:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
