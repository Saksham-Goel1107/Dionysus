'use server';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { generateEmbedding } from '@/lib/gemini';
import { readReplicaDb } from '@/server/read-replica-db';
import { LangChainTracer } from 'langchain/callbacks';

let tracer: LangChainTracer | null = null;
if (!tracer && process.env.LANGCHAIN_API_KEY) {
  tracer = new LangChainTracer({
    projectName: 'dionysus-dashboard-ask-question',
  });
}

export async function askQuestion(question: string, projectId: string) {
  if (!process.env.LANGCHAIN_API_KEY) {
    console.error('LANGCHAIN_API_KEY is missing. LangSmith tracing will not work.');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing. Gemini model will not work.');
  }

  const project = await readReplicaDb.project.findUnique({
    where: { id: projectId },
    select: { name: true, githubUrl: true },
  });

  const projectName = project?.name || 'your project';
  const githubUrl = project?.githubUrl || '';

  const queryVector = await generateEmbedding(question);
  const vectorQuery = `[${queryVector.join(',')}]`;

  const result = (await readReplicaDb.$queryRaw`
    SELECT "fileName","sourceCode","summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
    AND "projectId"=${projectId}
    ORDER BY similarity DESC
    LIMIT 15
    `) as { fileName: string; sourceCode: string; summary: string }[];

  let context = '';
  context += `PROJECT OVERVIEW:\nName: ${projectName}\nRepository: ${githubUrl}\n\n`;
  for (const doc of result) {
    context += `FILE: ${doc.fileName}\n---------------------\nCODE:\n${doc.sourceCode}\n\nSUMMARY:\n${doc.summary}\n\n===================================\n\n`;
  }

  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1000,
  });

  // Use array of messages for proper LangChain tracing
  const messages = [
    {
      role: 'system',
      content: `You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern with a basic understanding of programming and software development.
        The AI assistant is a brand new, powerful, human-like artificial intelligence.
        The traits of the AI include expert knowledge, helpfulness, cleverness, and articulateness.
        The AI is a well-behaved and well-mannered individual.
        The AI is always friendly, kind, and inspiring, and it is eager to provide vivid and thoughtful responses to the user.
        The AI has the sum of all knowledge in its brain and is able to accurately answer nearly any question about any topic in the codebase.

        CURRENT PROJECT:
        Name: ${projectName}
        Repository: ${githubUrl}

        If the question asks about "my project" or "this project", always interpret it as referring to "${projectName}".
        If the question is about code or a specific file, the AI will provide a detailed answer, giving step-by-step instructions and explanations as needed.

        CODEBASE CONTEXT:
        ${context}
        END OF CONTEXT BLOCK`,
    },
    {
      role: 'user',
      content: question,
    },
  ];

  let response;
  try {
    response = await model.invoke(messages, { callbacks: tracer ? [tracer] : undefined });
  } catch (err) {
    console.error('LangChain invoke error:', err);
    throw err;
  }

  const { createStreamableValue } = await import('ai/rsc');
  const stream = createStreamableValue();
  stream.update(response.text || response.content || '');
  stream.done();

  return {
    output: stream.value,
    filesReferences: result,
  };
}
