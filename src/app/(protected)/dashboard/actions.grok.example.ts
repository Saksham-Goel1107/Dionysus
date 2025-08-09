'use server';

import Groq from 'groq-sdk';
import { createStreamableValue } from 'ai/rsc';
import { generateEmbedding } from '@/lib/gemini';
import { readReplicaDb2 } from '@/server/read-replica-2-db';

export async function askQuestion(question: string, projectId: string) {
  const project = await readReplicaDb2.project.findUnique({
    where: { id: projectId },
    select: { name: true, githubUrl: true },
  });

  const projectName = project?.name || 'your project';
  const githubUrl = project?.githubUrl || '';

  const queryVector = await generateEmbedding(question);
  const vectorQuery = `[${queryVector.join(',')}]`;

  const result = (await readReplicaDb2.$queryRaw`
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

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const messages: any[] = [
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

  const stream = createStreamableValue();
  (async () => {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'openai/gpt-oss-120b',
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: true,
        reasoning_effort: 'high',
        tools: [{ type: 'browser_search' }, { type: 'code_interpreter' }],
      });
      for await (const chunk of chatCompletion) {
        stream.update(chunk.choices[0]?.delta?.content || '');
      }
      stream.done();
    } catch (err) {
      stream.error(err);
      console.error('Groq invoke error:', err);
    }
  })();
  return {
    output: stream.value,
    filesReferences: result,
  };
}
