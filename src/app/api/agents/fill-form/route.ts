import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { FormFillerAgent } from '@/lib/agents';
import type { ProjectType } from '@/types/database';

/**
 * POST /api/agents/fill-form
 *
 * Automatically fill a customer form (Salam or Mobily)
 *
 * Request body:
 * {
 *   "projectType": "salam" | "mobily",
 *   "formData": {
 *     // Form fields based on project type
 *   },
 *   "options": {
 *     "skipValidation": boolean (optional),
 *     "allowDuplicates": boolean (optional)
 *   }
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "message": string,
 *   "errors": object (optional),
 *   "data": object (optional),
 *   "customerId": string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح - يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    if (!user.username) {
      return NextResponse.json(
        { success: false, message: 'خطأ في بيانات المستخدم - اسم المستخدم مفقود' },
        { status: 400 }
      );
    }

    // Store username (guaranteed to be non-null after check)
    const username = user.username;

    // Parse request body
    const body = await request.json();
    const { projectType, formData, options = {} } = body;

    // Validate project type
    if (!projectType || (projectType !== 'salam' && projectType !== 'mobily')) {
      return NextResponse.json(
        {
          success: false,
          message: 'نوع المشروع غير صحيح. يجب أن يكون "salam" أو "mobily"',
        },
        { status: 400 }
      );
    }

    // Validate form data
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json(
        {
          success: false,
          message: 'بيانات النموذج غير صحيحة',
        },
        { status: 400 }
      );
    }

    // Fill the form using the agent
    const result = await FormFillerAgent.fillForm(
      projectType as ProjectType,
      formData,
      {
        userId: user.id,
        username: username,
        skipValidation: options.skipValidation || false,
        allowDuplicates: options.allowDuplicates || false,
      }
    );

    // Return result
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error in fill-form API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ غير متوقع في الخادم',
        errors: {
          general: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
