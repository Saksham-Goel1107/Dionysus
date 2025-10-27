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

// Model caching for faster initialization
const modelCache = new Map<string, any>();
const MODEL_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Memory context caching
const memoryCache = new Map<string, { context: string; timestamp: number }>();
const MEMORY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Response caching for similar questions
const responseCache = new Map<string, { response: string; sources: string[]; timestamp: number }>();
const RESPONSE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

// Multi-stage thinking with chain of thought (optimized for speed and reliability with powerful models)
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

  // Available super powerful models for extended thinking
  const superPowerfulModels: AIModelId[] = [
    'perplexity-sonar-pro', // Most powerful for analysis
    'deepseek/deepseek-r1-0528:free', // Excellent reasoning
    'microsoft/mai-ds-r1:free', // Advanced reasoning
    'meta-llama/llama-4-maverick:free', // Powerful general AI
    'nousresearch/hermes-3-llama-3.1-405b:free', // Strong reasoning
    'openai/gpt-oss-120b', // Large context model
    'qwen/qwen3-coder:free', // Good for technical analysis
    'moonshotai/kimi-dev-72b:free', // Strong general AI
    'alibaba/tongyi-deepresearch-30b-a3b:free', // Research focused
    'z-ai/glm-4.5-air:free', // Advanced language model
    'minimax/minimax-m2:free', // Powerful multimodal
    'meituan/longcat-flash-chat:free', // Fast and capable
    'gemini-2.5-flash', // Fallback
  ];

  // Helper function to get a random powerful model different from the current one
  const getRandomPowerfulModel = (excludeModel?: string): AIModelId => {
    const available = superPowerfulModels.filter((m) => m !== excludeModel);
    return available[Math.floor(Math.random() * available.length)] || 'gemini-2.5-flash';
  };

  // Helper function to try a model with fallback for extended thinking
  const tryPowerfulModelWithFallback = async (
    stepNumber: number,
    prompt: string,
    systemMessage: string,
    primaryModel: AIModelId,
    maxRetries: number = 3,
  ): Promise<{ response: any; model: string; duration: number }> => {
    let currentModel = primaryModel;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const start = Date.now();
        const model = initializeAIModel(currentModel, false);

        // Test the model with a simple invoke first
        const testResponse = await Promise.race([
          model.invoke([
            new SystemMessage('Test response - respond with "OK"'),
            new HumanMessage('Test'),
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Model timeout')), 15000)),
        ]);

        if (!testResponse.content && !testResponse.text) {
          throw new Error(`Model ${currentModel} returned empty response`);
        }

        // If test passes, proceed with the actual prompt
        const response = await Promise.race([
          model.invoke([new SystemMessage(systemMessage), new HumanMessage(prompt)]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Model response timeout')), 30000),
          ),
        ]);

        const duration = (Date.now() - start) / 1000;
        return { response, model: currentModel, duration };
      } catch (error) {
        console.warn(
          `Step ${stepNumber} failed with model ${currentModel}:`,
          error instanceof Error ? error.message : String(error),
        );
        lastError = error;
        currentModel = getRandomPowerfulModel(currentModel);
      }
    }

    throw new Error(
      `All powerful models failed for step ${stepNumber}. Last error: ${lastError?.message || 'Unknown error'}`,
    );
  };

  // Step 1: Deep Analysis - Use most powerful model for initial breakdown
  try {
    const step1Result = await tryPowerfulModelWithFallback(
      1,
      `Perform a comprehensive analysis of this question. Break it down into fundamental components and identify the core problem with exceptional depth:

Question: ${question}
Context: ${context}

Provide a detailed breakdown covering:
1. Core problem identification and root cause analysis
2. Key requirements, constraints, and success criteria
3. Multiple potential solution approaches with technical depth
4. Edge cases, failure modes, and risk assessment
5. Dependencies, prerequisites, and environmental factors
6. Performance, scalability, and reliability considerations

Be extremely thorough and provide expert-level analysis.`,
      'You are a world-class AI analyst with deep expertise across all technical domains. Provide exceptional analytical depth and precision.',
      'perplexity-sonar-pro',
    );

    thinkingSteps.push({
      step: 1,
      thought: `**🔍 Deep Problem Analysis:**\n${step1Result.response.content.toString()}`,
      duration: step1Result.duration,
      model: step1Result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Step 1 failed completely:', error);
    thinkingSteps.push({
      step: 1,
      thought: `**🔍 Deep Problem Analysis:**\nFailed to perform deep analysis. Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: 0,
      model: 'failed',
      timestamp: new Date().toISOString(),
    });
  }

  // Step 2: Advanced Reasoning - Use different powerful model for solution evaluation
  try {
    const step2Result = await tryPowerfulModelWithFallback(
      2,
      `Based on the deep analysis above, provide advanced reasoning and evaluation of multiple solution approaches:

Question: ${question}
Deep Analysis: ${thinkingSteps[0]?.thought.replace('**🔍 Deep Problem Analysis:**\n', '') || 'Analysis not available'}

Provide comprehensive evaluation covering:
1. Detailed technical architecture and implementation strategies
2. Comparative analysis of solution approaches (pros/cons with metrics)
3. Risk assessment and mitigation strategies
4. Performance optimization and efficiency considerations
5. Security, compliance, and best practice implications
6. Cost-benefit analysis and resource requirements
7. Timeline estimates and development complexity assessment
8. Alternative innovative approaches and cutting-edge solutions

Provide expert-level reasoning with specific technical details and actionable insights.`,
      'You are an elite AI reasoning specialist with unparalleled analytical capabilities. Provide sophisticated technical reasoning and strategic insights.',
      'deepseek/deepseek-r1-0528:free',
    );

    thinkingSteps.push({
      step: 2,
      thought: `**🧠 Advanced Solution Reasoning:**\n${step2Result.response.content.toString()}`,
      duration: step2Result.duration,
      model: step2Result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Step 2 failed completely:', error);
    thinkingSteps.push({
      step: 2,
      thought: `**🧠 Advanced Solution Reasoning:**\nFailed to perform advanced reasoning. Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: 0,
      model: 'failed',
      timestamp: new Date().toISOString(),
    });
  }

  // Step 3: Expert Synthesis - Use another powerful model for final comprehensive response
  try {
    const step3Result = await tryPowerfulModelWithFallback(
      3,
      `Synthesize all analysis and reasoning into a masterful, comprehensive, and immediately actionable response:

Question: ${question}
Deep Analysis: ${thinkingSteps[0]?.thought.replace('**🔍 Deep Problem Analysis:**\n', '') || 'Analysis not available'}
Advanced Reasoning: ${thinkingSteps[1]?.thought.replace('**🧠 Advanced Solution Reasoning:**\n', '') || 'Reasoning not available'}

Create a response that demonstrates expert-level understanding and provides:
1. Clear, comprehensive solution with step-by-step implementation
2. Specific code examples, configurations, and technical details
3. Best practices, performance optimizations, and security considerations
4. Common pitfalls, troubleshooting guidance, and maintenance strategies
5. Alternative approaches with clear trade-off analysis
6. Future-proofing recommendations and scalability guidance
7. Resource links, documentation, and learning materials
8. Success metrics and validation approaches

Make the response exceptionally practical, immediately actionable, and demonstrate deep technical expertise.`,
      'You are a master AI synthesizer capable of creating exceptional technical content. Provide comprehensive, actionable, and expert-level responses.',
      'microsoft/mai-ds-r1:free',
    );

    thinkingSteps.push({
      step: 3,
      thought: `**✨ Expert Synthesis & Solution:**\n${step3Result.response.content.toString()}`,
      duration: step3Result.duration,
      model: step3Result.model,
      timestamp: new Date().toISOString(),
    });

    return {
      thinkingSteps,
      finalAnswer: step3Result.response.content.toString(),
    };
  } catch (error) {
    console.error('Step 3 failed completely:', error);

    // If final synthesis fails, try with multiple fallback models
    try {
      const fallbackModels = [
        'meta-llama/llama-4-maverick:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'openai/gpt-oss-120b',
      ];
      let finalResult: any = null;

      for (const fallbackModel of fallbackModels) {
        try {
          const fallbackResult = await tryPowerfulModelWithFallback(
            3,
            `Provide a comprehensive answer to this question based on the available analysis:

Question: ${question}
Context: ${context}

${thinkingSteps[0] ? `Analysis: ${thinkingSteps[0].thought.replace('**🔍 Deep Problem Analysis:**\n', '')}` : ''}
${thinkingSteps[1] ? `Reasoning: ${thinkingSteps[1].thought.replace('**🧠 Advanced Solution Reasoning:**\n', '')}` : ''}

Provide a detailed, actionable response with specific recommendations and technical details.`,
            'You are an expert AI assistant providing comprehensive technical solutions.',
            fallbackModel as AIModelId,
            1, // Only 1 retry for fallback
          );

          finalResult = fallbackResult;
          break; // Success, exit the loop
        } catch (fallbackError) {
          console.warn(`Fallback model ${fallbackModel} also failed:`, fallbackError);
          continue;
        }
      }

      if (finalResult) {
        thinkingSteps.push({
          step: 3,
          thought: `**✨ Expert Synthesis & Solution (Fallback):**\n${finalResult.response.content.toString()}`,
          duration: finalResult.duration,
          model: finalResult.model,
          timestamp: new Date().toISOString(),
        });

        return {
          thinkingSteps,
          finalAnswer: finalResult.response.content.toString(),
        };
      }
    } catch (fallbackError) {
      console.error('All fallback attempts failed:', fallbackError);
    }

    // Ultimate fallback - provide a basic response
    thinkingSteps.push({
      step: 3,
      thought: `**Error:**\nUnable to generate a comprehensive response. All powerful AI models failed. Please try again later or use a simpler query.`,
      duration: 0,
      model: 'failed',
      timestamp: new Date().toISOString(),
    });

    return {
      thinkingSteps,
      finalAnswer:
        "I apologize, but I'm currently experiencing issues with all available AI models. Please try again in a few moments, or try a different question. If the problem persists, consider using the standard AI assistant instead of extended thinking mode.",
    };
  }
}

// Function to attempt AI generation with fallback models (enhanced with powerful models)
async function generateWithFallbackModels(
  messages: any[],
  tracer: any,
  selectedModelId: AIModelId,
  isRegeneration: boolean = false,
): Promise<any> {
  // Create a prioritized list of powerful models to try, starting with the selected one
  const powerfulFallbackModels: AIModelId[] = [
    selectedModelId, // Always try the selected model first
    'perplexity-sonar-pro', // Most powerful for complex queries
    'deepseek/deepseek-r1-0528:free', // Excellent reasoning
    'microsoft/mai-ds-r1:free', // Advanced reasoning
    'meta-llama/llama-4-maverick:free', // Powerful general AI
    'nousresearch/hermes-3-llama-3.1-405b:free', // Strong reasoning
    'openai/gpt-oss-120b', // Large context model
    'qwen/qwen3-coder:free', // Good for technical queries
    'moonshotai/kimi-dev-72b:free', // Strong general AI
    'alibaba/tongyi-deepresearch-30b-a3b:free', // Research focused
    'z-ai/glm-4.5-air:free', // Advanced language model
    'minimax/minimax-m2:free', // Powerful multimodal
    'meituan/longcat-flash-chat:free', // Fast and capable
    'gemini-2.5-flash', // Reliable fallback
  ];

  // Remove duplicates while preserving order
  const uniqueModels = powerfulFallbackModels.filter(
    (model, index, arr) => arr.indexOf(model) === index,
  );

  let lastError: any = null;
  let attemptedModels: string[] = [];

  for (const modelId of uniqueModels) {
    try {
      attemptedModels.push(modelId);
      console.log(
        `Attempting to generate with powerful model: ${modelId} (attempted: ${attemptedModels.join(', ')})`,
      );

      const fallbackModel = initializeAIModel(modelId, isRegeneration);

      // Test the model with a simple invoke first to check if it works
      const testResponse = await Promise.race([
        fallbackModel.invoke([
          new SystemMessage('Test response - respond with "OK"'),
          new HumanMessage('Test'),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Model timeout')), 10000)),
      ]);

      if (!testResponse.content && !testResponse.text) {
        throw new Error(`Model ${modelId} returned empty response`);
      }

      console.log(`Model ${modelId} test passed, proceeding with streaming`);

      // If test passes, proceed with streaming
      const stream = await fallbackModel.stream(messages, {
        callbacks: tracer ? [tracer] : undefined,
      });

      return stream;
    } catch (error) {
      console.warn(
        `Powerful model ${modelId} failed:`,
        error instanceof Error ? error.message : String(error),
      );
      lastError = error;

      // Continue to next model if this one failed
      continue;
    }
  }

  // If all models failed, throw the last error with context
  const errorMessage = `All powerful AI models failed. Attempted: ${attemptedModels.join(', ')}. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Fetch user memories and survey data from database (optimized single query with caching)
async function getUserMemoryContext(userId: string): Promise<string> {
  // Check cache first
  const cached = memoryCache.get(userId);
  if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
    return cached.context;
  }

  try {
    // Single query to get both memories and survey data
    const [memories, survey] = await Promise.all([
      db.userMemory.findMany({
        where: { userId },
        orderBy: { lastUsedAt: 'desc' },
        take: 15, // Reduced from 20 to limit data sent to AI
        select: {
          category: true,
          key: true,
          value: true,
        },
      }),
      db.survey.findUnique({
        where: { userId },
        select: {
          companyName: true,
          companySize: true,
          industry: true,
          role: true,
          usagePurpose: true,
          hearAboutUs: true,
          expectedFeatures: true,
          developmentExperience: true,
          githubExperience: true,
          feedbackFrequency: true,
          additionalFeedback: true,
        },
      }),
    ]);

    let context = '';

    // Add survey data if available (limit length to prevent token bloat)
    if (survey) {
      context += '\n\nUSER PROFILE:';
      if (survey.companyName) context += `\n- Company: ${survey.companyName.substring(0, 50)}`;
      if (survey.companySize) context += `\n- Size: ${survey.companySize}`;
      if (survey.industry) context += `\n- Industry: ${survey.industry.substring(0, 30)}`;
      if (survey.role) context += `\n- Role: ${survey.role.substring(0, 30)}`;
      if (survey.usagePurpose) context += `\n- Purpose: ${survey.usagePurpose.substring(0, 50)}`;
      if (survey.expectedFeatures?.length)
        context += `\n- Features: ${survey.expectedFeatures.slice(0, 3).join(', ')}`;
      if (survey.developmentExperience) context += `\n- Dev Exp: ${survey.developmentExperience}y`;
      if (survey.githubExperience) context += `\n- GitHub Exp: ${survey.githubExperience}y`;
    }

    // Add memories if available (limit to prevent token overflow)
    if (memories.length > 0) {
      context += '\n\nUSER MEMORY:';

      const categorized: Record<string, typeof memories> = {};
      for (const memory of memories) {
        if (!categorized[memory.category]) {
          categorized[memory.category] = [];
        }
        categorized[memory.category]!.push(memory);
      }

      // Limit categories and items per category
      const categoryLimit = 2; // Reduced from 3
      const itemsPerCategoryLimit = 2;
      let categoryCount = 0;

      for (const [category, items] of Object.entries(categorized)) {
        if (categoryCount >= categoryLimit) break;
        context += `\n\n${category.toUpperCase()}:`;
        for (const item of items.slice(0, itemsPerCategoryLimit)) {
          context += `\n- ${item.key}: ${item.value.substring(0, 80)}`; // Reduced from 100
        }
        categoryCount++;
      }
    }

    // Limit total context length to prevent AI token limits
    const finalContext = context.length > 1200 ? context.substring(0, 1200) + '...' : context;

    // Cache the result
    memoryCache.set(userId, { context: finalContext, timestamp: Date.now() });

    return finalContext;
  } catch (error) {
    console.error('Error fetching user context:', error);
    return '';
  }
}

// Extract and store user information from conversations (optimized with conditions)
async function extractAndStoreMemories(
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantResponse: string,
): Promise<void> {
  try {
    // Skip memory extraction for very short conversations or generic questions
    if (userMessage.length < 20 || assistantResponse.length < 50) {
      return;
    }

    // Skip for obvious non-personal questions
    const skipPatterns = [
      /^what is/i,
      /^how do/i,
      /^explain/i,
      /^show me/i,
      /^tell me/i,
      /^can you/i,
      /^please/i,
      /^help/i,
    ];

    if (skipPatterns.some((pattern) => pattern.test(userMessage.trim()))) {
      return;
    }

    // Use AI to extract memorable information from the conversation (with shorter prompt)
    const memoryExtractionPrompt = `Extract key user preferences or facts from this conversation. Focus ONLY on specific, actionable information.

User: ${userMessage.substring(0, 200)}
Assistant: ${assistantResponse.substring(0, 300)}

Return JSON: {"memories": [{"key": "fact_name", "value": "fact_value", "category": "preference|skill|tool", "confidence": 0.9}]}

If no specific facts, return: {"memories": []}`;

    const extractionModel = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      maxOutputTokens: 500, // Limit output
    });

    const extractionResponse = await extractionModel.invoke([
      new SystemMessage('Extract user facts concisely as JSON.'),
      new HumanMessage(memoryExtractionPrompt),
    ]);

    const responseText = extractionResponse.content.toString();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const extracted = JSON.parse(jsonMatch[0]) as {
      memories: Array<{ key: string; value: string; category: string; confidence: number }>;
    };

    // Store only high-confidence memories
    const highConfidenceMemories = extracted.memories.filter((m) => m.confidence >= 0.7);

    if (highConfidenceMemories.length === 0) return;

    // Batch upsert operations
    const upsertPromises = highConfidenceMemories
      .filter((memory) => memory.key && memory.value)
      .slice(0, 3) // Limit to 3 memories per conversation
      .map((memory) =>
        db.userMemory.upsert({
          where: {
            userId_key: {
              userId: userId,
              key: memory.key,
            },
          },
          create: {
            userId: userId,
            key: memory.key,
            value: memory.value.substring(0, 200), // Limit value length
            category: memory.category || 'general',
            source: sessionId,
            confidence: Math.min(memory.confidence, 1.0),
            lastUsedAt: new Date(),
          },
          update: {
            value: memory.value.substring(0, 200),
            confidence: Math.min(memory.confidence, 1.0),
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      );

    await Promise.all(upsertPromises);
  } catch (error) {
    console.error('Error extracting and storing memories:', error);
    // Don't throw - memory extraction is non-critical
  }
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
  | 'meituan/longcat-flash-chat:free'
  | 'meta-llama/llama-4-maverick:free'
  | 'qwen/qwen3-coder:free'
  | 'nousresearch/hermes-3-llama-3.1-405b:free'
  | 'minimax/minimax-m2:free';
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
  'meta-llama/llama-4-maverick:free': {
    provider: 'openrouter',
    modelName: 'meta-llama/llama-4-maverick:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'openai/gpt-oss-20b': {
    provider: 'openrouter',
    modelName: 'openai/gpt-oss-20b:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'meituan/longcat-flash-chat:free': {
    provider: 'openrouter',
    modelName: 'meituan/longcat-flash-chat:free',
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
  'minimax/minimax-m2:free': {
    provider: 'openrouter',
    modelName: 'minimax/minimax-m2:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  'nousresearch/hermes-3-llama-3.1-405b:free': {
    provider: 'openrouter',
    modelName: 'nousresearch/hermes-3-llama-3.1-405b:free',
    temperature: 0.7,
    apiKeyEnv: 'OPENROUTER_API_KEY',
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

// Initialize AI model based on selection (with caching)
const initializeAIModel = (
  modelId: AIModelId = 'gemini-2.5-flash',
  isRegeneration: boolean = false,
) => {
  const cacheKey = `${modelId}-${isRegeneration}`;
  const cached = modelCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < MODEL_CACHE_TTL) {
    return cached.model;
  }

  // Resolve model config and API key for the selected model
  const config = AI_MODEL_CONFIGS[modelId] || AI_MODEL_CONFIGS['gemini-2.5-flash'];
  const apiKey = process.env[config.apiKeyEnv];

  // Adjust temperature for regeneration to encourage more variety
  const adjustedTemperature = isRegeneration
    ? Math.min(config.temperature + 0.2, 1.0)
    : config.temperature;

  let model: any;

  if (!apiKey) {
    console.warn(`API key for ${modelId} not found, falling back to Gemini`);
    // Fallback to Gemini if the selected model's API key is not available
    model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-2.5-flash',
      temperature: isRegeneration ? 0.7 : 0.5,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1500,
    });
  } else {
    switch (config.provider) {
      case 'google':
        model = new ChatGoogleGenerativeAI({
          apiKey: apiKey,
          model: config.modelName,
          temperature: adjustedTemperature,
          topP: 0.8,
          topK: 40,
        });
        break;

      case 'groq':
        model = new ChatOpenAI({
          apiKey: apiKey,
          modelName: config.modelName,
          temperature: adjustedTemperature,
          configuration: {
            baseURL: 'https://api.groq.com/openai/v1',
          },
        });
        break;

      case 'openai-compatible':
        const baseURLs: Record<string, string> = {
          'perplexity-sonar-pro': 'https://api.perplexity.ai',
        };

        model = new ChatOpenAI({
          apiKey: apiKey,
          modelName: config.modelName,
          temperature: adjustedTemperature,
          configuration: {
            baseURL: baseURLs[modelId] || 'https://api.openai.com/v1',
          },
        });
        break;

      case 'qwen':
        model = new ChatOpenAI({
          apiKey: apiKey,
          modelName: config.modelName,
          temperature: adjustedTemperature,
          configuration: {
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          },
        });
        break;

      case 'mistral':
        model = new ChatOpenAI({
          apiKey: apiKey,
          modelName: config.modelName,
          temperature: adjustedTemperature,
          configuration: {
            baseURL: 'https://api.mistral.ai/v1',
          },
        });
        break;

      case 'openrouter':
        model = new ChatOpenAI({
          apiKey: apiKey,
          modelName: config.modelName,
          temperature: adjustedTemperature,
          configuration: {
            baseURL: 'https://openrouter.ai/api/v1',
          },
        });
        break;

      default:
        // Fallback to Gemini
        model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GEMINI_API_KEY!,
          model: 'gemini-2.5-flash',
          temperature: isRegeneration ? 0.9 : 0.7,
          topP: 0.8,
          topK: 40,
        });
    }
  }

  // Cache the model
  modelCache.set(cacheKey, { model, timestamp: Date.now() });

  return model;
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

// Perform web search using Firecrawl (optimized for speed)
const performWebSearch = async (query: string): Promise<{ content: string; sources: string[] }> => {
  try {
    if (!process.env.FIRECRAWL_API_KEY) {
      return { content: '', sources: [] };
    }

    // More selective search - only for very specific queries
    const lowerQuery = query.toLowerCase();

    // Skip search for basic questions
    if (
      query.length < 20 ||
      lowerQuery.includes('hello') ||
      lowerQuery.includes('hi') ||
      lowerQuery.includes('thank') ||
      lowerQuery.includes('help') ||
      lowerQuery.includes('what is dionysus') ||
      lowerQuery.includes('how to use')
    ) {
      return { content: '', sources: [] };
    }

    // Create more targeted search queries based on the question content
    const searchQueries = [];

    if (lowerQuery.includes('react') || lowerQuery.includes('component')) {
      searchQueries.push(`${query} React documentation`);
    } else if (lowerQuery.includes('next') || lowerQuery.includes('nextjs')) {
      searchQueries.push(`${query} Next.js documentation`);
    } else if (lowerQuery.includes('typescript') || lowerQuery.includes('ts')) {
      searchQueries.push(`${query} TypeScript documentation`);
    } else if (lowerQuery.includes('github') || lowerQuery.includes('repository')) {
      searchQueries.push(`${query} GitHub`);
    } else {
      // Generic search for other topics - limit to 1 query
      searchQueries.push(`${query} documentation`);
    }

    const searchResults: { content: string; sources: string[] } = { content: '', sources: [] };

    // Search with only 1 query and limit results
    for (const searchQuery of searchQueries.slice(0, 1)) {
      try {
        const searchResponse = await firecrawl.search(searchQuery, {
          limit: 2, // Reduced from 3
        });

        if (searchResponse && Array.isArray(searchResponse)) {
          for (const result of searchResponse.slice(0, 2)) {
            // Limit to 2 results
            if (result.content && result.url) {
              searchResults.content += `\n\nSOURCE: ${result.url}\n`;
              searchResults.content += `CONTENT: ${result.content.substring(0, 600)}...\n`; // Reduced from 1000
              searchResults.sources.push(result.url);
            }
          }
        }
      } catch (searchError) {
        console.error('Search error:', searchError);
        // Continue without failing
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
      groupId,
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
      selectedModel === 'meituan/longcat-flash-chat:free' ||
      selectedModel === 'meta-llama/llama-4-maverick:free' ||
      selectedModel === 'nousresearch/hermes-3-llama-3.1-405b:free' ||
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

    // Fetch user memory context from database (skip for very basic queries)
    const shouldFetchMemories =
      sanitizedQuestion.length > 30 && // Skip very short questions
      !sanitizedQuestion.toLowerCase().includes('hello') &&
      !sanitizedQuestion.toLowerCase().includes('hi') &&
      !sanitizedQuestion.toLowerCase().includes('thank') &&
      !sanitizedQuestion.toLowerCase().includes('help');

    const userMemoryContext = shouldFetchMemories ? await getUserMemoryContext(userId) : '';

    // Fetch group system prompt if session belongs to a group (skip for basic queries)
    let groupSystemPrompt = '';
    if (groupId && shouldFetchMemories) {
      // Only fetch group prompt if we're fetching memories
      try {
        const group = await db.chatGroup.findFirst({
          where: {
            id: groupId,
            userId: userId,
          },
          select: {
            systemPrompt: true,
            name: true,
          },
        });

        if (group?.systemPrompt) {
          groupSystemPrompt = `\n\nGROUP CUSTOM INSTRUCTIONS (${group.name}):\n${group.systemPrompt}\n`;
        }
      } catch (error) {
        console.error('Error fetching group system prompt:', error);
        // Continue without group prompt if there's an error
      }
    }

    // Check if web search is needed (skip for simple questions)
    const needsWebSearch =
      requiresWebSearch(sanitizedQuestion) &&
      sanitizedQuestion.length > 50 && // Skip very short questions
      !sanitizedQuestion.toLowerCase().includes('hello') &&
      !sanitizedQuestion.toLowerCase().includes('hi') &&
      !sanitizedQuestion.toLowerCase().includes('thank');

    let webSearchContent = '';
    let sources: string[] = [];

    if (needsWebSearch) {
      const searchResults = await performWebSearch(sanitizedQuestion);
      webSearchContent = searchResults.content;
      sources = searchResults.sources;
    }

    // Build sanitized conversation history (optimized with limits)
    let conversationContext = '';
    if (
      conversationHistory &&
      Array.isArray(conversationHistory) &&
      conversationHistory.length > 0
    ) {
      conversationContext = '\n\nRECENT CONVERSATION:\n';

      // Limit to last 5 messages and truncate each message
      const recentMessages = conversationHistory.slice(-5);

      for (const msg of recentMessages) {
        if (msg.role && msg.content && typeof msg.content === 'string') {
          const sanitizedContent = sanitizeInput(msg.content);
          // Truncate long messages to prevent token bloat
          const truncatedContent =
            sanitizedContent.length > 300
              ? sanitizedContent.substring(0, 300) + '...'
              : sanitizedContent;
          conversationContext += `${msg.role.toUpperCase()}: ${truncatedContent}\n`;
        }
      }
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
- LEARN FROM USER FEEDBACK: If feedback insights are provided, study the patterns carefully and adapt your response style accordingly. Emulate successful patterns and avoid unsuccessful ones.
- Dionysus is made by Saksham Goel his github profile is at https://github.com/saksham-goel1107 and the project github repo is at https://github.com/saksham-goel1107/dionysus and the website is at https://dionysus-gray.vercel.app and it's support page is at https://dionysus-gray.vercel.app/support
${groupSystemPrompt}

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

    // Limit total system prompt length to prevent token overflow (keep under 8000 chars for safety)
    const maxSystemPromptLength = 8000;
    const truncatedSystemPrompt =
      systemPrompt.length > maxSystemPromptLength
        ? systemPrompt.substring(0, maxSystemPromptLength - 100) +
          '\n\n[Context truncated for length]\n\n' +
          systemPrompt.substring(systemPrompt.length - 500) // Keep the end with instructions
        : systemPrompt;

    // Prepare messages with proper multimodal support
    const systemMessage = new SystemMessage(truncatedSystemPrompt);

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

              // Stream each thinking step to the client with enhanced formatting
              for (const step of thinkingResult.thinkingSteps) {
                const stepData = JSON.stringify({
                  type: 'thinkingStep',
                  stepNumber: step.step,
                  title:
                    step.thought.split('\n')[0]?.replace(/\*\*/g, '').trim() || `Step ${step.step}`,
                  content: step.thought,
                  duration: step.duration,
                  model: step.model,
                  timestamp: step.timestamp,
                  isVisible: true, // Ensure the step is marked as visible
                });
                controller.enqueue(encoder.encode(`data: ${stepData}\n\n`));

                // Add a delay between steps for better UX and to ensure proper rendering
                await new Promise((resolve) => setTimeout(resolve, 300));
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

      // Check response cache for similar questions (skip for regeneration or complex queries)
      const cacheKey = `${sanitizedQuestion.substring(0, 100)}-${sanitizedContext.substring(0, 50)}`;
      const cachedResponse = responseCache.get(cacheKey);

      if (
        cachedResponse &&
        Date.now() - cachedResponse.timestamp < RESPONSE_CACHE_TTL &&
        !isRegeneration
      ) {
        // Return cached response immediately
        const readableStream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            // Stream cached response instantly
            const words = cachedResponse.response.split(' ');
            let currentText = '';

            for (const word of words) {
              currentText += (currentText ? ' ' : '') + word;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'chunk', content: word + ' ', timestamp: new Date().toISOString() })}\n\n`,
                ),
              );
              // Very fast streaming for cached responses
            }

            // Send sources if available
            if (cachedResponse.sources.length > 0) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'sources', sources: cachedResponse.sources, timestamp: new Date().toISOString() })}\n\n`,
                ),
              );
            }

            // Send completion
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'complete', fullResponse: cachedResponse.response, sources: cachedResponse.sources, timestamp: new Date().toISOString() })}\n\n`,
              ),
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
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
      }

      const tracer = new LangChainTracer();
      const stream = await generateWithFallbackModels(
        messages,
        tracer,
        modelId,
        isRegeneration || false,
      );

      // Create a readable stream
      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            let fullResponse = '';

            for await (const chunk of stream) {
              const content = chunk.content || chunk.text || '';
              if (content) {
                // Only send non-empty chunks
                fullResponse += content;

                // Send chunk to client immediately
                const data = JSON.stringify({
                  type: 'chunk',
                  content: content,
                  timestamp: new Date().toISOString(),
                });

                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }

            // Parse follow-up questions from the response (optimized - do this incrementally)
            let followUpQuestions: string[] = [];
            let cleanResponse = fullResponse;

            // Simple check for JSON array at the end
            const jsonArrayRegex = /\[(\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*)\]$/;
            const match = fullResponse.match(jsonArrayRegex);

            if (match) {
              try {
                const jsonString = match[0];
                const parsed = JSON.parse(jsonString);
                if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
                  followUpQuestions = parsed;
                  cleanResponse = fullResponse.replace(jsonArrayRegex, '').trim();
                }
              } catch (e) {
                console.warn('Follow-up parsing failed:', e);
                // Keep original response if parsing fails
                cleanResponse = fullResponse;
              }
            } else {
              cleanResponse = fullResponse;
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
            // Only for substantial responses (>50 chars) that aren't just follow-up questions
            if (sessionId && cleanResponse.length > 50 && !cleanResponse.match(/^\s*\[.*\]\s*$/)) {
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
