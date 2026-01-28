import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch users with role='operator' from the profiles table
    const { data: operatorUsers, error: operatorsError } = await supabase
      .from('profiles')
      .select('id, username, full_name, supervisor_name')
      .eq('role', 'operator')
      .eq('status', 'active')
      .order('username', { ascending: true });

    if (operatorsError) {
      console.error('Error fetching operator users:', operatorsError.message);
      return NextResponse.json({
        operators: []
      });
    }

    // Map the profiles to operator format (id and name)
    const operators = (operatorUsers || []).map(profile => ({
      id: profile.id,
      name: profile.username || profile.full_name || 'مشغل',
    }));

    return NextResponse.json({ operators });
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المشغلين' },
      { status: 500 }
    );
  }
}
