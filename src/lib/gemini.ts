import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';
import { Redis } from 'ioredis';

// Initialize Redis client if REDIS_URL is available
// Otherwise use a memory-based fallback for development
let redis: Redis | null = null;
const inMemoryStore: Map<string, { count: number; expires: number }> = new Map();
let redisEnabled = false;

// Only initialize Redis if URL is available (e.g., in production)
if (process.env.REDIS_URL_NEW) {
  try {
    redis = new Redis(process.env.REDIS_URL_NEW, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        // Only retry once, then give up
        return times >= 1 ? null : 200;
      },
    });

    // Handle Redis connection errors
    redis.on('error', (err) => {
      console.warn(
        'Redis connection error in gemini.ts, falling back to in-memory store:',
        err.message,
      );
      redisEnabled = false;
    });

    // Set flag when connection is successful
    redis.on('connect', () => {
      console.log('Successfully connected to Redis in gemini.ts');
      redisEnabled = true;
    });
  } catch (err: any) {
    console.warn(
      'Failed to initialize Redis in gemini.ts, using in-memory store instead:',
      err.message,
    );
    redis = null;
    redisEnabled = false;
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
});

// Internal rate limiter for library functions
async function checkRateLimit(
  key: string,
  limit: number = 50,
  windowInSeconds: number = 60,
): Promise<boolean> {
  const identifier = `lib:gemini:${key}`;
  let isAllowed = true;

  try {
    if (redis && redisEnabled) {
      try {
        // Use Redis if available and connected
        const current = await redis.incr(identifier);

        // Set expiration on first request
        if (current === 1) {
          await redis.expire(identifier, windowInSeconds);
        }

        isAllowed = current <= limit;
      } catch (redisError: any) {
        console.warn(
          `Redis rate limit operation failed in gemini.ts: ${redisError.message || redisError}`,
        );
        // Fall back to in-memory implementation
        return useMemoryRateLimit();
      }
    } else {
      // In-memory fallback
      return useMemoryRateLimit();
    }

    return isAllowed;
  } catch (error: any) {
    console.error('Rate limit check error:', error?.message || error);
    return true; // Allow on error to prevent blocking legitimate requests
  }

  // Helper function for in-memory rate limiting
  function useMemoryRateLimit(): boolean {
    const now = Date.now();
    const record = inMemoryStore.get(identifier) || {
      count: 0,
      expires: now + windowInSeconds * 1000,
    };

    // Reset if window has expired
    if (now > record.expires) {
      record.count = 0;
      record.expires = now + windowInSeconds * 1000;
    }

    // Increment counter
    record.count += 1;
    inMemoryStore.set(identifier, record);

    return record.count <= limit;
  }
}

export const aiSummariseCommit = async (diff: string, projectName: string) => {
  const isAllowed = await checkRateLimit('commit-summary', 10, 60);
  if (!isAllowed) {
    throw new Error('Rate limit exceeded for commit summaries. Please try again later.');
  }

  const response = await model.generateContent([
    `You are an expert programmer summarizing a git diff for the project "${projectName}". 
    Only refer to changes relevant to this project. 
    Ignore unrelated or external context. 
        \`\`\`
        diff -- git a/lib/index.js b/lib/index.js
        index aadf691 .. bfef603 100644
        --- a/lib/index.js
        +++ b/lib/index.js
        \`\`\`
        This means that \'lib/index.js\' was modified in this commit. Note that this is only an example.
        Then there is a specifier of the lines that were modified.
        A line starting with \'+\' means it was added.
        A line that starting with \'-\' means that line was deleted.
        A line that starts with neither \'+\' nor \'-\' is code given for context and better understanding.
        It is not part of the diff.
        [ ... ]
        EXAMPLE SUMMARY COMMENTS:
        \`\`\`
        . Raised the amount of returned recordings from \'10\ to \'100\' [packages/server/recordings_api.ts], [packages/server/constants.ts]
        . Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
        . Moved the \'octokit\ initialization to a separate file [src/ootokit.ts], [src/index.ts]
        . Added an OpenAI API for completions [packages/utils/apis/openai.ts]
        . Lowered numeric tolerance for test files
        Most commits will have less comments than this examples list.
        The last comment does not include the file names,
        because there were more than two relevant files in the hypothetical commit.
        Do not include parts of the example in your summary.
        Do not use any abrevation or punctuation like i am happy to provide or good question no comments like this just provide answer but the answer should be very descriptive covering each and every point
        Do not use Okay, I understand you're asking about but give direct answer
        It is given only as an example of appropriate comments. `,
    `Please summarise the following diff file: \n\n${diff}`,
  ]);

  return response.response.text();
};

export const summariseCode = async (doc: Document) => {
  const isAllowed = await checkRateLimit('code-summary', 10, 60);
  if (!isAllowed) {
    throw new Error('Rate limit exceeded for code summaries. Please try again later.');
  }

  try {
    const code = doc.pageContent.slice(0, 10000);
    const response = await model.generateContent([
      `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
      `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
            Here is the code:
            ---
            ${code}
            ---
            Give a summary no more than 100 words of the code above`,
    ]);
    return response.response.text();
  } catch (error) {
    return '';
  }
};

export const generateEmbedding = async (summary: string) => {
  // Check rate limit (50 embeddings per minute)
  const isAllowed = await checkRateLimit('embedding', 50, 60);
  if (!isAllowed) {
    throw new Error('Rate limit exceeded for embeddings generation. Please try again later.');
  }

  const model = genAI.getGenerativeModel({
    model: 'text-embedding-004',
  });

  const result = await model.embedContent(summary);
  const embedding = result.embedding;

  return embedding.values;
};

export async function askGemini(prompt: string): Promise<{ yaml?: string; tip?: string } | string> {
  const isAllowed = await checkRateLimit('ask-gemini', 5, 60);
  if (!isAllowed) {
    return {
      yaml: '# ❌ Error: Rate limit exceeded.',
      tip: 'Please try again after some time. There is a limit to how many requests you can make per minute.',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      yaml: '# ❌ Error: The GEMINI_API_KEY environment variable is missing.',
      tip: 'Set GEMINI_API_KEY in your environment to enable Gemini-powered YAML generation.',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const context = `
You are a professional DevOps engineer. 
Generate a production-ready CI/CD YAML file based on the user's request.
Include a helpful tip at the end that starts with 'Tip:'.

User request: ${prompt}

Respond in this format:
1. YAML in a markdown code block (\`\`\`yaml ... \`\`\`)
2. Tip at the end
`;

    const result = await model.generateContent(context);
    const text = await result.response.text();

    const yamlMatch = text.match(/```ya?ml([\s\S]*?)```/i);
    const tipMatch = text.match(/Tip:(.*)/i);

    return {
      yaml: yamlMatch?.[1]?.trim() ?? '# ⚠️ YAML block not detected in response.',
      tip:
        tipMatch?.[1]?.trim() ??
        'No tip found. Ensure your prompt is clear and focused on CI/CD needs.',
    };
  } catch (error: any) {
    console.error('Gemini Error:', error?.message || error);

    if (error.message?.includes('API key not valid')) {
      return {
        yaml: '# ❌ Error: Invalid GEMINI_API_KEY.',
        tip: 'Check and regenerate your API key from https://makersuite.google.com/app/apikey',
      };
    }

    return {
      yaml: `# ❌ Gemini API Error: ${error.message || 'Unknown error occurred.'}`,
      tip: 'Please try again or verify your API status.',
    };
  }
}
