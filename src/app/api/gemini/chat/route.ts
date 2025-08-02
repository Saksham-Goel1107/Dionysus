import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai/chat_models';
import { LangChainTracer } from 'langchain/callbacks';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LANGSMITH_API_KEY = process.env.LANGCHAIN_API_KEY;
let tracer: LangChainTracer | null = null;
let model: ChatGoogleGenerativeAI | null = null;

interface ChatHistoryItem {
  role: 'user' | 'ai';
  content: string;
}

async function callGemini({
  question,
  analytics,
  history,
}: {
  question: string;
  analytics: any;
  history: ChatHistoryItem[];
}) {
  if (!GEMINI_API_KEY) {
    return 'AI backend not configured. Please set up Gemini API.';
  }
  if (!LANGSMITH_API_KEY) {
    return 'LangSmith API key not configured.';
  }
  if (!tracer) {
    tracer = new LangChainTracer({ projectName: 'dionysus-gemini' });
  }
  if (!model) {
    model = new ChatGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxOutputTokens: 1000,
    });
  }
  function formatAnalytics(obj: any, indent = 0) {
    if (!obj) return '';
    let result = '';
    const indentation = '  '.repeat(indent);
    for (const [key, value] of Object.entries(obj)) {
      let formattedValue;
      if (typeof value === 'object' && value !== null) {
        formattedValue = '\n' + formatAnalytics(value, indent + 1);
        result += `${indentation}- **${key}**:${formattedValue}\n`;
      } else if (typeof value === 'number') {
        formattedValue = `\`${value}\``;
        result += `${indentation}- **${key}**: ${formattedValue}\n`;
      } else if (typeof value === 'string') {
        formattedValue = `\`${value}\``;
        result += `${indentation}- **${key}**: ${formattedValue}\n`;
      } else {
        formattedValue = `\`${JSON.stringify(value)}\``;
        result += `${indentation}- **${key}**: ${formattedValue}\n`;
      }
    }
    return result.trimEnd();
  }
  const formattedAnalytics = formatAnalytics(analytics);
  const systemPrompt = `You are an expert codebase assistant. Here is the code analytics (formatted for readability):\n${formattedAnalytics}\nAnswer user questions about the codebase, code quality, and metrics. Use Markdown formatting (including bullet points and newlines) in your answer.`;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m: ChatHistoryItem) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: question },
  ];
  try {
    const result = await model.invoke(messages);
    if (typeof result.content === 'string') {
      return result.content;
    } else if (Array.isArray(result.content)) {
      return result.content
        .map((item: any) => (typeof item === 'string' ? item : item.text || ''))
        .join('\n');
    } else {
      return String(result.content);
    }
  } catch (error: any) {
    return `Gemini API error: ${error.message || error}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question, analytics, history } = await req.json();
    if (!question || !analytics) {
      return NextResponse.json({ error: 'Missing question or analytics.' }, { status: 400 });
    }
    const answer = await callGemini({ question, analytics, history });
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
