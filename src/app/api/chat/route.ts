import { NextRequest, NextResponse } from 'next/server';

// Configure your external webhook URL here
const EXTERNAL_WEBHOOK_URL = process.env.CHAT_WEBHOOK_URL;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // If external webhook is configured, forward the request
    if (EXTERNAL_WEBHOOK_URL) {
      try {
        const webhookResponse = await fetch(EXTERNAL_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationHistory,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!webhookResponse.ok) {
          throw new Error(`Webhook responded with status: ${webhookResponse.status}`);
        }

        const webhookData = await webhookResponse.json();

        return NextResponse.json({
          response: webhookData.response || webhookData.message || webhookData.reply || 'تم استلام رسالتك',
          success: true,
        });
      } catch (webhookError) {
        console.error('Error communicating with external webhook:', webhookError);
        // Fall through to default response if webhook fails
      }
    }

    // Default response when no webhook is configured or webhook fails
    // This provides a basic echo/acknowledgment response
    const defaultResponses = [
      'شكراً لتواصلك معنا! سنقوم بالرد عليك قريباً.',
      'تم استلام رسالتك بنجاح. فريقنا سيتواصل معك في أقرب وقت.',
      'مرحباً! شكراً على رسالتك. كيف يمكننا مساعدتك أكثر؟',
    ];

    const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

    return NextResponse.json({
      response: randomResponse,
      success: true,
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process message', response: 'عذراً، حدث خطأ في معالجة الرسالة.' },
      { status: 500 }
    );
  }
}
