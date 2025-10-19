'use client';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    // @ts-ignore
    webkitSpeechRecognition: any;
  }
}

import { useUser } from '@clerk/nextjs';
import MDEditor from '@uiw/react-md-editor';
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  Copy,
  ExternalLink,
  File,
  FileImage,
  FileText,
  Lightbulb,
  LogIn,
  Mic,
  MicOff,
  Monitor,
  Paperclip,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
  sources?: string[];
  attachments?: FileAttachment[];
  followUpQuestions?: string[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // For text files
  url?: string; // For images
}

const GlobalAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState('');
  const [inputError, setInputError] = useState('');
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [hasProPlan, sethasProPlan] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [originalMessage, setOriginalMessage] = useState<string>('');

  useEffect(() => {
    if (!showModelSelector) {
      setModelSearchQuery('');
    }
  }, [showModelSelector]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/pro-status');
        if (!res.ok) throw new Error('Failed to fetch pro status');
        const data = await res.json();
        sethasProPlan(data.pro);
      } catch {
        sethasProPlan(false);
      }
    })();
  }, []);

  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();

  // AI Model options
  const AI_MODELS = [
    {
      id: 'auto',
      name: 'Auto Select',
      provider: 'Smart',
      description: 'Automatically chooses the best model for your question',
      icon: '🎯',
      speed: 'Adaptive',
      quality: 'Optimal',
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'Google',
      description: 'Fast and efficient for most tasks',
      icon: '✨',
      speed: 'Very Fast',
      quality: 'High',
    },
    {
      id: 'groq-llama-3.3-70b',
      name: 'Llama 3.3 70B',
      provider: 'Groq',
      description: 'Powerful open-source model with fast inference',
      icon: '🦙',
      speed: 'Decent Fast',
      quality: 'Very High',
    },
    {
      id: 'openai/gpt-oss-120b',
      name: 'GPT OSS 120B',
      provider: 'OpenAI',
      description: 'Heavy open-source model with excellent capabilities',
      icon: '🤖',
      speed: 'Slow',
      quality: 'Excellent',
    },
    {
      id: 'microsoft/mai-ds-r1:free',
      name: 'Microsoft MAI DS R1',
      provider: 'Microsoft',
      description: 'Heavy model with superb capabilities',
      icon: '🛡️',
      speed: 'Slow',
      quality: 'Excellent',
    },
    {
      id: 'openai/gpt-oss-20b',
      name: 'GPT OSS 20B',
      provider: 'OpenAI',
      description: 'Efficient open-source model with decent capabilities',
      icon: '🤖',
      speed: 'Fast',
      quality: 'High',
    },
    {
      id: 'moonshotai/kimi-k2:free',
      name: 'Kimi K2',
      provider: 'Moonshot AI',
      description: 'Efficient model with decent capabilities',
      icon: '🌙',
      speed: 'Fast',
      quality: 'High',
    },
    {
      id: 'qwen-2.5-72b',
      name: 'Qwen 2.5 72B',
      provider: 'Hugging Face',
      description: 'Powerful multilingual model from Alibaba Cloud via Hugging Face',
      icon: '🌟',
      speed: 'Medium',
      quality: 'Very High',
    },
    {
      id: 'qwen-2.5-32b',
      name: 'Qwen 2.5 32B',
      provider: 'Hugging Face',
      description: 'Efficient and capable multilingual model via Hugging Face',
      icon: '⭐',
      speed: 'Fast',
      quality: 'High',
    },
    {
      id: 'mistral-large-latest',
      name: 'Mistral Large',
      provider: 'Mistral',
      description: 'Fast and efficient open-source model from Mistral.ai',
      icon: '💨',
      speed: 'Very Fast',
      quality: 'High',
    },
    {
      id: 'qwen/qwen3-coder:free',
      name: 'Qwen 3 Coder',
      provider: 'OpenRouter',
      description: 'Specialized coding model with excellent code generation',
      icon: '👨‍💻',
      speed: 'Medium',
      quality: 'Very High',
    },
    {
      id: 'deepseek/deepseek-r1-0528:free',
      name: 'DeepSeek R1',
      provider: 'OpenRouter',
      description: 'Advanced reasoning model with exceptional capabilities',
      icon: '🧠',
      speed: 'Medium',
      quality: 'Excellent',
    },
    {
      id: 'perplexity-sonar-pro',
      name: 'Sonar Pro',
      provider: 'Perplexity',
      description: 'Real-time web search and analysis',
      icon: '🔍',
      speed: 'Medium',
      quality: 'Excellent',
    },
  ];

  // Security and validation constants
  const MAX_QUESTIONS_PER_HOUR = 50;
  const MAX_MESSAGE_LENGTH = 1000;
  const MIN_MESSAGE_LENGTH = 3;
  const RATE_LIMIT_STORAGE_KEY = 'dionysus-ai-rate-limit';

  // Storage key for persistence
  const STORAGE_KEY = 'dionysus-ai-assistant-conversation';
  const STORAGE_CONTEXT_KEY = 'dionysus-ai-assistant-context';

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase(),
      );
      const isSmallScreen = window.innerWidth < 768; // Less than md breakpoint
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup effect for abort controller
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelSelector) {
        const target = event.target as HTMLElement;
        if (!target.closest('.model-selector-container')) {
          setShowModelSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelSelector]);

  useEffect(() => {
    if (
      !hasProPlan &&
      (selectedModel === 'perplexity-sonar-pro' ||
        selectedModel === 'deepseek/deepseek-r1-0528:free' ||
        selectedModel === 'microsoft/mai-ds-r1:free' ||
        selectedModel === 'openai/gpt-oss-120b')
    ) {
      setSelectedModel('gemini-2.5-flash');
    }
  }, [hasProPlan, selectedModel]);

  // Security function to sanitize input
  const sanitizeInput = (input: string): string => {
    // Use well-tested library for complete HTML sanitization
    return sanitizeHtml(input);
  };

  // Function to validate if question is relevant to the platform
  const validateQuestionRelevance = (question: string): { isValid: boolean; error?: string } => {
    const sanitized = sanitizeInput(question.toLowerCase());

    // Define platform-related keywords
    const platformKeywords = [
      'dionysus',
      'github',
      'repository',
      'repo',
      'code',
      'development',
      'programming',
      'analytics',
      'dashboard',
      'collaboration',
      'meeting',
      'transcription',
      'ai',
      'assistant',
      'page',
      'feature',
      'function',
      'bug',
      'issue',
      'pull request',
      'commit',
      'branch',
      'merge',
      'review',
      'deploy',
      'build',
      'test',
      'project',
      'workspace',
      'team',
      'member',
      'user',
      'admin',
      'settings',
      'profile',
      'notification',
      'search',
      'filter',
      'navigate',
      'interface',
      'ui',
      'ux',
      'api',
      'webhook',
      'integration',
      'saas',
      'platform',
      'service',
      'tool',
      'how',
      'what',
      'where',
      'when',
      'why',
      'help',
      'explain',
      'show',
      'guide',
    ];

    // Define off-topic indicators
    const offTopicIndicators = [
      'weather',
      'recipe',
      'cooking',
      'movie',
      'music',
      'sports',
      'politics',
      'religion',
      'personal',
      'medical',
      'legal',
      'financial advice',
      'investment',
      'crypto',
      'bitcoin',
      'trading',
      'gambling',
      'dating',
      'relationship',
      'essay writing',
    ];

    // Check for explicit off-topic content
    for (const indicator of offTopicIndicators) {
      if (sanitized.includes(indicator)) {
        return {
          isValid: false,
          error:
            'Please ask questions related to the Dionysus platform, development, or the current page.',
        };
      }
    }

    // Check for platform relevance
    const hasRelevantKeyword = platformKeywords.some(
      (keyword) => sanitized.includes(keyword) || question.length < 50, // Allow short questions
    );

    if (!hasRelevantKeyword && question.length > 50) {
      return {
        isValid: false,
        error:
          'Please ask questions related to this page, the Dionysus platform, or development topics.',
      };
    }

    return { isValid: true };
  };

  // Rate limiting function
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    try {
      const rateLimitData = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      let timestamps: number[] = [];

      if (rateLimitData) {
        timestamps = JSON.parse(rateLimitData).filter((timestamp: number) => timestamp > hourAgo);
      }

      if (timestamps.length >= MAX_QUESTIONS_PER_HOUR) {
        setInputError(
          `Rate limit reached. You can ask ${MAX_QUESTIONS_PER_HOUR} questions per hour.`,
        );
        return false;
      }

      timestamps.push(now);
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(timestamps));
      setRateLimitCount(timestamps.length);
      return true;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return true; // Allow on error
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    ) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuestion((prev) => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setToastMessage('Voice recognition failed');
        setTimeout(() => setToastMessage(''), 2000);
      };
      setRecognition(recognitionInstance);
    }
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      const savedContext = localStorage.getItem(STORAGE_CONTEXT_KEY);

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      }

      if (savedContext) {
        setCurrentContext(savedContext);
      }
    } catch (error) {
      console.error('Error loading conversation from localStorage:', error);
    }
  }, []);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving conversation to localStorage:', error);
      }
    }
  }, [messages]);

  // Save context to localStorage whenever it changes
  useEffect(() => {
    if (currentContext) {
      try {
        localStorage.setItem(STORAGE_CONTEXT_KEY, currentContext);
      } catch (error) {
        console.error('Error saving context to localStorage:', error);
      }
    }
  }, [currentContext]);

  // Auto-scroll to bottom when new messages are added with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current) {
      // Find the ScrollArea viewport (which is usually a div with data-radix-scroll-area-viewport)
      const scrollViewport = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]');

      if (scrollViewport) {
        setTimeout(() => {
          scrollViewport.scrollTo({
            top: scrollViewport.scrollHeight,
            behavior: 'smooth',
          });
          // Update scroll button state after auto-scroll
          setTimeout(() => {
            const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
            setShowScrollToBottom(!isAtBottom && messages.length > 0);
          }, 300);
        }, 100);
      } else {
        // Fallback to the ScrollArea element or parent element scrolling
        const scrollElement =
          messagesEndRef.current.closest('.scroll-area') || messagesEndRef.current.parentElement;
        if (scrollElement) {
          setTimeout(() => {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'smooth',
            });
            // Update scroll button state after auto-scroll
            setTimeout(() => {
              const { scrollTop, scrollHeight, clientHeight } = scrollElement;
              const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
              setShowScrollToBottom(!isAtBottom && messages.length > 0);
            }, 300);
          }, 100);
        }
      }
    }
  }, [messages, isLoading]);

  // Scroll detection for show/hide scroll to bottom button
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (messagesEndRef.current && messages.length > 0) {
          const scrollViewport = messagesEndRef.current.closest(
            '[data-radix-scroll-area-viewport]',
          );
          const scrollElement =
            scrollViewport ||
            messagesEndRef.current.closest('.scroll-area') ||
            messagesEndRef.current.parentElement;

          if (scrollElement) {
            const { scrollTop, scrollHeight, clientHeight } = scrollElement;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // Increased threshold to 50px
            setShowScrollToBottom(!isAtBottom && messages.length > 1); // Show if not at bottom and has more than 1 message
          }
        }
      }, 50); // 50ms debounce
    };

    // Add scroll listener to the scroll area
    if (messagesEndRef.current) {
      const scrollViewport = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]');
      const scrollElement =
        scrollViewport ||
        messagesEndRef.current.closest('.scroll-area') ||
        messagesEndRef.current.parentElement;

      if (scrollElement) {
        scrollElement.addEventListener('scroll', handleScroll);
        // Trigger initial check
        setTimeout(handleScroll, 100);
        return () => {
          clearTimeout(scrollTimeout);
          scrollElement.removeEventListener('scroll', handleScroll);
        };
      }
    }

    return () => clearTimeout(scrollTimeout);
  }, [messages.length]);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const scrollViewport = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]');
      const scrollElement =
        scrollViewport ||
        messagesEndRef.current.closest('.scroll-area') ||
        messagesEndRef.current.parentElement;

      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth',
        });

        // Hide the scroll button immediately and check again after scroll animation
        setShowScrollToBottom(false);
        setTimeout(() => {
          const { scrollTop, scrollHeight, clientHeight } = scrollElement;
          const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
          setShowScrollToBottom(!isAtBottom && messages.length > 1);
        }, 100); // Reduced timeout for faster response
      }
    }
  };

  const capturePageContext = React.useCallback(() => {
    try {
      // Get page title
      const title = document.title;

      // Get visible text content (excluding scripts and styles)
      const content = document.body.innerText || document.body.textContent || '';

      // Get current URL and pathname
      const url = window.location.href;

      // Get meta description
      const metaDescription =
        document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      // Get main headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h) => h.textContent?.trim())
        .filter(Boolean);

      // Get navigation items
      const navItems = Array.from(document.querySelectorAll('nav a, [role="navigation"] a'))
        .map((a) => a.textContent?.trim())
        .filter(Boolean);

      const context = `
  CURRENT PAGE CONTEXT:
  URL: ${url}
  Title: ${title}
  Meta Description: ${metaDescription}
  Main Headings: ${headings.join(', ')}
  Navigation Items: ${navItems.join(', ')}
  Current Route: ${pathname}

  VISIBLE CONTENT (first 2000 characters):
  ${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}
        `.trim();

      setCurrentContext(context);
    } catch (error) {
      console.error('Error capturing page context:', error);
      setCurrentContext(`Current route: ${pathname}\nURL: ${window.location.href}`);
    }
  }, [pathname]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        setIsOpen(true);
        // Page context will be captured in the isOpen useEffect
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, capturePageContext]);

  // Focus textarea when modal opens and scroll to bottom if there are messages
  useEffect(() => {
    if (isOpen) {
      // Capture page context when modal opens
      capturePageContext();

      if (textareaRef.current) {
        textareaRef.current.focus();
      }

      // Scroll to bottom if there are messages
      if (messages.length > 0 && messagesEndRef.current) {
        setTimeout(() => {
          const scrollViewport = messagesEndRef.current?.closest(
            '[data-radix-scroll-area-viewport]',
          );
          const scrollElement =
            scrollViewport ||
            messagesEndRef.current?.closest('.scroll-area') ||
            messagesEndRef.current?.parentElement;

          if (scrollElement) {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 150); // Slight delay to ensure DOM is ready
      }
    }
  }, [isOpen, messages.length, capturePageContext]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && event.target === overlayRef.current) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cleanup effect for URL objects
  useEffect(() => {
    return () => {
      // Cleanup any URL objects when component unmounts
      attachedFiles.forEach((file) => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [attachedFiles]);

  // File handling functions
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
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

    // Security: Check for suspicious file names
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.sh$/i,
      /\.scr$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.cmd$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.app$/i,
      /\.deb$/i,
      /\.rpm$/i,
      /\.dmg$/i,
      /\.pkg$/i,
      /\.msi$/i,
    ];

    const hasSuspiciousName = suspiciousPatterns.some((pattern) => pattern.test(file.name));

    if (hasSuspiciousName) {
      return { isValid: false, error: 'File type not allowed for security reasons.' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please use text, image, PDF, or document files.',
      };
    }

    // Additional check for empty files
    if (file.size === 0) {
      return { isValid: false, error: 'Empty files are not allowed.' };
    }

    return { isValid: true };
  };

  const processFile = async (file: File): Promise<FileAttachment> => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (file.type.startsWith('image/')) {
      // Convert image to base64 for API processing and create blob URL for preview
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      return {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // For preview only
        content: dataUrl, // For API processing
      };
    } else if (file.type.startsWith('text/') || file.type === 'application/json') {
      const content = await file.text();
      return {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content.substring(0, 5000), // Limit content length
      };
    } else {
      // For other file types (PDFs, docs), convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      return {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: dataUrl,
      };
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxFiles = 5;

    if (attachedFiles.length + fileArray.length > maxFiles) {
      setInputError(`You can only attach up to ${maxFiles} files at once.`);
      return;
    }

    const newAttachments: FileAttachment[] = [];

    for (const file of fileArray) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setInputError(validation.error || 'Invalid file');
        return;
      }

      try {
        const attachment = await processFile(file);
        newAttachments.push(attachment);
      } catch (error) {
        console.error('Error processing file:', error);
        setInputError('Error processing file. Please try again.');
        return;
      }
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    setInputError('');
  };

  const removeAttachment = (fileId: string) => {
    setAttachedFiles((prev) => {
      const updated = prev.filter((file) => file.id !== fileId);
      // Clean up object URLs for images
      const removedFile = prev.find((file) => file.id === fileId);
      if (removedFile?.url) {
        URL.revokeObjectURL(removedFile.url);
      }
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (fileType.includes('text') || fileType.includes('json'))
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    setIsGenerating(false);

    // Update the last assistant message to indicate it was stopped
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        return prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: msg.content + '\n\n*[Generation stopped by user]*' }
            : msg,
        );
      }
      return prev;
    });
  };

  // Auto-select the best AI model based on the question
  const selectAutoModel = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    const wordCount = lowerQuestion.split(' ').length;
    const charCount = question.length;

    // Keywords that indicate web search or real-time information is needed
    const webSearchKeywords = [
      'current',
      'latest',
      'recent',
      'today',
      'news',
      'update',
      'price',
      'weather',
      'stock',
      'market',
      'trending',
      'popular',
      'search',
      'find',
      'lookup',
      'what is',
      'who is',
      'where is',
      'when is',
      'how much',
      'what are',
      'research',
      'analyze',
      'compare',
      'review',
      'vs',
      'versus',
      'ranking',
    ];

    // Keywords that indicate coding/programming questions
    const codingKeywords = [
      'code',
      'programming',
      'javascript',
      'typescript',
      'python',
      'java',
      'c++',
      'react',
      'next.js',
      'node.js',
      'html',
      'css',
      'sql',
      'database',
      'api',
      'function',
      'class',
      'variable',
      'algorithm',
      'debug',
      'error',
      'fix',
      'implement',
      'build',
      'deploy',
      'git',
      'github',
      'terminal',
      'command',
      'script',
      'framework',
      'library',
      'package',
      'npm',
      'yarn',
      'docker',
      'kubernetes',
      'aws',
      'azure',
      'gcp',
      'cloud',
      'server',
      'backend',
      'frontend',
    ];

    // Keywords that indicate complex reasoning or analysis
    const reasoningKeywords = [
      'explain',
      'why',
      'how does',
      'analyze',
      'reason',
      'logic',
      'strategy',
      'plan',
      'design',
      'architecture',
      'complex',
      'advanced',
      'deep',
      'philosophical',
      'theoretical',
      'mathematical',
      'scientific',
      'technical',
      'optimization',
      'performance',
      'security',
      'best practices',
      'patterns',
    ];

    // Keywords that indicate creative or generative tasks
    const creativeKeywords = [
      'create',
      'generate',
      'design',
      'write',
      'compose',
      'make',
      'build',
      'develop',
      'craft',
      'imagine',
      'innovate',
      'creative',
      'artistic',
    ];

    // Keywords that indicate mathematical or calculation tasks
    const mathKeywords = [
      'calculate',
      'compute',
      'math',
      'equation',
      'formula',
      'solve',
      'algebra',
      'geometry',
      'statistics',
      'probability',
      'optimization',
      'algorithm',
    ];

    // Check if web search is needed (highest priority)
    const needsWebSearch = webSearchKeywords.some((keyword) => lowerQuestion.includes(keyword));
    if (needsWebSearch && hasProPlan) {
      return 'perplexity-sonar-pro'; // Best for real-time web search
    }

    // Check if it's a coding question
    const isCodingQuestion = codingKeywords.some((keyword) => lowerQuestion.includes(keyword));
    if (isCodingQuestion) {
      if (hasProPlan) {
        return 'qwen/qwen3-coder:free'; // Specialized coding model
      } else {
        // For free users, use models with good coding capabilities
        if (charCount > 300) {
          return 'qwen-2.5-72b'; // Better for complex coding questions
        }
        return 'mistral-large-latest'; // Good balance for coding
      }
    }

    // Check if complex reasoning is needed
    const needsReasoning = reasoningKeywords.some((keyword) => lowerQuestion.includes(keyword));
    if (needsReasoning) {
      if (hasProPlan) {
        if (charCount > 500 || wordCount > 50) {
          return 'deepseek/deepseek-r1-0528:free'; // Best for deep reasoning
        }
        return 'openai/gpt-oss-120b'; // Good for complex analysis
      } else {
        return 'qwen-2.5-72b'; // Best free option for reasoning
      }
    }

    // Check for mathematical tasks
    const isMathQuestion = mathKeywords.some((keyword) => lowerQuestion.includes(keyword));
    if (isMathQuestion) {
      if (hasProPlan) {
        return 'deepseek/deepseek-r1-0528:free'; // Excellent at math
      } else {
        return 'qwen-2.5-72b'; // Good math capabilities
      }
    }

    // Check for creative tasks
    const isCreativeTask = creativeKeywords.some((keyword) => lowerQuestion.includes(keyword));
    if (isCreativeTask) {
      if (hasProPlan) {
        return 'groq-llama-3.3-70b'; // Good for creative tasks
      } else {
        return 'mistral-large-latest'; // Creative capabilities
      }
    }

    // For general questions - use different models based on complexity and user plan
    if (!hasProPlan) {
      // Free users get optimized selection
      if (charCount < 100) {
        return 'gemini-2.5-flash'; // Fast for simple questions
      } else if (charCount < 300) {
        return 'mistral-large-latest'; // Good balance
      } else {
        return 'qwen-2.5-32b'; // Better for longer questions
      }
    } else {
      // Pro users get access to premium models
      if (charCount < 100) {
        return 'gemini-2.5-flash'; // Still fast for simple questions
      } else if (charCount < 300) {
        return 'groq-llama-3.3-70b'; // Powerful for medium complexity
      } else if (charCount < 600) {
        return 'microsoft/mai-ds-r1:free'; // Heavy model for complex questions
      } else {
        return 'openai/gpt-oss-120b'; // Maximum capability for very complex questions
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we're in editing mode, handle the edit save
    if (isEditing) {
      await saveEditedMessage(e);
      return;
    }

    if (!question.trim() || isLoading) return;

    // Clear previous errors
    setInputError('');

    // Sanitize input
    const sanitizedQuestion = sanitizeInput(question);

    // Validate input length
    if (sanitizedQuestion.length < MIN_MESSAGE_LENGTH) {
      setInputError(`Question must be at least ${MIN_MESSAGE_LENGTH} characters long.`);
      return;
    }

    if (sanitizedQuestion.length > MAX_MESSAGE_LENGTH) {
      setInputError(`Question must be less than ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      return;
    }

    // Validate relevance
    const relevanceCheck = validateQuestionRelevance(sanitizedQuestion);
    if (!relevanceCheck.isValid) {
      setInputError(relevanceCheck.error || 'Invalid question');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: sanitizedQuestion,
      timestamp: new Date(),
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setAttachedFiles([]); // Clear attachments after sending
    setIsLoading(true);
    setIsGenerating(true);

    // Create AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Create assistant message with streaming content
    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      id: assistantMessageId,
      sources: [],
    };

    // Add the assistant message immediately
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Additional security: validate context before sending
      const safeContext = sanitizeInput(currentContext);

      // Prepare user information for personalization
      const userInfo = user
        ? {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            username: user.username || '',
            hasImage: !!user.imageUrl,
          }
        : null;

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Origin': window.location.origin, // Security header
        },
        body: JSON.stringify({
          question: sanitizedQuestion,
          context: safeContext,
          conversationHistory: messages.slice(-10).map((msg) => ({
            ...msg,
            content: sanitizeInput(msg.content),
          })), // Send last 10 messages for better context
          platform: 'dionysus', // Platform identifier
          userInfo: userInfo, // Add user information for personalization
          attachments: attachedFiles.length > 0 ? attachedFiles : undefined, // Include file attachments
          model: selectedModel === 'auto' ? selectAutoModel(sanitizedQuestion) : selectedModel, // Pass selected AI model (auto-select if needed)
        }),
        signal: controller.signal, // Add abort signal
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                  setIsLoading(false);
                  setIsGenerating(false);
                  setAbortController(null);
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'chunk') {
                    // Update the assistant message content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: msg.content + parsed.content }
                          : msg,
                      ),
                    );
                  } else if (parsed.type === 'sources') {
                    // Update the assistant message sources
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId ? { ...msg, sources: parsed.sources } : msg,
                      ),
                    );
                  } else if (parsed.type === 'followUpQuestions') {
                    // Update the assistant message follow-up questions
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, followUpQuestions: parsed.followUpQuestions }
                          : msg,
                      ),
                    );
                  } else if (parsed.type === 'complete') {
                    // Final update with sanitized content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              content: sanitizeInput(parsed.fullResponse),
                              sources: parsed.sources || [],
                              followUpQuestions: parsed.followUpQuestions || [],
                            }
                          : msg,
                      ),
                    );
                    setIsLoading(false);
                    setIsGenerating(false);
                    setAbortController(null);
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.error || 'Streaming error');
                  }
                } catch (parseError) {
                  console.error('Error parsing streaming data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Fallback for non-streaming response
        const data = await response.json();

        if (!data.answer || typeof data.answer !== 'string') {
          throw new Error('Invalid response format');
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: sanitizeInput(data.answer),
                  sources: data.sources || [],
                }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        // Don't show error message for user-initiated stops
        return;
      }

      // Update the assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  'I apologize, but I encountered an error while processing your question. Please try again with a question related to this page or the Dionysus platform.',
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleClose = () => {
    // Stop any ongoing generation when closing
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    setIsGenerating(false);
    // Cancel edit mode if active
    if (isEditing) {
      cancelEditing();
    }
    setIsOpen(false);
  };

  const clearConversation = () => {
    if (messages.length === 0) return;
    setShowClearDialog(true);
  };

  const confirmClearConversation = () => {
    setMessages([]);
    setInputError('');
    setRateLimitCount(0);

    // Clear from localStorage as well
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_CONTEXT_KEY);
      // Reset rate limit when clearing conversation
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing conversation from localStorage:', error);
    }

    setShowClearDialog(false);
  };

  // Edit message functions
  const startEditingMessage = (messageId: string, content: string) => {
    setIsEditing(true);
    setEditingMessageId(messageId);
    setOriginalMessage(content);
    setQuestion(content);
    setInputError('');
    // Clear any attached files when editing
    setAttachedFiles([]);
    // Focus the textarea
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingMessageId(null);
    setOriginalMessage('');
    setQuestion('');
    setInputError('');
    setAttachedFiles([]);
  };

  const saveEditedMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !editingMessageId) return;

    // Clear previous errors
    setInputError('');

    // Sanitize input
    const sanitizedQuestion = sanitizeInput(question);

    // Validate input length
    if (sanitizedQuestion.length < MIN_MESSAGE_LENGTH) {
      setInputError(`Question must be at least ${MIN_MESSAGE_LENGTH} characters long.`);
      return;
    }

    if (sanitizedQuestion.length > MAX_MESSAGE_LENGTH) {
      setInputError(`Question must be less than ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    // Check rate limit (only if content actually changed)
    if (sanitizedQuestion !== originalMessage) {
      if (!checkRateLimit()) {
        return;
      }
    }

    // Validate relevance
    const relevanceCheck = validateQuestionRelevance(sanitizedQuestion);
    if (!relevanceCheck.isValid) {
      setInputError(relevanceCheck.error || 'Invalid question');
      return;
    }

    // Update the message in place
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === editingMessageId
          ? {
              ...msg,
              content: sanitizedQuestion,
              timestamp: new Date(), // Update timestamp
              attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
            }
          : msg,
      ),
    );

    // Clear edit state
    setIsEditing(false);
    setEditingMessageId(null);
    setOriginalMessage('');
    setQuestion('');
    setAttachedFiles([]);

    // If content changed, regenerate the assistant response
    if (sanitizedQuestion !== originalMessage) {
      // Find the assistant message that follows this user message
      const userMessageIndex = messages.findIndex((msg) => msg.id === editingMessageId);
      if (userMessageIndex !== -1) {
        const assistantMessageIndex = messages.findIndex(
          (msg, index) => index > userMessageIndex && msg.role === 'assistant',
        );

        if (assistantMessageIndex !== -1) {
          // Remove the old assistant response if it exists
          const assistantMessageId = messages[assistantMessageIndex]?.id;
          if (assistantMessageId) {
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));

            // Regenerate response with edited message
            await handleRegenerateForEdit(editingMessageId, sanitizedQuestion);
          }
        }
      }
    }
  };

  const handleRegenerateForEdit = async (userMessageId: string, editedContent: string) => {
    if (isLoading) return;

    // Set loading state
    setIsLoading(true);
    setIsGenerating(true);

    // Create AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Create new assistant message
    const newAssistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      id: newAssistantMessageId,
      sources: [],
      followUpQuestions: [],
    };

    // Add the new assistant message after the user message
    setMessages((prev) => {
      const userMessageIndex = prev.findIndex((msg) => msg.id === userMessageId);
      if (userMessageIndex === -1) return prev;

      const newMessages = [...prev];
      newMessages.splice(userMessageIndex + 1, 0, assistantMessage);
      return newMessages;
    });

    try {
      // Prepare user information for personalization
      const userInfo = user
        ? {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            username: user.username || '',
            hasImage: !!user.imageUrl,
          }
        : null;

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Origin': window.location.origin,
        },
        body: JSON.stringify({
          question: editedContent,
          context: currentContext,
          conversationHistory: messages.slice(-10).map((msg) => ({
            ...msg,
            content: sanitizeInput(msg.content),
          })),
          platform: 'dionysus',
          userInfo: userInfo,
          model: selectedModel === 'auto' ? selectAutoModel(editedContent) : selectedModel,
          isRegeneration: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                  setIsLoading(false);
                  setIsGenerating(false);
                  setAbortController(null);
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'chunk') {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === newAssistantMessageId
                          ? { ...msg, content: msg.content + parsed.content }
                          : msg,
                      ),
                    );
                  } else if (parsed.type === 'sources') {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === newAssistantMessageId
                          ? { ...msg, sources: parsed.sources }
                          : msg,
                      ),
                    );
                  } else if (parsed.type === 'complete') {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === newAssistantMessageId
                          ? {
                              ...msg,
                              content: sanitizeInput(parsed.fullResponse),
                              sources: parsed.sources || [],
                            }
                          : msg,
                      ),
                    );
                    setIsLoading(false);
                    setIsGenerating(false);
                    setAbortController(null);
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.error || 'Streaming error');
                  }
                } catch (parseError) {
                  console.error('Error parsing streaming data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Fallback for non-streaming response
        const data = await response.json();

        if (!data.answer || typeof data.answer !== 'string') {
          throw new Error('Invalid response format');
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newAssistantMessageId
              ? {
                  ...msg,
                  content: sanitizeInput(data.answer),
                  sources: data.sources || [],
                }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error('Error regenerating response for edited message:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newAssistantMessageId
            ? {
                ...msg,
                content:
                  'I apologize, but I encountered an error while regenerating the response. Please try again.',
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  // Handle regenerating an assistant response
  const handleRegenerate = async (assistantMessageId: string) => {
    if (isLoading) return;

    // Find the assistant message and its corresponding user message
    const assistantMessageIndex = messages.findIndex((msg) => msg.id === assistantMessageId);
    if (assistantMessageIndex === -1) return;

    // Find the user message that prompted this response (should be right before the assistant message)
    let userMessageIndex = -1;
    for (let i = assistantMessageIndex - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg?.role === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex === -1) return;

    const userMessage = messages[userMessageIndex];
    if (!userMessage) {
      // Safety: if userMessage is unexpectedly undefined, abort regeneration
      return;
    }

    // Remove the current assistant message
    setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));

    // Set loading state
    setIsLoading(true);
    setIsGenerating(true);

    // Create AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Create new assistant message with streaming content
    const newAssistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      id: newAssistantMessageId,
      sources: [],
    };

    // Add the new assistant message
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Prepare user information for personalization
      const userInfo = user
        ? {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            username: user.username || '',
            hasImage: !!user.imageUrl,
          }
        : null;

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Origin': window.location.origin,
        },
        body: JSON.stringify({
          question: userMessage.content, // Use the original user question
          context: currentContext,
          conversationHistory: messages.slice(-10).map((msg) => ({
            ...msg,
            content: sanitizeInput(msg.content),
          })), // Send conversation history for better context
          platform: 'dionysus',
          userId: 'authenticated',
          userInfo: userInfo,
          attachments: userMessage.attachments, // Include original attachments
          model: selectedModel === 'auto' ? selectAutoModel(userMessage.content) : selectedModel,
          isRegeneration: true, // Flag to indicate this is a regeneration
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle streaming response (same as handleSubmit)
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                  setIsLoading(false);
                  setIsGenerating(false);
                  setAbortController(null);
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'chunk') {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === newAssistantMessageId
                          ? { ...msg, content: msg.content + parsed.content }
                          : msg,
                      ),
                    );
                  } else if (parsed.type === 'sources') {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === newAssistantMessageId
                          ? { ...msg, sources: parsed.sources }
                          : msg,
                      ),
                    );
                  } else if (parsed.type === 'complete') {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === newAssistantMessageId
                          ? {
                              ...msg,
                              content: sanitizeInput(parsed.fullResponse),
                              sources: parsed.sources || [],
                            }
                          : msg,
                      ),
                    );
                    setIsLoading(false);
                    setIsGenerating(false);
                    setAbortController(null);
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.error || 'Streaming error');
                  }
                } catch (parseError) {
                  console.error('Error parsing streaming data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Fallback for non-streaming response
        const data = await response.json();

        if (!data.answer || typeof data.answer !== 'string') {
          throw new Error('Invalid response format');
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newAssistantMessageId
              ? {
                  ...msg,
                  content: sanitizeInput(data.answer),
                  sources: data.sources || [],
                }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error('Error regenerating AI response:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newAssistantMessageId
            ? {
                ...msg,
                content:
                  'I apologize, but I encountered an error while regenerating the response. Please try again.',
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  // Copy message content to clipboard
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setToastMessage('Copied to clipboard!');
      setTimeout(() => setToastMessage(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setToastMessage('Failed to copy');
      setTimeout(() => setToastMessage(''), 2000);
    }
  };

  // Read message content aloud with toggle functionality
  const toggleReadAloud = (content: string, messageId: string) => {
    try {
      // If currently speaking this message, stop it
      if (isSpeaking && currentSpeakingId === messageId) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
        return;
      }

      // Stop any ongoing speech
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingId(null);

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Use a more natural voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith('en') &&
            (voice.name.includes('Natural') || voice.name.includes('Enhanced')),
        ) || voices.find((voice) => voice.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Set up event listeners
      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentSpeakingId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to read text aloud:', error);
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    }
  };

  // Start/stop voice input
  const toggleVoiceInput = () => {
    if (!recognition) {
      setToastMessage('Voice recognition not supported');
      setTimeout(() => setToastMessage(''), 2000);
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Handle follow-up question click
  const handleFollowUpQuestionClick = (question: string) => {
    setQuestion(question);
    // Auto-submit the question
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 100);
  };

  const quickQuestions = [
    'What features are available on this page?',
    'How do I navigate the Dionysus platform?',
    'What GitHub analytics can I view here?',
    'How does the AI assistant work?',
    'What collaboration tools are available?',
    'How do I manage my repositories?',
    'What meeting features does Dionysus offer?',
    'How do I configure my dashboard?',
  ];

  if (!isOpen) return null;

  // Show mobile prompt if on mobile device
  if (isMobile) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm dark:bg-black/80"
        style={{
          animation: isOpen ? 'fadeIn 0.2s ease-out' : undefined,
        }}
      >
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div
          className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-2xl dark:border-gray-700 dark:shadow-black/50"
          style={{
            animation: isOpen ? 'slideUp 0.3s ease-out' : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-4 top-4 h-6 w-6 p-0 hover:bg-muted dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
              <div className="relative">
                <Monitor className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                <Smartphone className="absolute -bottom-1 -right-1 h-4 w-4 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Switch to Desktop</h3>
            <p className="text-sm text-muted-foreground">
              The AI Assistant works best on larger screens for optimal file handling and
              conversation management.
            </p>
          </div>

          {/* Features List */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 dark:bg-gray-800/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FileImage className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-foreground">File upload & preview</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 dark:bg-gray-800/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Mic className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-foreground">Voice input & text-to-speech</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 dark:bg-gray-800/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-foreground">Enhanced AI conversations</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 dark:from-violet-500 dark:to-purple-500 dark:hover:from-violet-600 dark:hover:to-purple-600"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Continue on Desktop
            </Button>

            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full border-border hover:bg-muted dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Close Assistant
            </Button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                For the best experience with file uploads, voice input, and advanced features,
                please use a desktop or tablet device.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while authentication is loading
  if (!isLoaded) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70"
      >
        <div className="relative mx-4 flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl dark:border-gray-700 dark:shadow-black/50">
          <div className="flex h-[400px] items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show beautiful login UI for unauthenticated users
  if (!isSignedIn) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 pt-[5vh] backdrop-blur-sm dark:bg-black/70"
        style={{
          animation: isOpen ? 'fadeIn 0.2s ease-out' : undefined,
        }}
      >
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          @keyframes glow {
            0%,
            100% {
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
            }
            50% {
              box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
            }
          }
        `}</style>

        <div
          className="relative mx-4 flex h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background to-muted/30 shadow-2xl dark:border-gray-700 dark:from-gray-900 dark:to-gray-800/50 dark:shadow-black/50"
          style={{
            animation: isOpen ? 'slideUp 0.3s ease-out' : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>

          <ScrollArea className="flex-1">
            {/* Header with animated AI icon */}
            <div className="relative px-8 pb-8 pt-12 text-center">
              <div
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-400 dark:to-purple-500"
                style={{ animation: 'float 3s ease-in-out infinite, glow 2s ease-in-out infinite' }}
              >
                <Bot className="h-10 w-10 text-white" />
              </div>

              <h2 className="mb-3 text-2xl font-bold text-foreground">Meet Your AI Assistant</h2>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Get instant help, code suggestions, and insights about your repositories with our
                intelligent AI assistant.
              </p>
            </div>

            {/* Features */}
            <div className="px-8 pb-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-sm text-foreground">AI-powered code analysis</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-foreground">Smart suggestions & insights</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-foreground">24/7 development companion</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="px-8 pb-8">
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/sign-in')}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 dark:from-violet-500 dark:to-purple-500 dark:hover:from-violet-600 dark:hover:to-purple-600"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Continue
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-muted/20 px-8 py-4 dark:border-gray-700 dark:bg-gray-800/20">
              <p className="text-center text-xs text-muted-foreground">
                Join thousands of developers using Dionysus AI
              </p>
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 pt-[3vh] backdrop-blur-sm dark:bg-black/70"
      style={{
        animation: isOpen ? 'fadeIn 0.2s ease-out' : undefined,
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className="relative mx-4 flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl dark:border-gray-700 dark:shadow-black/50"
        style={{
          animation: isOpen ? 'slideUp 0.3s ease-out' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-violet-50 via-blue-50 to-purple-50 p-4 dark:border-gray-700 dark:from-violet-950/30 dark:via-blue-950/30 dark:to-purple-950/30">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 animate-pulse text-yellow-500 dark:text-yellow-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">AI Page Assistant</span>
              <div className="model-selector-container relative inline-block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="ml-2 h-6 gap-1 px-2 text-xs hover:bg-violet-100 dark:hover:bg-violet-900/50"
                >
                  {AI_MODELS.find((m) => m.id === selectedModel)?.icon}{' '}
                  {AI_MODELS.find((m) => m.id === selectedModel)?.name}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showModelSelector && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-background shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <div className="p-3">
                      <div className="mb-3 px-1 text-xs font-semibold text-muted-foreground">
                        Select AI Model
                      </div>
                      <Input
                        placeholder="Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="mb-3 h-8 text-sm"
                      />
                      <ScrollArea className="h-80">
                        <div className="space-y-1">
                          {AI_MODELS.filter(
                            (model) =>
                              model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                              model.description
                                .toLowerCase()
                                .includes(modelSearchQuery.toLowerCase()) ||
                              model.provider.toLowerCase().includes(modelSearchQuery.toLowerCase()),
                          ).map((model) => {
                            const isProOnly =
                              model.id !== 'auto' &&
                              (model.id === 'perplexity-sonar-pro' ||
                                model.id === 'openai/gpt-oss-120b' ||
                                model.id === 'microsoft/mai-ds-r1:free' ||
                                model.id === 'deepseek/deepseek-r1-0528:free');
                            const isDisabled = isProOnly && !hasProPlan;

                            return (
                              <button
                                key={model.id}
                                onClick={() => {
                                  if (!isDisabled) {
                                    setSelectedModel(model.id);
                                    setShowModelSelector(false);
                                    setModelSearchQuery('');
                                  }
                                }}
                                disabled={isDisabled}
                                className={`w-full rounded-md p-2 text-left transition-colors ${
                                  isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted'
                                } ${
                                  selectedModel === model.id
                                    ? 'bg-violet-50 dark:bg-violet-900/20'
                                    : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-lg">{model.icon}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-sm font-medium ${
                                          isDisabled ? 'text-muted-foreground' : 'text-foreground'
                                        }`}
                                      >
                                        {model.name}
                                      </span>
                                      {isProOnly && (
                                        <Badge
                                          variant="outline"
                                          className="border-orange-200 text-xs text-orange-700 dark:border-orange-800 dark:text-orange-300"
                                        >
                                          Pro
                                        </Badge>
                                      )}
                                      {selectedModel === model.id && !isDisabled && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-violet-100 text-xs text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                                        >
                                          Active
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {model.description}
                                    </div>
                                    <div className="mt-1 flex gap-2 text-xs">
                                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        {model.speed}
                                      </span>
                                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        {model.quality}
                                      </span>
                                    </div>
                                    {isDisabled && (
                                      <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                        Upgrade to Premium plan to unlock this model
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-xs text-muted-foreground sm:block">
              Press
              <kbd className="mx-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs shadow-sm dark:border-gray-600 dark:bg-gray-800">
                Esc
              </kbd>
              to close
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                className="h-7 text-xs hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                title={`Clear all ${messages.length} message${messages.length !== 1 ? 's' : ''}`}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear Chat
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-muted dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="relative flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="scroll-area h-full">
            <div className="space-y-4 p-4 pb-6">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[200px] items-center justify-center py-8 text-center">
                  <div>
                    <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium text-foreground">
                      Hi! I&apos;m your AI page assistant
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      I can help you understand this page and answer questions about what
                      you&apos;re seeing. Your conversation is automatically saved and will persist
                      across sessions.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Current page:{' '}
                      <span className="rounded bg-muted px-2 py-1 font-mono text-xs dark:bg-gray-800">
                        {pathname}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    // Check if this is the last user message
                    const isLastUserMessage =
                      message.role === 'user' &&
                      messages.slice(index + 1).every((msg) => msg.role === 'assistant');

                    return (
                      <div
                        key={message.id}
                        className={`group flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 ring-2 ring-violet-200 dark:bg-violet-900/50 dark:ring-violet-800">
                            <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          </div>
                        )}
                        <div className="relative max-w-[85%]">
                          <div
                            className={`rounded-lg p-3 shadow-sm ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground dark:bg-blue-600 dark:text-white'
                                : 'border bg-card text-card-foreground dark:border-gray-700 dark:bg-gray-800'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              <div>
                                <div
                                  data-color-mode={theme === 'dark' ? 'dark' : 'light'}
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                >
                                  <MDEditor.Markdown
                                    source={message.content}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: 'inherit',
                                    }}
                                  />
                                </div>
                                {message.sources && message.sources.length > 0 && (
                                  <div className="mt-3 border-t border-border pt-2 dark:border-gray-600">
                                    <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                      <ExternalLink className="h-3 w-3" />
                                      Sources:
                                    </div>
                                    <div className="space-y-1">
                                      {message.sources.map((source, index) => (
                                        <a
                                          key={index}
                                          href={source}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block text-xs text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                          {index + 1}. {source}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Follow-up Questions */}
                                {message.followUpQuestions &&
                                  message.followUpQuestions.length > 0 && (
                                    <div className="mt-3 border-t border-border pt-3 dark:border-gray-600">
                                      <div className="mb-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                        <Lightbulb className="h-3 w-3" />
                                        Follow-up Questions:
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {message.followUpQuestions.map((question, index) => (
                                          <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFollowUpQuestionClick(question)}
                                            disabled={isLoading}
                                            className="h-auto max-w-full cursor-pointer justify-start whitespace-normal rounded-lg border-border bg-muted/50 px-3 py-2 text-left text-xs hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-300"
                                            title={`Click to ask: ${question}`}
                                          >
                                            <span className="line-clamp-2">{question}</span>
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <div>
                                <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                                {/* Display Attachments for User Messages */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-3 border-t border-primary-foreground/20 pt-2">
                                    <div className="mb-2 flex items-center gap-1 text-xs font-medium opacity-80">
                                      <Paperclip className="h-3 w-3" />
                                      Attachments:
                                    </div>
                                    <div className="space-y-2">
                                      {message.attachments.map((attachment) => (
                                        <div
                                          key={attachment.id}
                                          className="flex items-center gap-2 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-2 py-1 text-xs"
                                        >
                                          {getFileIcon(attachment.type)}
                                          <span className="flex-1 truncate">{attachment.name}</span>
                                          <span className="opacity-70">
                                            {formatFileSize(attachment.size)}
                                          </span>
                                          {attachment.url &&
                                            attachment.type.startsWith('image/') && (
                                              // Just disabling the lint to prevent Image tag warnings
                                              // eslint-disable-next-line
                                              <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="h-8 w-8 cursor-pointer rounded object-cover"
                                                onError={(e) => {
                                                  // Hide image if it fails to load
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                                onClick={() => {
                                                  // Open image in new tab for larger view
                                                  window.open(attachment.url, '_blank');
                                                }}
                                              />
                                            )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-1 text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>

                          {/* Message Action Buttons - Visible on Hover */}
                          <div className="absolute -bottom-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                              className="h-6 w-6 rounded-full border border-border/50 bg-background/80 p-0 backdrop-blur-sm hover:bg-muted dark:border-gray-600/50 dark:bg-gray-800/80 dark:hover:bg-gray-700"
                              title="Copy message"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRegenerate(message.id)}
                                disabled={isLoading}
                                className="h-6 w-6 rounded-full border border-border/50 bg-background/80 p-0 backdrop-blur-sm hover:bg-muted dark:border-gray-600/50 dark:bg-gray-800/80 dark:hover:bg-gray-700"
                                title="Regenerate response"
                              >
                                <Sparkles className="h-3 w-3" />
                              </Button>
                            )}
                            {message.role === 'user' && isLastUserMessage && !isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingMessage(message.id, message.content)}
                                disabled={isLoading}
                                className="h-6 w-6 rounded-full border border-border/50 bg-background/80 p-0 backdrop-blur-sm hover:bg-muted dark:border-gray-600/50 dark:bg-gray-800/80 dark:hover:bg-gray-700"
                                title="Edit message"
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleReadAloud(message.content, message.id)}
                              className="h-6 w-6 rounded-full border border-border/50 bg-background/80 p-0 backdrop-blur-sm hover:bg-muted dark:border-gray-600/50 dark:bg-gray-800/80 dark:hover:bg-gray-700"
                              title={
                                currentSpeakingId === message.id ? 'Stop reading' : 'Read aloud'
                              }
                            >
                              {currentSpeakingId === message.id ? (
                                <VolumeX className="h-3 w-3" />
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary ring-2 ring-primary/20 dark:bg-blue-600 dark:ring-blue-500/20">
                            <span className="text-xs font-bold text-primary-foreground dark:text-white">
                              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 ring-2 ring-violet-200 dark:bg-violet-900/50 dark:ring-violet-800">
                        <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="max-w-[85%] rounded-lg border bg-card p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex gap-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-current"
                                style={{ animationDelay: '0.1s' }}
                              />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-current"
                                style={{ animationDelay: '0.2s' }}
                              />
                            </div>
                            <span>
                              {isGenerating ? 'AI is generating...' : 'AI is thinking...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Scroll to Bottom Button */}
          {(showScrollToBottom || messages.length > 1) && (
            <div className="absolute bottom-4 right-4 z-20">
              <Button
                onClick={scrollToBottom}
                variant="secondary"
                size="sm"
                className="h-10 w-10 rounded-full border border-border bg-white/95 p-0 shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-muted dark:bg-gray-800/95 dark:hover:bg-gray-700"
                title="Scroll to bottom"
              >
                <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-100" />
              </Button>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        {messages.length === 0 && (
          <div className="border-t border-border bg-muted/30 p-4 dark:border-gray-700 dark:bg-gray-800/30">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              Quick Questions
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {quickQuestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs transition-all duration-200 hover:bg-muted hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={isEditing ? saveEditedMessage : handleSubmit}
          className="border-t border-border bg-muted/20 p-4 dark:border-gray-700 dark:bg-gray-800/20"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Edit Mode Indicator */}
          {isEditing && (
            <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Editing message
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {/* Error Display */}
          {inputError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{inputError}</p>
              </div>
            </div>
          )}

          {/* File Attachments Display */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 rounded-lg border border-border bg-background/50 p-3 dark:border-gray-600 dark:bg-gray-800/50">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                Attached Files ({attachedFiles.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    {getFileIcon(file.type)}
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(file.id)}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Input Container */}
          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5 dark:border-blue-400 dark:bg-blue-400/5'
                : 'border-transparent'
            }`}
          >
            {/* Text Input with Integrated Send Button */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setInputError(''); // Clear error on input change
                }}
                placeholder={
                  isEditing
                    ? 'Edit your message...'
                    : 'Ask me about this page, Dionysus features, or development topics...'
                }
                className={`max-h-[120px] min-h-[44px] resize-none border-border bg-background pr-28 focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-violet-400 ${
                  inputError ? 'border-red-500 dark:border-red-400' : ''
                }`}
                maxLength={MAX_MESSAGE_LENGTH}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isEditing) {
                      saveEditedMessage(e);
                    } else {
                      handleSubmit(e);
                    }
                  } else if (e.key === 'Escape' && isEditing) {
                    e.preventDefault();
                    cancelEditing();
                  }
                }}
              />

              {/* Input Actions - File Upload, Voice, and Send */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                {/* File Upload Button */}
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".txt,.md,.csv,.json,.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                {/* Voice Input Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleVoiceInput}
                  disabled={!recognition}
                  className={`h-8 w-8 p-0 ${
                    isListening
                      ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                {/* Send/Stop Button */}
                {isGenerating ? (
                  <Button
                    type="button"
                    onClick={stopGeneration}
                    className="h-8 w-8 bg-red-500 p-0 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    title="Stop generation"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                ) : isEditing ? (
                  <Button
                    type="submit"
                    disabled={!question.trim() || isLoading || question.length < MIN_MESSAGE_LENGTH}
                    className="h-8 bg-green-500 px-3 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    title="Save edited message"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!question.trim() || isLoading || question.length < MIN_MESSAGE_LENGTH}
                    className="h-8 w-8 bg-primary p-0 hover:bg-primary/90 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Drag & Drop Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm dark:bg-blue-400/10">
                <div className="flex flex-col items-center gap-2 text-primary dark:text-blue-400">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm font-medium">Drop files here to attach</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 space-y-2">
            {/* Desktop Info Row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  Press{' '}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">
                    Enter
                  </kbd>{' '}
                  to {isEditing ? 'save' : 'send'},{' '}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">
                    Shift + Enter
                  </kbd>{' '}
                  for new line
                  {isEditing && (
                    <>
                      {', '}
                      <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">
                        Escape
                      </kbd>{' '}
                      to cancel
                    </>
                  )}
                </span>
                <span className="text-xs">
                  {question.length}/{MAX_MESSAGE_LENGTH}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  🌐 Web Search Enabled
                </span>
              </div>

              <div className="flex items-center gap-3">
                {rateLimitCount > 0 && (
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    {rateLimitCount}/{MAX_QUESTIONS_PER_HOUR} questions this hour
                  </span>
                )}
                {messages.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {messages.length} message{messages.length !== 1 ? 's' : ''} • Auto-saved
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Upload & Security Notice */}
          <div className="mt-2 space-y-2">
            {/* File Support Info */}
            <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <Paperclip className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Drag & drop or click 📎 to attach files. Supports: images, documents, text files
                  (max 10MB, 5 files)
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="rounded-md bg-violet-50 p-2 dark:bg-violet-950/20">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  Ask questions about Dionysus, development, or this page. Files are processed
                  securely. Web search capabilities.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Clear Conversation Confirmation Dialog */}
      {showClearDialog && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClearDialog(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowClearDialog(false);
            }
          }}
          tabIndex={-1}
        >
          <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl dark:border-gray-700">
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-foreground">Clear Chat History</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to clear all {messages.length} message
                {messages.length !== 1 ? 's' : ''}? This action cannot be undone and will remove
                your entire conversation history.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
                className="sm:mr-2"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmClearConversation}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 z-[10001] -translate-x-1/2 transform">
          <div className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalAIAssistant;
