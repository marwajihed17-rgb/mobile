import { NextRequest, NextResponse } from 'next/server';

// n8n webhook URL for chat integration
const N8N_WEBHOOK_URL = 'https://n8n.srv987649.hstgr.cloud/webhook/RetaamCellular';

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

    // Forward the request to n8n webhook
    console.log('Sending message to n8n webhook:', { message, historyLength: conversationHistory.length });

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log('n8n webhook response status:', webhookResponse.status);

    // Get the response text first
    const responseText = await webhookResponse.text();
    console.log('n8n webhook raw response:', responseText);

    if (!webhookResponse.ok) {
      console.error('n8n webhook error:', responseText);
      return NextResponse.json(
        { error: 'Webhook error', response: 'عذراً، حدث خطأ في الاتصال بالخادم.' },
        { status: 502 }
      );
    }

    // Try to parse the response as JSON
    let webhookData;
    try {
      webhookData = responseText ? JSON.parse(responseText) : {};
    } catch {
      // If not JSON, use the text directly as the response
      console.log('Response is not JSON, using as plain text');
      webhookData = { response: responseText || 'تم استلام رسالتك' };
    }

    // Extract the response from various possible formats n8n might return
    let assistantResponse =
      webhookData.response ||
      webhookData.message ||
      webhookData.reply ||
      webhookData.output ||
      webhookData.text ||
      webhookData.content ||
      (typeof webhookData === 'string' ? webhookData : null) ||
      'تم استلام رسالتك';

    // Handle case where n8n returns an array
    if (Array.isArray(webhookData)) {
      assistantResponse = webhookData[0]?.response ||
                         webhookData[0]?.message ||
                         webhookData[0]?.output ||
                         webhookData[0]?.text ||
                         JSON.stringify(webhookData);
    }

    return NextResponse.json({
      response: assistantResponse,
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
