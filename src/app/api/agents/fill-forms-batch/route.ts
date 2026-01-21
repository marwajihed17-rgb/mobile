import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { FormFillerAgent } from '@/lib/agents';
import type { ProjectType } from '@/types/database';

/**
 * POST /api/agents/fill-forms-batch
 *
 * Automatically fill multiple customer forms in batch (Salam or Mobily)
 *
 * Request body:
 * {
 *   "projectType": "salam" | "mobily",
 *   "formsData": [
 *     { // Form fields based on project type },
 *     { // Form fields based on project type },
 *     ...
 *   ],
 *   "options": {
 *     "skipValidation": boolean (optional),
 *     "allowDuplicates": boolean (optional)
 *   }
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "results": [
 *     { "success": boolean, "message": string, ... },
 *     ...
 *   ],
 *   "successCount": number,
 *   "failureCount": number
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

    // Parse request body
    const body = await request.json();
    const { projectType, formsData, options = {} } = body;

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

    // Validate forms data
    if (!formsData || !Array.isArray(formsData) || formsData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'بيانات النماذج غير صحيحة أو فارغة',
        },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 100;
    if (formsData.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `عدد النماذج يتجاوز الحد الأقصى المسموح (${MAX_BATCH_SIZE})`,
        },
        { status: 400 }
      );
    }

    // Fill forms in batch using the agent
    const result = await FormFillerAgent.fillFormsBatch(
      projectType as ProjectType,
      formsData,
      {
        userId: user.id,
        username: user.username,
        skipValidation: options.skipValidation || false,
        allowDuplicates: options.allowDuplicates || false,
      }
    );

    // Return result
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in fill-forms-batch API:', error);
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
