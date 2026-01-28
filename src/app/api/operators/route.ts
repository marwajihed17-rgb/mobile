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

    // Try to fetch operators from the operators table
    const { data: operators, error: operatorsError } = await supabase
      .from('operators')
      .select('id, name, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (operatorsError) {
      // If table doesn't exist, return default operators
      console.log('Operators table not found, returning defaults:', operatorsError.message);
      return NextResponse.json({
        operators: [
          { id: 'salam', name: 'سلام' },
          { id: 'mobily', name: 'موبايلي' },
          { id: 'zain', name: 'زين' },
          { id: 'stc', name: 'stc' },
        ]
      });
    }

    return NextResponse.json({ operators: operators || [] });
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المشغلين' },
      { status: 500 }
    );
  }
}
