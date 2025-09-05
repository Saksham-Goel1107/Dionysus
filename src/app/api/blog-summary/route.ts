import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { LangChainTracer } from 'langchain/callbacks';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'

// Initialize tracer if available
let tracer: LangChainTracer | null = null;
if (process.env.LANGCHAIN_API_KEY) {
  tracer = new LangChainTracer({
    projectName: 'dionysus-blog-summary',
  });
}
const googleApiKey = process.env.GEMINI_API_KEY || '';

if (!googleApiKey) {
  console.warn('Google Generative AI API key not set');
}

// Initialize Gemini model with streaming when API key is available
const geminiModel = googleApiKey
  ? new ChatGoogleGenerativeAI({
      apiKey: googleApiKey,
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      streaming: true,
      callbacks: tracer ? [tracer] : undefined,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { content, title } = await request.json();

    if (!content || !title) {
      return NextResponse.json({ error: 'Content and title are required' }, { status: 400 });
    }

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const prompt = `You are an expert content summarizer. Please provide a concise, engaging summary of the following blog post in 2-3 sentences. Focus on the key insights and main takeaways that would be valuable to readers.

Blog Title: ${title}

Blog Content:
${content}

Please provide a summary that:
- Captures the essence of the article
- Highlights the most important points
- Is written in an engaging, accessible tone
- Tell about each and every thing that is must read
Summary:`;

          if (!geminiModel) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ error: 'Google API key not configured on server' })}\n\n`,
              ),
            );
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          // Stream the response
          const stream = await geminiModel.stream(prompt);

          for await (const chunk of stream) {
            const text = chunk.content;
            if (text) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Send completion signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: 'Failed to generate summary' })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Blog summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
