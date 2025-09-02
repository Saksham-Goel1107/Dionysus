function isRedisReady() {
  return redis && redisEnabled && redis.status === 'ready';
}

import { Document } from '@langchain/core/documents';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Redis } from 'ioredis';
import { LangChainTracer } from 'langchain/callbacks';

let redis: Redis | null = null;
let tracer: LangChainTracer | null = null;
const inMemoryStore: Map<string, { count: number; expires: number }> = new Map();
let redisEnabled = false;

if (process.env.REDIS_URL || process.env.REDIS_URL_NEW) {
  try {
    let redisUrl = process.env.REDIS_URL || process.env.REDIS_URL_NEW || '';

    try {
      redisUrl = decodeURIComponent(redisUrl).trim();
    } catch {
      redisUrl = redisUrl.replace(/%20/g, ' ').trim();
    }

    let redisHost = '';
    try {
      const parsedUrl = new URL(redisUrl);
      redisHost = parsedUrl.hostname;
    } catch {
      const match = redisUrl.match(/redis:\/\/(?:.*@)?([^:/?#]+)(?::\d+)?/);
      if (match && match[1]) {
        redisHost = match[1];
      }
    }
    // Only allow exact 'upstash.io' or direct subdomains (e.g., 'foo.upstash.io')
    const hostParts = redisHost.split('.');
    const isUpstash =
      (hostParts.length === 2 && redisHost === 'upstash.io') ||
      (hostParts.length > 2 && hostParts.slice(-2).join('.') === 'upstash.io');
    if (isUpstash) {
      if (redisUrl.includes('--tls') || redisUrl.includes('-u')) {
        const redisUrlMatch = redisUrl.match(/(redis:\/\/.*?@.*?:[0-9]+)/);
        if (redisUrlMatch && redisUrlMatch[1]) {
          redisUrl = redisUrlMatch[1];
        }
      }

      if (!redisUrl.startsWith('redis://') && redisUrl.includes('redis://')) {
        redisUrl = redisUrl.substring(redisUrl.indexOf('redis://'));
      }
    }

    console.log(
      'Attempting to connect to Redis in gemini.ts with URL:',
      redisUrl.replace(/redis:\/\/.*?@/, 'redis://***:***@'),
    ); // Log sanitized URL

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 10,
      connectTimeout: 15000,
      enableOfflineQueue: true,
      enableReadyCheck: true,
      keepAlive: 15000,
      family: 0,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return 2;
        }
        return 1;
      },
      retryStrategy: (times) => {
        if (times > 10) {
          console.warn(
            `Redis connection failed after ${times} attempts in gemini.ts, falling back to in-memory store`,
          );
          redisEnabled = false;
          return null;
        }
        const baseDelay = Math.min(times * 1000, 15000);
        const jitter = Math.floor(Math.random() * 500);
        const delay = baseDelay + jitter;
        console.log(`Redis reconnecting in gemini.ts in ${delay}ms (attempt ${times})`);
        return delay;
      },
    });

    redis.on('error', (err) => {
      console.warn(
        'Redis connection error in gemini.ts, falling back to in-memory store:',
        err.message,
      );
      redisEnabled = false;
    });

    redis.on('end', () => {
      console.warn('Redis connection ended in gemini.ts, falling back to in-memory store.');
      redisEnabled = false;
    });

    redis.on('close', () => {
      console.warn('Redis connection closed in gemini.ts, falling back to in-memory store.');
      redisEnabled = false;
    });

    redis.on('reconnecting', (time: number) => {
      console.log(`Redis reconnecting in gemini.ts, next attempt in ${time}ms`);
    });

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

if (!tracer && process.env.LANGCHAIN_API_KEY) {
  tracer = new LangChainTracer({
    projectName: 'dionysus-gemini',
  });
}

// Initialize LangChain models
const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: process.env.GEMINI_API_KEY!,
  callbacks: tracer ? [tracer] : undefined,
});

const embeddingModel = new GoogleGenerativeAIEmbeddings({
  model: 'text-embedding-004',
  apiKey: process.env.GEMINI_API_KEY!,
});

async function checkRateLimit(
  key: string,
  limit: number = 50,
  windowInSeconds: number = 60,
): Promise<boolean> {
  const identifier = `lib:gemini:${key}`;
  let isAllowed = true;

  try {
    if (isRedisReady()) {
      try {
        const current = await redis!.incr(identifier);
        if (current === 1) {
          await redis!.expire(identifier, windowInSeconds);
        }
        isAllowed = current <= limit;
      } catch (redisError: any) {
        console.warn(
          `Redis rate limit operation failed in gemini.ts: ${redisError.message || redisError}`,
        );
        redisEnabled = false;
        return memoryRateLimit();
      }
    } else {
      return memoryRateLimit();
    }
    return isAllowed;
  } catch (error: any) {
    console.error('Rate limit check error:', error?.message || error);
    return true;
  }

  function memoryRateLimit(): boolean {
    const now = Date.now();
    const record = inMemoryStore.get(identifier) || {
      count: 0,
      expires: now + windowInSeconds * 1000,
    };

    if (now > record.expires) {
      record.count = 0;
      record.expires = now + windowInSeconds * 1000;
    }

    record.count += 1;
    inMemoryStore.set(identifier, record);

    return record.count <= limit;
  }
}

export const aiSummariseCommit = async (diff: string, projectName: string) => {
  const allowed = await checkRateLimit('commit-summary', 10, 60);
  if (!allowed) {
    throw new Error('Rate limit exceeded for commit summaries. Please try again later.');
  }

  const prompt = `You are an expert programmer summarizing a git diff for the project "${projectName}".
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
        . Moved the \'octokit\' initialization to a separate file [src/ootokit.ts], [src/index.ts]
        . Added an OpenAI API for completions [packages/utils/apis/openai.ts]
        . Lowered numeric tolerance for test files
        Most commits will have less comments than this examples list.
        The last comment does not include the file names,
        because there were more than two relevant files in the hypothetical commit.
        Do not include parts of the example in your summary.
        Do not use any abrevation or punctuation like i am happy to provide or good question no comments like this just provide answer but the answer should be very descriptive covering each and every point
        Do not use Okay, I understand you're asking about but give direct answer
        It is given only as an example of appropriate comments.

        Please summarise the following diff file:

${diff}`;

  const response = await llm.invoke(prompt);
  return response.content as string;
};

export const summariseCode = async (doc: Document) => {
  const allowed = await checkRateLimit('code-summary', 10, 60);
  if (!allowed) {
    throw new Error('Rate limit exceeded for code summaries. Please try again later.');
  }
  try {
    const code = doc.pageContent.slice(0, 10000);
    const prompt = `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
            You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
            Here is the code:
            ---
            ${code}
            ---
            Give a summary no more than 100 words of the code above`;

    const response = await llm.invoke(prompt);
    return response.content as string;
  } catch (error) {
    console.error(error);
    return '';
  }
};

export const generateEmbedding = async (summary: string) => {
  const allowed = await checkRateLimit('embedding', 50, 60);
  if (!allowed) {
    throw new Error('Rate limit exceeded for embeddings generation. Please try again later.');
  }

  const result = await embeddingModel.embedQuery(summary);
  return result;
};

export async function askGemini(prompt: string): Promise<{ yaml?: string; tip?: string } | string> {
  const allowed = await checkRateLimit('ask-gemini', 5, 60);
  if (!allowed) {
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
    const localLlm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: apiKey,
      callbacks: tracer ? [tracer] : undefined,
    });

    const context = `
You are a professional DevOps engineer.
Generate a production-ready CI/CD YAML file based on the user's request.
Include a helpful tip at the end that starts with 'Tip:'.

User request: ${prompt}

Respond in this format:
1. YAML in a markdown code block (\`\`\`yaml ... \`\`\`)
2. Tip at the end
`;
    const result = await localLlm.invoke(context);
    const text = result.content as string;
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
