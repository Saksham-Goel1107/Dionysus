import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { LangChainTracer } from 'langchain/callbacks';
import { NextRequest, NextResponse } from 'next/server';
import { getChat, setChat } from '../../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import { withRateLimit } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

let tracer: LangChainTracer | null = null;
let model: ChatGoogleGenerativeAI | null = null;

const SYSTEM_CONTEXT = `You are an AI assistant for Dionysus, a powerful AI-powered GitHub SaaS client designed to revolutionize project collaboration and management. Built with privacy and efficiency in mind, Dionysus helps users seamlessly integrate GitHub repositories, explore commit histories, interact with AI to learn about projects, and manage teams effectively.

Key Features:
• GitHub Integration
  - Link repositories directly via GitHub URLs
  - Analyze complete commit histories
  - AI-powered repository insights
  - Code exploration and understanding

• AI-Powered Meeting Management
  - Audio transcription with timestamps
  - AI-generated meeting summaries
  - Meeting analytics and insights
  - Chapter-based organization of content

• Team Collaboration
  - Invite team members via unique URLs
  - Shared project access and insights
  - Collaborative code analysis
  - Real-time project updates

• Privacy Focus
  - Secure data handling
  - User authentication via Clerk
  - Protected repository access
  - Controlled sharing permissions

• User Experience
  - Intuitive dashboard interface
  - Real-time progress tracking
  - Seamless file uploads
  - Comprehensive project views

I can help users with:
1. Repository Management
   - Linking GitHub repositories
   - Analyzing commit histories
   - Understanding code structure
   - Project setup and configuration

2. Meeting Processing
   - Uploading meeting recordings
   - Understanding transcripts and summaries
   - Extracting insights from meetings
   - Troubleshooting upload issues

3. Team Collaboration
   - Inviting team members
   - Setting up permissions
   - Managing project access
   - Coordinating development efforts

4. Account Management
   - Credits system usage
   - Subscription management
   - Authentication issues
   - Profile configuration

5. Technical Support
   - Platform feature explanations
   - Troubleshooting common issues
   - API integration questions
   - Performance optimization tips

Response Formatting:
• Use clear headings for sections
• Include bullet points (•) for lists
• Use proper indentation
• Add line breaks between sections
• Highlight important terms where appropriate
• Keep responses concise and helpful
• Use proper spacing after punctuation
• Format content in an easy-to-read manner

Keep responses focused on helping users leverage GitHub repositories, understand their code, process meetings, and collaborate with team members effectively through the Dionysus platform.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const isAuthenticated = !!userId;

    const rateLimitResult = await withRateLimit(req, 'api-ai-chat', {
      limit: isAuthenticated ? 10 : 5,
      window: 60,
      errorMessage: 'AI chat rate limit exceeded. Please try again later.',
    });

    if (rateLimitResult) return rateLimitResult;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const langsmithApiKey = process.env.LANGCHAIN_API_KEY;
    if (!geminiApiKey || typeof geminiApiKey !== 'string' || geminiApiKey.trim() === '') {
      console.error('GEMINI_API_KEY is not properly configured');
      return NextResponse.json(
        { error: 'Invalid Gemini API configuration. Please contact the administrator.' },
        { status: 500 },
      );
    }
    if (!langsmithApiKey || typeof langsmithApiKey !== 'string' || langsmithApiKey.trim() === '') {
      console.error('LANGCHAIN_TRACING_API_KEY is not properly configured');
      return NextResponse.json(
        { error: 'Invalid LangSmith API configuration. Please contact the administrator.' },
        { status: 500 },
      );
    }

    if (!tracer) {
      tracer = new LangChainTracer({
        projectName: 'dionysus-ai-chat',
      });
    }
    if (!model) {
      model = new ChatGoogleGenerativeAI({
        apiKey: geminiApiKey,
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      });
    }

    const { message, sessionId = uuidv4() } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    const history = (await getChat(sessionId)) as ChatMessage[];
    const conversationContext: string =
      history.length > 0
        ? history.map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n\n')
        : '';

    let responseText = '';
    try {
      const result = await model.invoke([
        { role: 'system', content: SYSTEM_CONTEXT },
        ...(history.length > 0
          ? history.map((msg: ChatMessage) => ({ role: msg.role, content: msg.content }))
          : []),
        { role: 'user', content: message },
      ]);
      if (typeof result.content === 'string') {
        responseText = result.content;
      } else if (Array.isArray(result.content)) {
        responseText = result.content
          .map((item: any) => (typeof item === 'string' ? item : item.text || ''))
          .join('\n');
      } else {
        responseText = String(result.content);
      }
    } catch (traceErr) {
      console.error('LangSmith trace error:', traceErr);
      return NextResponse.json(
        { error: 'LangSmith tracing failed. Please try again later.' },
        { status: 500 },
      );
    }

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response generated. Please try again.' },
        { status: 500 },
      );
    }
    responseText = responseText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([.!?])\s*(\w)/g, '$1 $2')
      .replace(/^[-*]\s/gm, '• ')
      .replace(/^\t[-*]\s/gm, '    • ')
      .replace(/^\d+\.\s/gm, (match) => match.trim() + ' ')
      .replace(/\*\*(.*?)\*\*/g, (_, text) => `**${text.trim()}**`)
      .replace(/\*(.*?)\*/g, (_, text) => `*${text.trim()}*`)
      .replace(/`(.*?)`/g, (_, text) => `\`${text.trim()}\``)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        const formattedCode = code
          .split('\n')
          .map((line: string) => line.trim())
          .join('\n    ');
        return `\`\`\`${lang || ''}\n    ${formattedCode}\n\`\`\``;
      })
      .replace(/^(•|\d+\.)\s*/gm, '$1 ')
      .replace(/^(\s{2,})/gm, '    ')
      .trim();

    const updatedHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: responseText },
    ];
    await setChat(sessionId, updatedHistory);
    return NextResponse.json({
      response: responseText,
      timestamp: new Date().toISOString(),
      sessionId,
    });
  } catch (err) {
    const error = err as Error;

    console.error('AI Chat Error:', error);

    if (
      error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('API key not valid')
    ) {
      return NextResponse.json(
        { error: 'Invalid API configuration. Please contact the administrator.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response, please try again later.' },
      { status: 500 },
    );
  }
}
