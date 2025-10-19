import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import FirecrawlApp from '@mendable/firecrawl-js';
import { LangChainTracer } from 'langchain/callbacks';
import { NextRequest, NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Hugging Face Image Generation
async function generateImage(prompt: string): Promise<{ imageUrl: string; error?: string }> {
  try {
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HF_API_KEY) {
      return { imageUrl: '', error: 'Hugging Face API key not configured' };
    }

    // Enhance the prompt for better image generation
    const enhancedPrompt = `high quality, detailed, professional: ${prompt}`;

    // Using Stable Diffusion model from Hugging Face
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          options: {
            wait_for_model: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      return { imageUrl: '', error: `Image generation failed: ${response.statusText}` };
    }

    // Convert response to base64
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return { imageUrl };
  } catch (error) {
    console.error('Error generating image:', error);
    return { imageUrl: '', error: 'Image generation failed' };
  }
}

// Multi-stage thinking with chain of thought
async function performExtendedThinking(
  question: string,
  context: string,
): Promise<{
  thinkingSteps: Array<{
    step: number;
    thought: string;
    duration: number;
    model: string;
    timestamp: string;
  }>;
  finalAnswer: string;
}> {
  const thinkingSteps: Array<{
    step: number;
    thought: string;
    duration: number;
    model: string;
    timestamp: string;
  }> = [];

  // Stage 1: Initial Analysis with Gemini Flash (fast)
  const stage1Start = Date.now();
  const stage1Model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
  });

  const stage1Prompt = `Analyze this question and provide initial thoughts. Break it down into key components and identify what needs to be addressed:

Question: ${question}
Context: ${context}

Provide a brief analysis (2-3 sentences) of the key aspects to consider.`;

  const stage1Response = await stage1Model.invoke([
    new SystemMessage('You are an analytical assistant. Provide concise, structured analysis.'),
    new HumanMessage(stage1Prompt),
  ]);

  const stage1Duration = (Date.now() - stage1Start) / 1000;
  thinkingSteps.push({
    step: 1,
    thought: stage1Response.content.toString(),
    duration: stage1Duration,
    model: 'Gemini 2.0 Flash (Analysis)',
    timestamp: new Date().toISOString(),
  });

  // Stage 2: Deep Reasoning with Qwen 2.5 72B (powerful)
  const stage2Start = Date.now();
  const stage2Model = new ChatOpenAI({
    apiKey: process.env.HUGGINGFACE_API_KEY!,
    modelName: 'Qwen/Qwen2.5-72B-Instruct',
    temperature: 0.8,
    configuration: {
      baseURL: 'https://api-inference.huggingface.co/models',
    },
  });

  const stage2Prompt = `Based on this analysis, think deeply about the problem:

Question: ${question}
Initial Analysis: ${stage1Response.content}
Context: ${context}

Provide detailed reasoning, consider edge cases, and think critically about the best approach. Be thorough but concise (3-4 sentences).`;

  let stage2Response;
  try {
    stage2Response = await stage2Model.invoke([
      new SystemMessage('You are a deep reasoning assistant. Think critically and thoroughly.'),
      new HumanMessage(stage2Prompt),
    ]);
  } catch {
    // Fallback to Gemini if Qwen fails
    console.warn('Stage 2 model failed, falling back to Gemini');
    stage2Response = await stage1Model.invoke([
      new SystemMessage('You are a deep reasoning assistant. Think critically and thoroughly.'),
      new HumanMessage(stage2Prompt),
    ]);
  }

  const stage2Duration = (Date.now() - stage2Start) / 1000;
  thinkingSteps.push({
    step: 2,
    thought: stage2Response.content.toString(),
    duration: stage2Duration,
    model: 'Qwen 2.5 72B (Deep Reasoning)',
    timestamp: new Date().toISOString(),
  });

  // Stage 3: Synthesis and Final Answer with Mistral (balanced)
  const stage3Start = Date.now();
  const stage3Model = new ChatOpenAI({
    apiKey: process.env.MISTRAL_API_KEY!,
    modelName: 'mistral-large-latest',
    temperature: 0.7,
    configuration: {
      baseURL: 'https://api.mistral.ai/v1',
    },
  });

  const stage3Prompt = `Synthesize the analysis and reasoning into a comprehensive final answer:

Question: ${question}
Initial Analysis: ${stage1Response.content}
Deep Reasoning: ${stage2Response.content}
Context: ${context}

Provide a complete, well-structured answer that addresses all aspects of the question. Include examples, code snippets if relevant, and best practices.`;

  let stage3Response;
  try {
    stage3Response = await stage3Model.invoke([
      new SystemMessage(
        'You are a synthesis assistant. Combine insights into comprehensive answers.',
      ),
      new HumanMessage(stage3Prompt),
    ]);
  } catch {
    // Fallback to Gemini if Mistral fails
    console.warn('Stage 3 model failed, falling back to Gemini');
    stage3Response = await stage1Model.invoke([
      new SystemMessage(
        'You are a synthesis assistant. Combine insights into comprehensive answers.',
      ),
      new HumanMessage(stage3Prompt),
    ]);
  }

  const stage3Duration = (Date.now() - stage3Start) / 1000;
  thinkingSteps.push({
    step: 3,
    thought: 'Synthesizing all insights into final comprehensive answer...',
    duration: stage3Duration,
    model: 'Mistral Large (Synthesis)',
    timestamp: new Date().toISOString(),
  });

  return {
    thinkingSteps,
    finalAnswer: stage3Response.content.toString(),
  };
}

// Initialize LangChain tracer
let tracer: LangChainTracer | null = null;
if (!tracer && process.env.LANGCHAIN_API_KEY) {
  tracer = new LangChainTracer({
    projectName: 'dionysus-ai-assistant',
  });
}

// Fetch user memories and survey data from database
async function getUserMemoryContext(userId: string): Promise<string> {
  try {
    const [memories, survey] = await Promise.all([
      db.userMemory.findMany({
        where: { userId },
        orderBy: { lastUsedAt: 'desc' },
        take: 20,
      }),
      db.survey.findUnique({
        where: { userId },
      }),
    ]);

    let context = '';

    // Add survey data if available
    if (survey) {
      context += '\n\nUSER PROFILE (From onboarding survey):';
      if (survey.companyName) context += `\n- Company: ${survey.companyName}`;
      if (survey.companySize) context += `\n- Company Size: ${survey.companySize}`;
      if (survey.industry) context += `\n- Industry: ${survey.industry}`;
      if (survey.role) context += `\n- Role: ${survey.role}`;
      if (survey.usagePurpose) context += `\n- Usage Purpose: ${survey.usagePurpose}`;
      if (survey.hearAboutUs) context += `\n- How they heard about us: ${survey.hearAboutUs}`;
      if (survey.expectedFeatures?.length)
        context += `\n- Expected Features: ${survey.expectedFeatures.join(', ')}`;
      if (survey.developmentExperience)
        context += `\n- Development Experience: ${survey.developmentExperience} years`;
      if (survey.githubExperience)
        context += `\n- GitHub Experience: ${survey.githubExperience} years`;
      if (survey.feedbackFrequency)
        context += `\n- Feedback Frequency: ${survey.feedbackFrequency}`;
      if (survey.additionalFeedback)
        context += `\n- Additional Feedback: ${survey.additionalFeedback}`;
    }

    // Add memories if available
    if (memories.length > 0) {
      context += '\n\nUSER MEMORY (Information learned from previous conversations):';

      const categorized: Record<string, typeof memories> = {};
      for (const memory of memories) {
        if (!categorized[memory.category]) {
          categorized[memory.category] = [];
        }
        categorized[memory.category]!.push(memory);
      }

      for (const [category, items] of Object.entries(categorized)) {
        context += `\n\n${category.toUpperCase()}:`;
        for (const item of items) {
          context += `\n- ${item.key}: ${item.value}`;
        }
      }
    }

    return context;
  } catch (error) {
    console.error('Error fetching user context:', error);
    return '';
  }
}

// Extract and store user information from conversations
async function extractAndStoreMemories(
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantResponse: string,
): Promise<void> {
  try {
    // Use AI to extract memorable information from the conversation
    const memoryExtractionPrompt = `Analyze this conversation and extract important, actionable information that should be remembered for future conversations. Focus on extracting high-quality, specific memories that would genuinely help personalize future interactions.

User Message: ${userMessage}
Assistant Response: ${assistantResponse}

Extract ONLY information that meets these criteria:
1. User preferences that affect how you should respond (e.g., "I prefer TypeScript over JavaScript")
2. Technical skills or experience level (e.g., "I'm new to React" or "I work with Python daily")
3. Specific tools, frameworks, or technologies they mentioned using
4. Project context or goals they're working toward
5. Communication preferences (e.g., "I prefer detailed explanations" or "Keep it concise")
6. Domain expertise or interests that could inform responses

IMPORTANT: Only extract information that is EXPLICITLY stated or STRONGLY implied. Do not make assumptions or infer preferences that aren't clearly indicated.

Format as JSON with this structure:
{"memories": [
  {"key": "specific_preference_or_fact", "value": "exact_detail_mentioned", "category": "preference|skill|tool|context|goal"}
]}

Examples of GOOD memories:
- {"key": "programming_language", "value": "TypeScript", "category": "skill"}
- {"key": "experience_level", "value": "senior_developer", "category": "skill"}
- {"key": "preferred_framework", "value": "Next.js", "category": "preference"}
- {"key": "current_project", "value": "building_ecommerce_site", "category": "context"}

Examples of BAD memories (don't extract these):
- Generic statements like "I like coding"
- Assumptions like "probably uses VS Code"
- Vague preferences like "I want good code"

If no high-quality, specific information exists to remember, return: {"memories": []}`;

    const extractionModel = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-2.5-flash',
      temperature: 0.3, // Low temperature for consistent extraction
    });

    const extractionResponse = await extractionModel.invoke([
      new SystemMessage(
        'You are a memory extraction assistant. Extract key information concisely.',
      ),
      new HumanMessage(memoryExtractionPrompt),
    ]);

    const responseText = extractionResponse.content.toString();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return;
    }

    const extracted = JSON.parse(jsonMatch[0]) as {
      memories: Array<{ key: string; value: string; category: string }>;
    };

    // Store extracted memories
    for (const memory of extracted.memories) {
      if (memory.key && memory.value) {
        await db.userMemory.upsert({
          where: {
            userId_key: {
              userId: userId,
              key: memory.key,
            },
          },
          create: {
            userId: userId,
            key: memory.key,
            value: memory.value,
            category: memory.category || 'general',
            source: sessionId,
            confidence: 0.8,
            lastUsedAt: new Date(),
          },
          update: {
            value: memory.value,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error extracting and storing memories:', error);
    // Don't throw - memory extraction is non-critical
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // For text files
  url?: string; // For images (base64 data URL)
}

// File validation constants
const MAX_FILES_PER_REQUEST = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Daily file upload limits per user
const dailyUploadLimits = new Map<
  string,
  { count: number; totalSize: number; resetTime: number }
>();

// File validation function
const validateFileAttachments = (
  attachments: FileAttachment[],
  userId: string,
): { isValid: boolean; error?: string } => {
  if (!attachments || attachments.length === 0) {
    return { isValid: true };
  }

  // Check file count limit
  if (attachments.length > MAX_FILES_PER_REQUEST) {
    return {
      isValid: false,
      error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files allowed per request.`,
    };
  }

  // Check individual file sizes and types
  let totalSize = 0;
  for (const attachment of attachments) {
    if (attachment.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File "${attachment.name}" is too large. Maximum size is 10MB.`,
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(attachment.type)) {
      return { isValid: false, error: `File type "${attachment.type}" is not supported.` };
    }

    totalSize += attachment.size;
  }

  // Check total size limit
  if (totalSize > MAX_TOTAL_SIZE) {
    return { isValid: false, error: `Total file size exceeds 50MB limit.` };
  }

  // Check daily limits
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const userLimit = dailyUploadLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset daily limit
    dailyUploadLimits.set(userId, {
      count: attachments.length,
      totalSize: totalSize,
      resetTime: now + oneDayMs,
    });
  } else {
    // Check if adding these files would exceed daily limits
    const maxDailyFiles = 50;
    const maxDailySize = 500 * 1024 * 1024; // 500MB per day

    if (userLimit.count + attachments.length > maxDailyFiles) {
      return {
        isValid: false,
        error: `Daily file upload limit exceeded. You can upload up to ${maxDailyFiles} files per day.`,
      };
    }

    if (userLimit.totalSize + totalSize > maxDailySize) {
      return {
        isValid: false,
        error: `Daily upload size limit exceeded. You can upload up to 500MB per day.`,
      };
    }

    // Update daily limits
    userLimit.count += attachments.length;
    userLimit.totalSize += totalSize;
  }

  return { isValid: true };
};

// AI Model Configuration
type AIModelId =
  | 'gemini-2.5-flash'
  | 'groq-llama-3.3-70b'
  | 'perplexity-sonar-pro'
  | 'openai/gpt-oss-120b'
  | 'qwen-2.5-72b'
  | 'qwen-2.5-32b'
  | 'mistral-large-latest'
  | 'deepseek/deepseek-r1-0528:free'
  | 'openai/gpt-oss-20b'
  | 'microsoft/mai-ds-r1:free'
  | 'moonshotai/kimi-k2:free'
  | 'moonshotai/kimi-dev-72b:free'
  | 'alibaba/tongyi-deepresearch-30b-a3b:free'
  | 'z-ai/glm-4.5-air:free'
  | 'qwen/qwen3-coder:free';
interface AIModelConfig {
  provider: string;
  modelName: string;
  temperature: number;
  apiKeyEnv: string;
}

const AI_MODEL_CONFIGS: Record<AIModelId, AIModelConfig> = {
  'gemini-2.5-flash': {
    provider: 'google',
    modelName: 'gemini-2.5-flash',
    temperature: 0.7,
    apiKeyEnv: 'GEMINI_API_KEY',
  },
  'groq-llama-3.3-70b': {
    provider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    apiKeyEnv: 'GROQ_API_KEY',
  },
  'perplexity-sonar-pro': {
    provider: 'openai-compatible',
    modelName: 'sonar-pro',
    temperature: 0.7,
    apiKeyEnv: 'PERPLEXITY_API_KEY',
  },
  'openai/gpt-oss-120b': {
    provider: 'groq',
    modelName: 'openai/gpt-oss-120b',
    temperature: 0.7,
    apiKeyEnv: 'GROQ_API_KEY',
  },
  'openai/gpt-oss-20b': {
    provider: 'openrouter',
    modelName: 'openai/gpt-oss-20b:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'moonshotai/kimi-k2:free': {
    provider: 'openrouter',
    modelName: 'moonshotai/kimi-k2:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'microsoft/mai-ds-r1:free': {
    provider: 'openrouter',
    modelName: 'microsoft/mai-ds-r1:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'z-ai/glm-4.5-air:free': {
    provider: 'openrouter',
    modelName: 'z-ai/glm-4.5-air:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'qwen-2.5-72b': {
    provider: 'huggingface',
    modelName: 'Qwen/Qwen2.5-72B-Instruct',
    temperature: 0.7,
    apiKeyEnv: 'HUGGINGFACE_API_KEY',
  },
  'qwen-2.5-32b': {
    provider: 'huggingface',
    modelName: 'Qwen/Qwen2.5-32B-Instruct',
    temperature: 0.7,
    apiKeyEnv: 'HUGGINGFACE_API_KEY',
  },
  'mistral-large-latest': {
    provider: 'mistral',
    modelName: 'mistral-large-latest',
    temperature: 0.7,
    apiKeyEnv: 'MISTRAL_API_KEY',
  },
  'deepseek/deepseek-r1-0528:free': {
    provider: 'openrouter',
    modelName: 'deepseek/deepseek-r1-0528:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'moonshotai/kimi-dev-72b:free': {
    provider: 'openrouter',
    modelName: 'moonshotai/kimi-dev-72b:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'alibaba/tongyi-deepresearch-30b-a3b:free': {
    provider: 'openrouter',
    modelName: 'alibaba/tongyi-deepresearch-30b-a3b:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'qwen/qwen3-coder:free': {
    provider: 'openrouter',
    modelName: 'qwen/qwen3-coder:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
};

// Initialize AI model based on selection
const initializeAIModel = (
  modelId: AIModelId = 'gemini-2.5-flash',
  isRegeneration: boolean = false,
) => {
  // Resolve model config and API key for the selected model
  const config = AI_MODEL_CONFIGS[modelId] || AI_MODEL_CONFIGS['gemini-2.5-flash'];
  const apiKey = process.env[config.apiKeyEnv];

  // Adjust temperature for regeneration to encourage more variety
  const adjustedTemperature = isRegeneration
    ? Math.min(config.temperature + 0.2, 1.0)
    : config.temperature;

  if (!apiKey) {
    console.warn(`API key for ${modelId} not found, falling back to Gemini`);
    // Fallback to Gemini if the selected model's API key is not available
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-2.5-flash',
      temperature: isRegeneration ? 0.7 : 0.5,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1500,
    });
  }

  switch (config.provider) {
    case 'google':
      return new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: config.modelName,
        temperature: adjustedTemperature,
        topP: 0.8,
        topK: 40,
      });

    case 'groq':
      return new ChatOpenAI({
        apiKey: apiKey,
        modelName: config.modelName,
        temperature: adjustedTemperature,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1',
        },
      });

    case 'openai-compatible':
      const baseURLs: Record<string, string> = {
        'perplexity-sonar-pro': 'https://api.perplexity.ai',
      };

      return new ChatOpenAI({
        apiKey: apiKey,
        modelName: config.modelName,
        temperature: adjustedTemperature,
        configuration: {
          baseURL: baseURLs[modelId] || 'https://api.openai.com/v1',
        },
      });

    case 'qwen':
      return new ChatOpenAI({
        apiKey: apiKey,
        modelName: config.modelName,
        temperature: adjustedTemperature,
        configuration: {
          baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
      });

    case 'mistral':
      return new ChatOpenAI({
        apiKey: apiKey,
        modelName: config.modelName,
        temperature: adjustedTemperature,
        configuration: {
          baseURL: 'https://api.mistral.ai/v1',
        },
      });

    case 'openrouter':
      return new ChatOpenAI({
        apiKey: apiKey,
        modelName: config.modelName,
        temperature: adjustedTemperature,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      });

    default:
      // Fallback to Gemini
      return new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY!,
        model: 'gemini-2.5-flash',
        temperature: isRegeneration ? 0.9 : 0.7,
        topP: 0.8,
        topK: 40,
      });
  }
};

// Process file attachments for AI context
const processFileAttachments = (attachments: FileAttachment[]): string => {
  if (!attachments || attachments.length === 0) {
    return '';
  }

  let context = '\n\n--- ATTACHED FILES ---\n';

  for (const attachment of attachments) {
    context += `\nFile: ${attachment.name} (${attachment.type}, ${attachment.size} bytes)\n`;

    if (attachment.content) {
      // Check if it's a base64 image
      if (attachment.type.startsWith('image/') && attachment.content.startsWith('data:')) {
        context += `Content: [Image file - base64 encoded visual content provided for analysis]\n`;
      } else {
        // Sanitize file content to prevent injection attacks
        const sanitizedContent = sanitizeInput(attachment.content);

        // Additional security: scan for suspicious patterns
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /vbscript:/i,
          /on\w+=/i,
          /eval\(/i,
          /document\./i,
          /window\./i,
          /alert\(/i,
        ];

        const hasSuspiciousContent = suspiciousPatterns.some((pattern) =>
          pattern.test(sanitizedContent),
        );

        if (hasSuspiciousContent) {
          context += `Content: [File content filtered for security]\n`;
        } else {
          // For text files, include the content (truncated for safety)
          context += `Content: ${sanitizedContent.substring(0, 2000)}${sanitizedContent.length > 2000 ? '...[truncated]' : ''}\n`;
        }
      }
    } else if (attachment.url && attachment.type.startsWith('image/')) {
      // For images with URL (legacy support)
      context += `Content: [Image file - visual content]\n`;
    } else {
      // For other files, just note the metadata
      context += `Content: [Binary file - metadata only]\n`;
    }
  }

  context += '\n--- END ATTACHED FILES ---\n';
  return context;
};

// Rate limiting cache (in production, use Redis or database)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const fileUploadRateLimit = new Map<string, { count: number; resetTime: number }>();

// Security function to sanitize input
const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Use sanitize-html to thoroughly remove scripts, iframes, event handlers, etc.
  const sanitized = sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      span: ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    // Remove all other tags, attributes, protocols
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  });
  return sanitized.trim().substring(0, 5000); // Limit input length
};

// Enhanced rate limiting function with separate file upload limits
const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const maxRequestsPerHour = 50;

  const userLimit = rateLimitCache.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitCache.set(userId, { count: 1, resetTime: now + hourInMs });
    return true;
  }

  if (userLimit.count >= maxRequestsPerHour) {
    return false;
  }

  userLimit.count++;
  return true;
};

// File upload rate limiting (separate from general API rate limiting)
const checkFileUploadRateLimit = (userId: string, hasFiles: boolean): boolean => {
  if (!hasFiles) return true; // No files, no special rate limit needed

  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const maxFileUploadsPerHour = 20; // More restrictive for file uploads

  const userLimit = fileUploadRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    fileUploadRateLimit.set(userId, { count: 1, resetTime: now + hourInMs });
    return true;
  }

  if (userLimit.count >= maxFileUploadsPerHour) {
    return false;
  }

  userLimit.count++;
  return true;
};

// Validate platform relevance
const validatePlatformRelevance = (question: string): boolean => {
  const sanitized = question.toLowerCase();

  // Block obvious off-topic patterns
  const offTopicPatterns = [
    /weather|temperature|forecast/,
    /recipe|cooking|food|meal/,
    /movie|film|entertainment/,
    /sports|football|basketball/,
    /politics|politician|election/,
    /medical|health|doctor|medicine/,
    /legal|lawyer|law/,
    /dating|relationship|romance/,
    /homework|essay|assignment/,
    /crypto|bitcoin|trading/,
  ];

  return !offTopicPatterns.some((pattern) => pattern.test(sanitized));
};

// Check if a question requires web search
const requiresWebSearch = (question: string): boolean => {
  const searchIndicators = [
    // Explicit search requests
    'search for',
    'find',
    'look up',
    'show me',
    'recommend',
    'suggest',
    'best',
    'top',
    'latest',
    'current',
    'recent',
    'new',
    'popular',
    'trending',
    // Question types that benefit from current info
    'tutorial',
    'guide',
    'example',
    'documentation',
    'how to',
    'what is',
    'how does',
    'youtube',
    'video',
    'course',
    'learning',
    'resource',
    'tool',
    'library',
    'framework',
    'technology',
    'compare',
    'vs',
    'versus',
    'difference',
    'alternative',
    'option',
    // Development specific
    'react',
    'next.js',
    'typescript',
    'javascript',
    'node.js',
    'api',
    'github',
    'git',
    'deployment',
    'hosting',
    'database',
    'sql',
    'nosql',
    'mongodb',
    'postgresql',
    'prisma',
    'docker',
    'kubernetes',
    'aws',
    'vercel',
    'netlify',
  ];

  const lowerQuestion = question.toLowerCase();

  // Check for explicit search indicators
  const hasSearchIndicator = searchIndicators.some((indicator) =>
    lowerQuestion.includes(indicator),
  );

  // Also search for questions that are general enough to benefit from current info
  const isGeneralQuestion =
    question.length > 20 &&
    (lowerQuestion.includes('?') ||
      lowerQuestion.startsWith('how') ||
      lowerQuestion.startsWith('what') ||
      lowerQuestion.startsWith('where') ||
      lowerQuestion.startsWith('when') ||
      lowerQuestion.startsWith('why') ||
      lowerQuestion.startsWith('which'));

  return hasSearchIndicator || isGeneralQuestion;
};

// Perform web search using Firecrawl
const performWebSearch = async (query: string): Promise<{ content: string; sources: string[] }> => {
  try {
    if (!process.env.FIRECRAWL_API_KEY) {
      return { content: '', sources: [] };
    }

    // Search for relevant documentation and resources
    const searchQueries = [];

    // Create more targeted search queries based on the question content
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('react') || lowerQuery.includes('component')) {
      searchQueries.push(`${query} React documentation tutorial`);
      searchQueries.push(`${query} React examples GitHub`);
    } else if (lowerQuery.includes('next') || lowerQuery.includes('nextjs')) {
      searchQueries.push(`${query} Next.js documentation`);
      searchQueries.push(`${query} Next.js tutorial 2024`);
    } else if (lowerQuery.includes('typescript') || lowerQuery.includes('ts')) {
      searchQueries.push(`${query} TypeScript documentation`);
      searchQueries.push(`${query} TypeScript examples`);
    } else if (
      lowerQuery.includes('youtube') ||
      lowerQuery.includes('video') ||
      lowerQuery.includes('tutorial')
    ) {
      searchQueries.push(`${query} YouTube tutorial 2024`);
      searchQueries.push(`${query} video guide`);
    } else if (lowerQuery.includes('github') || lowerQuery.includes('repository')) {
      searchQueries.push(`${query} GitHub repository`);
      searchQueries.push(`${query} open source examples`);
    } else {
      // Generic searches for other topics
      searchQueries.push(`${query} documentation tutorial`);
      searchQueries.push(`${query} examples guide 2024`);
    }

    // Add a general search if we don't have enough queries
    if (searchQueries.length < 2) {
      searchQueries.push(`${query} best practices`);
    }

    const searchResults: { content: string; sources: string[] } = { content: '', sources: [] };

    // Search with the generated queries
    for (const searchQuery of searchQueries.slice(0, 3)) {
      try {
        const searchResponse = await firecrawl.search(searchQuery, {
          limit: 3,
        });

        if (searchResponse && Array.isArray(searchResponse)) {
          for (const result of searchResponse) {
            if (result.content && result.url) {
              searchResults.content += `\n\nSOURCE: ${result.url}\n`;
              searchResults.content += `TITLE: ${result.title || 'No title'}\n`;
              searchResults.content += `CONTENT: ${result.content.substring(0, 1000)}...\n`;
              searchResults.sources.push(result.url);
            }
          }
        }
      } catch (searchError) {
        console.error('Search error:', searchError);
        // Continue with other searches
      }
    }

    return searchResults;
  } catch (error) {
    console.error('Web search error:', error);
    return { content: '', sources: [] };
  }
};

export async function POST(request: NextRequest) {
  try {
    // Check request origin for CSRF protection
    const origin = request.headers.get('origin');
    const allowedOrigins = [process.env.NEXT_PUBLIC_BASE_URL].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const {
      question,
      context,
      conversationHistory,
      platform,
      attachments,
      userInfo,
      model: selectedModel,
      isRegeneration,
      features,
      sessionId,
    } = await request.json();
    const { userId, has } = await auth();

    // Authentication check
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use the AI assistant.' },
        { status: 401 },
      );
    }

    if (
      selectedModel === 'perplexity-sonar-pro' ||
      selectedModel === 'deepseek/deepseek-r1-0528:free' ||
      selectedModel === 'microsoft/mai-ds-r1:free' ||
      selectedModel === 'openai/gpt-oss-120b'
    ) {
      const hasProPlan =
        has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

      if (!hasProPlan) {
        return NextResponse.json(
          {
            error:
              'Perplexity AI model is available for Premium users only. Please upgrade to access this feature.',
          },
          { status: 403 },
        );
      }
    }

    // Rate limiting (general API and file uploads)
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 },
      );
    }

    if (!checkFileUploadRateLimit(userId, !!(attachments && attachments.length > 0))) {
      return NextResponse.json(
        { error: 'File upload rate limit exceeded. Please try again later.' },
        { status: 429 },
      );
    }

    // Validate file attachments first (before other validations)
    if (attachments) {
      const fileValidation = validateFileAttachments(attachments, userId);
      if (!fileValidation.isValid) {
        // Log potential abuse attempts
        console.warn(`File upload rejected for user ${userId}: ${fileValidation.error}`, {
          userId,
          attachmentCount: attachments.length,
          totalSize: attachments.reduce((sum: number, file: FileAttachment) => sum + file.size, 0),
          fileTypes: attachments.map((file: FileAttachment) => file.type),
        });

        return NextResponse.json({ error: fileValidation.error }, { status: 400 });
      }

      // Log successful file uploads for monitoring
      console.log(`File upload accepted for user ${userId}`, {
        userId,
        attachmentCount: attachments.length,
        totalSize: attachments.reduce((sum: number, file: FileAttachment) => sum + file.size, 0),
        fileTypes: attachments.map((file: FileAttachment) => file.type),
      });
    }

    // Input validation
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Valid question is required' }, { status: 400 });
    }

    if (!context || typeof context !== 'string') {
      return NextResponse.json({ error: 'Page context is required' }, { status: 400 });
    }

    // Platform validation
    if (platform !== 'dionysus') {
      return NextResponse.json({ error: 'Invalid platform identifier' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedQuestion = sanitizeInput(question);
    const sanitizedContext = sanitizeInput(context);

    // Validate question length
    if (sanitizedQuestion.length < 3 || sanitizedQuestion.length > 2000) {
      return NextResponse.json(
        { error: 'Question must be between 3 and 2000 characters' },
        { status: 400 },
      );
    }

    // Check platform relevance
    if (!validatePlatformRelevance(sanitizedQuestion)) {
      return NextResponse.json(
        { error: 'Please ask questions related to the Dionysus platform or development topics.' },
        { status: 400 },
      );
    }

    // Initialize LangChain model based on user selection
    const modelId = (selectedModel as AIModelId) || 'gemini-2.5-flash';
    const model = initializeAIModel(modelId, isRegeneration || false);

    // Fetch user memory context from database
    const userMemoryContext = await getUserMemoryContext(userId);

    // Check if web search is needed
    const needsWebSearch = requiresWebSearch(sanitizedQuestion);
    let webSearchContent = '';
    let sources: string[] = [];

    if (needsWebSearch) {
      const searchResults = await performWebSearch(sanitizedQuestion);
      webSearchContent = searchResults.content;
      sources = searchResults.sources;
    }

    // Build sanitized conversation history
    let conversationContext = '';
    if (
      conversationHistory &&
      Array.isArray(conversationHistory) &&
      conversationHistory.length > 0
    ) {
      conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
      conversationHistory.slice(-10).forEach((msg: Message) => {
        if (msg.role && msg.content && typeof msg.content === 'string') {
          const sanitizedContent = sanitizeInput(msg.content);
          conversationContext += `${msg.role.toUpperCase()}: ${sanitizedContent}\n`;
        }
      });
    }

    // Process file attachments
    const attachmentContext = processFileAttachments(attachments);

    // Build user context for personalization
    let userContext = '';
    if (userInfo) {
      userContext = '\n\nUSER INFORMATION (for personalization):';
      if (userInfo.fullName || userInfo.firstName) {
        userContext += `\n- Name: ${userInfo.fullName || userInfo.firstName + (userInfo.lastName ? ' ' + userInfo.lastName : '')}`;
      }
      if (userInfo.email) {
        userContext += `\n- Email: ${userInfo.email}`;
      }
      if (userInfo.username) {
        userContext += `\n- Username: ${userInfo.username}`;
      }
      userContext +=
        '\n- Use this information to personalize responses (e.g., address the user by name when appropriate)';
    }

    // Check if features are enabled
    const hasImageGeneration = features?.includes('generate-image');
    const hasExtendedThinking = features?.includes('extended-thinking');
    const hasStudyLearn = features?.includes('study-learn');

    // Build feature-specific instructions
    let featureInstructions = '';
    if (hasImageGeneration) {
      featureInstructions += `\n\n🎨 IMAGE GENERATION MODE ACTIVATED:
- The user has requested image generation along with their query
- If their question involves creating, visualizing, or designing something visual, acknowledge this
- Describe what kind of image would be generated based on their request
- Note: An image will be automatically generated based on the conversation context`;
    }

    if (hasExtendedThinking) {
      featureInstructions += `\n\n🧠 EXTENDED THINKING MODE ACTIVATED:
- Take extra time to deeply analyze the question from multiple angles
- Break down complex problems into smaller components
- Consider edge cases, potential issues, and alternative approaches
- Provide step-by-step reasoning for your conclusions
- Show your thought process and reasoning chain
- Be more thorough and comprehensive than usual
- Think critically and challenge assumptions
- Provide detailed explanations with supporting evidence`;
    }

    if (hasStudyLearn) {
      featureInstructions += `\n\n📚 STUDY & LEARN MODE ACTIVATED:
- Structure your response as an educational lesson
- Start with fundamental concepts and build up to advanced topics
- Include clear explanations with real-world examples
- Provide code examples where applicable with detailed comments
- Add practical exercises or challenges for the user to try
- Suggest additional resources for deeper learning
- Use analogies and metaphors to explain complex concepts
- Create a learning roadmap if the topic is extensive
- Include best practices and common pitfalls to avoid
- End with key takeaways and summary points`;
    }

    const systemPrompt = `You are an intelligent AI assistant for the Dionysus platform - an enterprise GitHub analytics and collaboration SaaS platform built with Next.js, TypeScript, tRPC, Prisma, and PostgreSQL. You provide AI-powered code analysis, meeting transcription, team collaboration, and comprehensive repository insights.

${isRegeneration ? `REGENERATION MODE: This is a regenerated response. The user was not satisfied with the previous answer. Provide a significantly improved, more comprehensive, and alternative response. Consider different approaches, additional details, examples, or perspectives that weren't covered in the previous response. Be more thorough and helpful than usual.` : ''}

${featureInstructions}

IMPORTANT CAPABILITIES:
- You have access to real-time web search through Firecrawl
- You can search for current information, documentation, tutorials, and resources
- You can find and recommend specific YouTube videos, GitHub repositories, and other resources
- You can provide up-to-date information about technologies, frameworks, and best practices
- You can analyze attached files including text documents, images, and code files
- You can reference file contents in your responses when relevant

STRICT GUIDELINES:
- ONLY answer questions related to the Dionysus platform, development, coding, GitHub, or the current page
- Do NOT provide information about: weather, recipes, movies, sports, politics, medical advice, legal advice, personal relationships, homework help, or any non-development topics
- If asked about off-topic subjects, politely redirect to platform-related topics
- Keep responses concise and helpful
- Use markdown formatting for better readability
- Be specific about the current page functionality when possible
- Focus on what users can see and do on the current page
- When providing information from web sources, always cite the sources at the end
- If web search results are available, incorporate them into your response and provide source citations
- Feel free to recommend specific tutorials, videos, documentation, and resources when relevant
- You can search for and find current, specific recommendations rather than giving generic advice
- When files are attached, analyze their content and incorporate insights into your response
- For code files, provide suggestions for improvement, explain functionality, or help debug issues
- For images, describe what you see and how it relates to the user's question
- For documents, summarize key points and relate them to the query

FOLLOW-UP QUESTIONS:
- After providing your main response, ALWAYS generate 2-4 relevant follow-up questions that the user might want to ask next
- These questions should be natural continuations that help explore the topic deeper and provide practical value
- IMPORTANT: Do NOT include these follow-up questions anywhere in your visible response text
- Instead, append them as a JSON array at the very end of your response, after all other content
- The JSON array should be on its own line and use this exact format: ["Question 1?", "Question 2?", "Question 3?"]
- Make questions specific to Dionysus features, development workflows, or the current context
- Focus on questions that would genuinely help the user accomplish their goals or learn more
- Prefer actionable questions over generic ones (e.g., "How do I set up X?" instead of "What is X?")
- Consider the user's current activity and what they might want to do next
- The user will NOT see this JSON array - it will be automatically parsed and displayed as clickable buttons

IMPORTANT CONVERSATION CONTEXT:
- You are continuing an ongoing conversation with the user
- Review the previous conversation history to maintain context and avoid repetitive greetings
- Only greet the user if this is clearly the start of a new conversation (no previous messages)
- Build upon previous topics discussed rather than starting fresh each time
- Reference earlier parts of the conversation when relevant
- Avoid direct greeting every time like with hello or anything just to be safe so use like So, Saksham how can I assist you intead of Hello, Saksham how can I assist you
- Avoid saying users full name again and again instead try using just the first name more
- If the user has been asking about specific topics, continue that thread naturally
- Important: Do not again and again greet or acknowledge the user it's an ongoing conversation so be to the point
- Dionysus is made by Saksham Goel his github profile is at https://github.com/saksham-goel1107 and the project github repo is at https://github.com/saksham-goel1107/dionysus and the website is at https://dionysus-gray.vercel.app and it's support page is at https://dionysus-gray.vercel.app/support

CURRENT PAGE INFORMATION:
${sanitizedContext}

${conversationContext}

${attachmentContext}

${userContext}

${userMemoryContext}

${webSearchContent ? `\n\nWEB SEARCH RESULTS:\n${webSearchContent}\n` : ''}

Provide a helpful response about the Dionysus platform or development topics based on the current page context${attachmentContext ? ', attached files,' : ''}${webSearchContent ? ' and web search results' : ''}. Remember, you have web search capabilities and can find specific, current resources and recommendations.

CRITICAL: End your response with a JSON array of 2-4 high-quality follow-up questions in this exact format: ["Question 1?", "Question 2?", "Question 3?"]
This JSON array MUST be on its own line at the very end, after all other content. It will be automatically removed from your visible response and displayed as clickable buttons. Do NOT mention these questions anywhere in your main response text.`;

    // Prepare messages with proper multimodal support
    const systemMessage = new SystemMessage(systemPrompt);

    // Check if we have image attachments to include directly in the message
    interface ImageAttachment extends FileAttachment {
      content: string; // base64 data URL required for images
    }

    const imageAttachments: ImageAttachment[] =
      attachments?.filter(
        (attachment: FileAttachment): attachment is ImageAttachment =>
          attachment.type.startsWith('image/') &&
          typeof attachment.content === 'string' &&
          attachment.content.startsWith('data:'),
      ) ?? [];

    let userMessage: HumanMessage;

    if (imageAttachments && imageAttachments.length > 0) {
      // For multimodal input, create content array with text and images
      const content = [
        {
          type: 'text',
          text: sanitizedQuestion,
        },
        ...imageAttachments.map((attachment) => ({
          type: 'image_url',
          image_url: {
            url: attachment.content, // base64 data URL
          },
        })),
      ];

      userMessage = new HumanMessage({ content });
    } else {
      // Text-only message
      userMessage = new HumanMessage(sanitizedQuestion);
    }

    const messages = [systemMessage, userMessage];

    try {
      // Handle extended thinking mode
      if (hasExtendedThinking) {
        // Create a streaming response for extended thinking
        const readableStream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();

            try {
              // Send thinking start signal
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'thinking', timestamp: new Date().toISOString() })}\n\n`,
                ),
              );

              // Perform multi-stage thinking
              const thinkingResult = await performExtendedThinking(
                sanitizedQuestion,
                sanitizedContext,
              );

              // Stream each thinking step to the client
              for (const step of thinkingResult.thinkingSteps) {
                const stepData = JSON.stringify({
                  type: 'thinkingStep',
                  ...step,
                });
                controller.enqueue(encoder.encode(`data: ${stepData}\n\n`));
              }

              // Send thinking complete signal
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'thinkingComplete', timestamp: new Date().toISOString() })}\n\n`,
                ),
              );

              // Stream the final answer
              const words = thinkingResult.finalAnswer.split(' ');
              let currentText = '';

              for (const word of words) {
                currentText += (currentText ? ' ' : '') + word;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'chunk', content: word + ' ', timestamp: new Date().toISOString() })}\n\n`,
                  ),
                );
                // Small delay to simulate streaming
                await new Promise((resolve) => setTimeout(resolve, 50));
              }

              // Send sources if we have them
              if (sources.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'sources', sources, timestamp: new Date().toISOString() })}\n\n`,
                  ),
                );
              }

              // Handle image generation if requested
              if (hasImageGeneration) {
                try {
                  const imagePrompt =
                    sanitizedQuestion.length > 100
                      ? sanitizedQuestion.substring(0, 100)
                      : sanitizedQuestion;
                  const imageResult = await generateImage(imagePrompt);

                  if (imageResult.imageUrl && !imageResult.error) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'image', imageUrl: imageResult.imageUrl, timestamp: new Date().toISOString() })}\n\n`,
                      ),
                    );
                  } else if (imageResult.error) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'imageError', error: imageResult.error, timestamp: new Date().toISOString() })}\n\n`,
                      ),
                    );
                  }
                } catch (imageError) {
                  console.error('Image generation error:', imageError);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'imageError', error: 'Image generation failed', timestamp: new Date().toISOString() })}\n\n`,
                    ),
                  );
                }
              }

              // Send completion
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'complete', fullResponse: thinkingResult.finalAnswer, sources, timestamp: new Date().toISOString() })}\n\n`,
                ),
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (error) {
              console.error('Extended thinking error:', error);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', error: 'Extended thinking failed', timestamp: new Date().toISOString() })}\n\n`,
                ),
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      // Create streaming response (normal mode without extended thinking)
      const stream = await model.stream(messages, { callbacks: tracer ? [tracer] : undefined });

      // Create a readable stream
      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            let fullResponse = '';

            for await (const chunk of stream) {
              const content = chunk.content || chunk.text || '';
              fullResponse += content;

              // Send chunk to client
              const data = JSON.stringify({
                type: 'chunk',
                content: content,
                timestamp: new Date().toISOString(),
              });

              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Parse follow-up questions from the response
            let followUpQuestions: string[] = [];
            let cleanResponse = fullResponse;

            console.log('AI Response before parsing:', fullResponse);

            try {
              // Multiple parsing strategies for robustness

              // Strategy 1: Look for JSON array pattern anywhere in the response
              const jsonArrayRegex = /\[(\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*)\]$/;
              let match = fullResponse.match(jsonArrayRegex);

              if (match) {
                try {
                  const jsonString = match[0];
                  const parsed = JSON.parse(jsonString);
                  if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
                    followUpQuestions = parsed;
                    cleanResponse = fullResponse.replace(jsonArrayRegex, '').trim();
                    console.log(
                      'Successfully parsed follow-up questions (strategy 1):',
                      followUpQuestions,
                    );
                  }
                } catch (e) {
                  console.warn('Strategy 1 parsing failed:', e);
                }
              }

              // Strategy 2: Look for code blocks with arrays
              if (followUpQuestions.length === 0) {
                const codeBlockRegex = /```(?:json|javascript|js)?\s*\n?(\[[\s\S]*?\])\s*\n?```/;
                match = fullResponse.match(codeBlockRegex);

                if (match) {
                  try {
                    const jsonString = match[1];
                    const parsed = JSON.parse(jsonString);
                    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
                      followUpQuestions = parsed;
                      cleanResponse = fullResponse.replace(codeBlockRegex, '').trim();
                      console.log(
                        'Successfully parsed follow-up questions (strategy 2):',
                        followUpQuestions,
                      );
                    }
                  } catch (e) {
                    console.warn('Strategy 2 parsing failed:', e);
                  }
                }
              }

              // Strategy 3: Look for JSON array at the end of the response (original logic)
              if (followUpQuestions.length === 0) {
                const responseLines = fullResponse.trim().split('\n');
                const lastLine = responseLines[responseLines.length - 1];

                if (lastLine && lastLine.startsWith('[') && lastLine.endsWith(']')) {
                  try {
                    const parsed = JSON.parse(lastLine);
                    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
                      followUpQuestions = parsed;
                      cleanResponse = responseLines.slice(0, -1).join('\n').trim();
                      console.log(
                        'Successfully parsed follow-up questions (strategy 3):',
                        followUpQuestions,
                      );
                    }
                  } catch (e) {
                    console.warn('Strategy 3 parsing failed:', e);
                  }
                }
              }

              // Strategy 4: Look for numbered or bulleted list that might be questions
              if (followUpQuestions.length === 0) {
                const lines = fullResponse.split('\n');
                const potentialQuestions: string[] = [];

                for (const line of lines) {
                  const trimmed = line.trim();
                  // Look for lines that start with numbers, bullets, or question marks
                  if (
                    /^\d+\.\s*.+\?/.test(trimmed) || // 1. Question?
                    /^[•\-*]\s*.+\?/.test(trimmed) || // • Question?
                    (trimmed.endsWith('?') && trimmed.length > 10) // Long question lines
                  ) {
                    // Clean up the question
                    let question = trimmed
                      .replace(/^\d+\.\s*/, '') // Remove numbering
                      .replace(/^[•\-*]\s*/, '') // Remove bullets
                      .trim();

                    if (question && question.endsWith('?')) {
                      potentialQuestions.push(question);
                    }
                  }
                }

                if (potentialQuestions.length >= 2 && potentialQuestions.length <= 4) {
                  followUpQuestions = potentialQuestions;
                  // Remove the questions from the response
                  let tempResponse = fullResponse;
                  for (const question of potentialQuestions) {
                    // Remove the line containing this question
                    const questionRegex = new RegExp(
                      `^.*${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`,
                      'gm',
                    );
                    tempResponse = tempResponse.replace(questionRegex, '').trim();
                  }
                  cleanResponse = tempResponse;
                  console.log(
                    'Successfully parsed follow-up questions (strategy 4):',
                    followUpQuestions,
                  );
                }
              }

              console.log('Clean response:', cleanResponse);
            } catch (parseError) {
              console.warn('Failed to parse follow-up questions:', parseError);
              // If parsing fails completely, keep the original response
            }

            // Send sources if we have them
            if (sources.length > 0) {
              const sourcesData = JSON.stringify({
                type: 'sources',
                sources: sources,
                timestamp: new Date().toISOString(),
              });

              controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
            }

            // Send follow-up questions if we have them
            if (followUpQuestions.length > 0) {
              const followUpData = JSON.stringify({
                type: 'followUpQuestions',
                followUpQuestions: followUpQuestions,
                timestamp: new Date().toISOString(),
              });

              controller.enqueue(encoder.encode(`data: ${followUpData}\n\n`));
            }

            // Handle image generation if requested
            let generatedImageUrl: string | undefined;
            if (hasImageGeneration) {
              try {
                // Extract a good image prompt from the conversation
                // Use the user's question and the AI's response to create a descriptive prompt
                const imagePrompt =
                  sanitizedQuestion.length > 100
                    ? sanitizedQuestion.substring(0, 100)
                    : sanitizedQuestion;

                const imageResult = await generateImage(imagePrompt);

                if (imageResult.imageUrl && !imageResult.error) {
                  generatedImageUrl = imageResult.imageUrl;

                  // Send image generation success
                  const imageData = JSON.stringify({
                    type: 'image',
                    imageUrl: generatedImageUrl,
                    timestamp: new Date().toISOString(),
                  });

                  controller.enqueue(encoder.encode(`data: ${imageData}\n\n`));
                } else if (imageResult.error) {
                  // Send image generation error
                  const imageErrorData = JSON.stringify({
                    type: 'imageError',
                    error: imageResult.error,
                    timestamp: new Date().toISOString(),
                  });

                  controller.enqueue(encoder.encode(`data: ${imageErrorData}\n\n`));
                }
              } catch (imageError) {
                console.error('Image generation error:', imageError);
                // Don't fail the entire request if image generation fails
                const imageErrorData = JSON.stringify({
                  type: 'imageError',
                  error: 'Image generation failed',
                  timestamp: new Date().toISOString(),
                });

                controller.enqueue(encoder.encode(`data: ${imageErrorData}\n\n`));
              }
            }

            // Send completion signal
            const completeData = JSON.stringify({
              type: 'complete',
              fullResponse: sanitizeInput(cleanResponse),
              sources: sources,
              followUpQuestions: followUpQuestions,
              imageUrl: generatedImageUrl,
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));

            // Extract and store user memories in the background (non-blocking)
            if (sessionId) {
              extractAndStoreMemories(userId, sessionId, sanitizedQuestion, cleanResponse).catch(
                (err) => {
                  console.error('Background memory extraction failed:', err);
                },
              );
            }
          } catch (streamError) {
            console.error('Streaming error:', streamError);
            const errorData = JSON.stringify({
              type: 'error',
              error: 'Streaming failed',
              timestamp: new Date().toISOString(),
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (err) {
      console.error('LangChain streaming error:', err);
      throw err;
    }
  } catch (error) {
    console.error('Error in AI assistant API:', error);

    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 },
    );
  }
}
