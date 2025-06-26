import { NextRequest, NextResponse } from 'next/server';

// You should set your Gemini or OpenAI API key in an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface ChatHistoryItem {
  role: 'user' | 'ai';
  content: string;
}

async function callGemini({ question, analytics, history }: { question: string; analytics: any; history: ChatHistoryItem[] }) {
  if (!GEMINI_API_KEY) {
    return 'AI backend not configured. Please set up Gemini API.';
  }
  
  function formatAnalytics(obj: any, indent = 0) {
    if (!obj) return '';
    let result = '';
    const indentation = '  '.repeat(indent);
    for (const [key, value] of Object.entries(obj)) {
      let formattedValue;
      if (typeof value === 'object' && value !== null) {
        // Recursively format nested objects as indented lists
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
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map((m: ChatHistoryItem) => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: question }] },
  ];
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: messages }),
  });
  const data = await res.json();
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  if (data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    // Sometimes Gemini returns inlineData for code or other content
    return data.candidates[0].content.parts[0].inlineData.data;
  }
  if (data?.candidates?.[0]?.content?.parts?.[0]) {
    // Fallback: try to stringify whatever is there
    return JSON.stringify(data.candidates[0].content.parts[0]);
  }
  if (data?.candidates?.[0]?.content?.text) {
    return data.candidates[0].content.text;
  }
  if (data?.candidates?.[0]?.content) {
    return JSON.stringify(data.candidates[0].content);
  }
  if (data?.candidates?.[0]) {
    return JSON.stringify(data.candidates[0]);
  }
  if (data?.error?.message) {
    return `Gemini API error: ${data.error.message}`;
  }
  return 'No answer.';
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
