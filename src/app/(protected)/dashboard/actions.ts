'use server';

import {streamText} from 'ai';
import {createStreamableValue} from 'ai/rsc';
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import { generateEmbedding } from '@/lib/gemini';
import { db } from '@/server/db';

const google=createGoogleGenerativeAI({
    apiKey:process.env.GEMINI_API_KEY
});

export async function askQuestion(question:string,projectId:string){
    const stream=createStreamableValue();

    const project = await db.project.findUnique({
        where: { id: projectId },
        select: { name: true, githubUrl: true }
    });
    
    const projectName = project?.name || "your project";
    const githubUrl = project?.githubUrl || "";

    const queryVector=await generateEmbedding(question);
    const vectorQuery=`[${queryVector.join(',')}]`;

    const result=await db.$queryRaw`
    SELECT "fileName","sourceCode","summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
    AND "projectId"=${projectId}
    ORDER BY similarity DESC
    LIMIT 15
    ` as {fileName:string;sourceCode:string;summary:string}[];

    let context='';

    context += `PROJECT OVERVIEW:\nName: ${projectName}\nRepository: ${githubUrl}\n\n`;
    
    for(const doc of result){
        context+=`FILE: ${doc.fileName}\n---------------------\nCODE:\n${doc.sourceCode}\n\nSUMMARY:\n${doc.summary}\n\n===================================\n\n`;
    }

    (async () => {
        const { textStream } = streamText({
            model: google('gemini-1.5-flash'),
            prompt: `You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern with a basic understanding of programming and software development.
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
            END OF CONTEXT BLOCK
            
            START QUESTION
            ${question}
            END OF QUESTION
            The AI assistant will take into account any CONTEXT BLOCK provided in the conversation.
            The AI assistant must analyze the provided code context thoroughly before answering. Never respond with "I need to analyze the code" or similar statements - all relevant code is already provided in the context.
            The AI assistant should confidently answer questions based on the code context without hedging or saying it needs further examination. The context already contains file summaries, source code, and all information needed.
            The answer should be direct, detailed, and pin-point accurate based on the available code without unnecessary qualifiers or disclaimers.
            The AI assistant will not apologize for previous responses but will instead indicate when new information has been gained.
            The AI assistant should avoid saying things like "Based on the repository name, it's likely..." and instead focus on the actual content that's already available in the context.
            Answer in markdown syntax, with code snippets if needed. Always provide thorough, detailed responses with in-depth explanations, logical reasoning, and when appropriate, practical examples. Never give short or superficial answers - take the time to fully explore the topic and provide educational value in every response. Use headings, bullet points, and other formatting to improve readability of longer answers.`
        })
        for await (const delta of textStream) {
            stream.update(delta)
        }

        stream.done()
    })()

    return {
        output: stream.value,
        filesReferences: result
    }

}