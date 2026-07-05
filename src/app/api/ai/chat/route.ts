import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processAICommand, AIRequest } from '@/lib/ai/ai-command-layer';
import { BotId } from '@/lib/ai/ai-permissions';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    
    const { botId, prompt, module, recordId } = body;

    if (!botId || !prompt || !module) {
      return NextResponse.json(
        { error: 'Missing required fields: botId, prompt, or module.' },
        { status: 400 }
      );
    }

    // Role defaults to Guest if not logged in
    // Make sure we type check or default properly based on our custom session object
    const userRole = (session?.user as any)?.role || 'Guest';
    const userId = (session?.user as any)?.id;

    const aiRequest: AIRequest = {
      botId: botId as BotId,
      prompt,
      module,
      recordId,
      userRole,
      userId,
    };

    const result = await processAICommand(aiRequest);

    if (result.isBlocked) {
      // We can return 403 or 200 with a blocked message.
      // For a chat UX, returning 200 with the message makes it easy to display in the chat UI.
      return NextResponse.json({
        message: result.message,
        isBlocked: true
      });
    }

    return NextResponse.json({
      message: result.message,
      isBlocked: false
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
