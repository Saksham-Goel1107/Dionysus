import { GoogleGenerativeAI } from '@google/generative-ai';
import { LangChainTracer } from 'langchain/callbacks';
import { Document } from '@langchain/core/documents';
import { Redis } from 'ioredis';

let redis: Redis | null = null;
let tracer: LangChainTracer | null = null;
const inMemoryStore: Map<string, { count: number; expires: number }> = new Map();
let redisEnabled = false;

if (process.env.REDIS_URL || process.env.REDIS_URL_NEW) {
  try {
    let redisUrl = process.env.REDIS_URL || process.env.REDIS_URL_NEW || '';

    try {
      redisUrl = decodeURIComponent(redisUrl).trim();
    } catch (e) {
      redisUrl = redisUrl.replace(/%20/g, ' ').trim();
    }

    if (redisUrl.includes('upstash.io')) {
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

    console.log('Attempting to connect to Redis in gemini.ts with URL:', redisUrl.replace(/redis:\/\/.*?@/, 'redis://***:***@')); // Log sanitized URL

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      enableOfflineQueue: true,
      enableReadyCheck: true,
      keepAlive: 10000, 
      family: 0,        
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return 2;
        }
        return 1;
      },
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn(`Redis connection failed after ${times} attempts in gemini.ts, falling back to in-memory store`);
          return null; 
        }
        const delay = Math.min(times * 500, 5000);
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

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
        const current = await redis.incr(identifier);

        if (current === 1) {
          await redis.expire(identifier, windowInSeconds);
        }

        isAllowed = current <= limit;
      } catch (redisError: any) {
        console.warn(
          `Redis rate limit operation failed in gemini.ts: ${redisError.message || redisError}`,
        );
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

  const prompt = [
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
        . Moved the \'octokit\' initialization to a separate file [src/ootokit.ts], [src/index.ts]
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
  ];

  const response = await model.generateContent(prompt);
  return response.response.text();
};

export const summariseCode = async (doc: Document) => {
  const allowed = await checkRateLimit('code-summary', 10, 60);
  if (!allowed) {
    throw new Error('Rate limit exceeded for code summaries. Please try again later.');
  }
  try {
    const code = doc.pageContent.slice(0, 10000);
    const prompt = [
      `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
      `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
            Here is the code:
            ---
            ${code}
            ---
            Give a summary no more than 100 words of the code above`,
    ];

    const response = await model.generateContent(prompt);
    return response.response.text();
  } catch (error) {
    return '';
  }
};

export const generateEmbedding = async (summary: string) => {
  const allowed = await checkRateLimit('embedding', 50, 60);
  if (!allowed) {
    throw new Error('Rate limit exceeded for embeddings generation. Please try again later.');
  }

  const embeddingModel = genAI.getGenerativeModel({
    model: 'text-embedding-004',
  });

  const result = await embeddingModel.embedContent(summary);
  const embedding = result.embedding;
  return embedding.values;
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
    const localGenAI = new GoogleGenerativeAI(apiKey);
    const localModel = localGenAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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
    const result = await localModel.generateContent(context);
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
