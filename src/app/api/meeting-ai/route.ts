import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { NextRequest, NextResponse } from 'next/server';
import { getChat, setChat } from '../../utils/redis';
import { userHasProPlan } from '@/lib/check-pro-status';
import { LangChainTracer } from 'langchain/callbacks';
import { readReplicaDb } from '@/server/read-replica-db';

let model: ChatGoogleGenerativeAI | null = null;
let tracer: LangChainTracer | null = null;

const SYSTEM_CONTEXT = `You are an AI meeting assistant for Dionysus, a powerful AI-powered GitHub SaaS client designed to help manage and analyze development meetings. Your primary role is to assist users with questions about the entire meeting, help them understand the overall context, and provide summaries and insights about all the issues discussed.

Key Features You Support:
• Meeting Overview and Analysis
  - Provide high-level summaries of all issues discussed
  - Connect related issues and identify common themes
  - Highlight critical action items across all issues
  - Suggest potential follow-up actions based on meeting content

• Context-Aware Assistance
  - Maintain awareness of all issues in a meeting
  - Provide comprehensive answers that consider the entire meeting context
  - Identify relationships between different discussion topics
  - Help users understand how individual issues relate to the broader project

I can help users with:
1. Meeting Summaries
   - Providing a concise overview of all discussed issues
   - Identifying key themes and patterns
   - Highlighting important decisions and action items
   - Connecting discussion points to project goals

2. Issue Analysis
   - Explaining how different issues relate to one another
   - Identifying potential dependencies between issues
   - Suggesting prioritization of issues based on their content
   - Providing additional context or background on specific issues

3. Meeting Follow-up
   - Suggesting action items based on the meeting content
   - Recommending potential assignees for specific tasks
   - Proposing timelines for resolving issues
   - Identifying issues that may require additional discussion

4. Technical Questions
   - Answering questions about technical concepts discussed
   - Clarifying technical terminology or jargon used in the meeting
   - Explaining implications of technical decisions discussed
   - Suggesting further technical exploration where relevant

Response Formatting:
• Use clear headings for sections
• Include bullet points (•) for lists
• Use proper indentation
• Add line breaks between sections
• Highlight important terms where appropriate
• Keep responses concise and helpful
• Use proper spacing after punctuation
• Format content in an easy-to-read manner

Keep responses focused on helping users understand their meetings, connect issues to broader project contexts, and extract actionable insights from the collective meeting content.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export async function POST(req: NextRequest) {
  const hasProPlan = await userHasProPlan();
  if (!hasProPlan) {
    return NextResponse.json(
      {
        error: 'You need to upgrade to Pro to use this feature.',
      },
      { status: 403 },
    );
  }
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const langsmithApiKey = process.env.LANGCHAIN_API_KEY;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      console.error('GEMINI_API_KEY is not properly configured');
      return NextResponse.json(
        { error: 'Invalid API configuration. Please contact the administrator.' },
        { status: 500 },
      );
    }

    if (langsmithApiKey && !tracer) {
      tracer = new LangChainTracer({
        projectName: 'dionysus-meeting',
      });
    }

    if (!model) {
      model = new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      });
    }
    const {
      message,
      meetingId,
      meetingName,
      meetingDate,
      sessionId = meetingId,
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    const meeting = await readReplicaDb.meeting.findUnique({
      where: { id: meetingId },
      include: { issues: true },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const history = (await getChat(sessionId)) as ChatMessage[]; // Create meeting context from all issues
    const issueValue = 214.29; // Value per issue in dollars
    const totalValue = meeting.issues.length * issueValue;
    let meetingContext = `**Meeting Summary**\n`;
    meetingContext += `Meeting Name: ${meetingName || meeting.name}\n`;
    meetingContext += `Date: ${new Date(meetingDate || meeting.createdAt).toLocaleDateString()}\n`;
    meetingContext += `Issues: ${meeting.issues.length}\n`;
    meetingContext += `Total Value: ${formatCurrency(totalValue)}\n\n`;
    meetingContext += `**Issue Details**\n\n`;

    meeting.issues.forEach((issue, index) => {
      meetingContext += `ISSUE ${index + 1}: ${issue.gist}\n`;
      meetingContext += `Time Period: ${issue.start} - ${issue.end}\n`;
      meetingContext += `Headline: ${issue.headline}\n`;
      meetingContext += `Summary: ${issue.summary}\n\n`;
    });

    const conversationContext: string =
      history.length > 0
        ? history.map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n\n')
        : '';

    let responseText = '';
    try {
      const systemMessage =
        `${SYSTEM_CONTEXT}\n\n` +
        `Meeting Context:\n${meetingContext}\n\n` +
        `${conversationContext}`;

      const result = await model!.invoke([
        { role: 'system', content: systemMessage },
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
    } catch (error) {
      console.error('Meeting AI Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate response. Please try again later.' },
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
      .replace(/\*\*(.*?)\*\*/g, (_, text) => `<strong>${text.trim()}</strong>`)
      .replace(/\*(.*?)\*/g, (_, text) => `<em>${text.trim()}</em>`)
      .replace(/`(.*?)`/g, (_, text) => `<code>${text.trim()}</code>`)
      .replace(/^##\s*(.*?)$/gm, (_, heading) => `<h2>${heading.trim()}</h2>`)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang: string | undefined, code: string) => {
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
    const error = err as Error; // cast to Error type

    console.error('Meeting AI Error:', error);

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
