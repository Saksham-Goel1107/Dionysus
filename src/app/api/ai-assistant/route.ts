import { auth } from '@clerk/nextjs/server';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import FirecrawlApp from '@mendable/firecrawl-js';
import { LangChainTracer } from 'langchain/callbacks';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Initialize LangChain tracer
let tracer: LangChainTracer | null = null;
if (!tracer && process.env.LANGCHAIN_API_KEY) {
  tracer = new LangChainTracer({
    projectName: 'dionysus-ai-assistant',
  });
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
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .substring(0, 5000); // Limit input length
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

    const { question, context, conversationHistory, platform, attachments, userInfo } =
      await request.json();
    const { userId } = await auth();

    // Authentication check
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use the AI assistant.' },
        { status: 401 },
      );
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

    // Initialize LangChain model
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1500,
    });

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

    const systemPrompt = `You are an intelligent AI assistant for the Dionysus platform - an enterprise GitHub analytics and collaboration SaaS platform built with Next.js, TypeScript, tRPC, Prisma, and PostgreSQL. You provide AI-powered code analysis, meeting transcription, team collaboration, and comprehensive repository insights.

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

IMPORTANT CONVERSATION CONTEXT:
- You are continuing an ongoing conversation with the user
- Review the previous conversation history to maintain context and avoid repetitive greetings
- Only greet the user if this is clearly the start of a new conversation (no previous messages)
- Build upon previous topics discussed rather than starting fresh each time
- Reference earlier parts of the conversation when relevant
- If the user has been asking about specific topics, continue that thread naturally

CURRENT PAGE INFORMATION:
${sanitizedContext}

${conversationContext}

${attachmentContext}

${userContext}

${webSearchContent ? `\n\nWEB SEARCH RESULTS:\n${webSearchContent}\n` : ''}

Provide a helpful response about the Dionysus platform or development topics based on the current page context${attachmentContext ? ', attached files,' : ''}${webSearchContent ? ' and web search results' : ''}. Remember, you have web search capabilities and can find specific, current resources and recommendations.`;

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

    let userMessage;

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
      // Create streaming response
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

            // Send sources if we have them
            if (sources.length > 0) {
              const sourcesData = JSON.stringify({
                type: 'sources',
                sources: sources,
                timestamp: new Date().toISOString(),
              });

              controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
            }

            // Send completion signal
            const completeData = JSON.stringify({
              type: 'complete',
              fullResponse: sanitizeInput(fullResponse),
              sources: sources,
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
