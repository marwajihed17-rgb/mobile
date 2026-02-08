import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/operators/update-status
 *
 * Allows an operator to update the activation status of a customer entry.
 * Uses the service role client to bypass RLS policies, with server-side
 * authorization checks to ensure only active operators can perform updates.
 *
 * Body: {
 *   customerId: string,
 *   projectType: 'salam' | 'mobily',
 *   activationStatus: 'activating' | 'activated',
 *   price?: number | null  // optional, for mobily customers only
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user via session cookies
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // 2. Verify the user is an active operator
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, role, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'لم يتم العثور على الملف الشخصي' },
        { status: 404 }
      );
    }

    if (profile.role !== 'operator' || profile.status !== 'active') {
      return NextResponse.json(
        { error: 'غير مصرح - يجب أن يكون المستخدم مشغلاً نشطاً' },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { customerId, projectType, activationStatus, price } = body;

    if (!customerId || !projectType || !activationStatus) {
      return NextResponse.json(
        { error: 'بيانات ناقصة' },
        { status: 400 }
      );
    }

    if (projectType !== 'salam' && projectType !== 'mobily') {
      return NextResponse.json(
        { error: 'نوع المشروع غير صالح' },
        { status: 400 }
      );
    }

    if (activationStatus !== 'activating' && activationStatus !== 'activated') {
      return NextResponse.json(
        { error: 'حالة التفعيل غير صالحة' },
        { status: 400 }
      );
    }

    // 4. Create service role client (bypasses RLS)
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

    const tableName = projectType === 'salam' ? 'salam_customers' : 'mobily_customers';

    // 5. Verify the entry exists and is in a valid state for update
    const { data: existingEntry, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('id, operator_id, activation_status')
      .eq('id', customerId)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { error: 'لم يتم العثور على السجل' },
        { status: 404 }
      );
    }

    // Operator can only update entries assigned to them or unassigned
    if (existingEntry.operator_id && existingEntry.operator_id !== profile.id) {
      return NextResponse.json(
        { error: 'هذا السجل مخصص لمشغل آخر' },
        { status: 403 }
      );
    }

    // Entry must be in activating or activated state
    if (existingEntry.activation_status !== 'activating' && existingEntry.activation_status !== 'activated') {
      return NextResponse.json(
        { error: 'لا يمكن تعديل سجل بهذه الحالة' },
        { status: 400 }
      );
    }

    // 6. Build update data
    // When operator selects 'activated', save as 'confirmed' to move to admin dashboard
    const dbStatus = activationStatus === 'activated' ? 'confirmed' : activationStatus;

    const updateData: Record<string, string | number | null> = {
      operator_id: profile.id,
      operator_name: profile.username,
      activation_status: dbStatus,
    };

    // Add price for Mobily customers if provided
    if (projectType === 'mobily' && price !== undefined) {
      updateData.price = price;
    }

    // 7. Perform the update (service role bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', customerId);

    if (updateError) {
      console.error('Error updating customer status:', updateError);
      return NextResponse.json(
        { error: `خطأ في تحديث الحالة: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ البيانات بنجاح',
      savedStatus: dbStatus,
    });
  } catch (error) {
    console.error('Error in operator update-status:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
