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
  Copy,
  ExternalLink,
  Lightbulb,
  LogIn,
  Mic,
  MicOff,
  Send,
  Shield,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
  sources?: string[];
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

  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { isLoaded, isSignedIn } = useUser();

  // Security and validation constants
  const MAX_QUESTIONS_PER_HOUR = 50;
  const MAX_MESSAGE_LENGTH = 1000;
  const MIN_MESSAGE_LENGTH = 3;
  const RATE_LIMIT_STORAGE_KEY = 'dionysus-ai-rate-limit';

  // Storage key for persistence
  const STORAGE_KEY = 'dionysus-ai-assistant-conversation';
  const STORAGE_CONTEXT_KEY = 'dionysus-ai-assistant-context';

  // Security function to sanitize input
  const sanitizeInput = (input: string): string => {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
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
          }, 100);
        }
      }
    }
  }, [messages, isLoading]);

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
      if (event.ctrlKey && event.shiftKey && event.key === 'J') {
        event.preventDefault();
        setIsOpen(true);
        // Capture current page context when opening
        capturePageContext();
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, capturePageContext]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

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

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Origin': window.location.origin, // Security header
        },
        body: JSON.stringify({
          question: sanitizedQuestion,
          context: safeContext,
          conversationHistory: messages.slice(-5).map((msg) => ({
            ...msg,
            content: sanitizeInput(msg.content),
          })), // Sanitize history
          platform: 'dionysus', // Platform identifier
          userId: 'authenticated', // Don't send actual user ID for privacy
        }),
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
                  } else if (parsed.type === 'complete') {
                    // Final update with sanitized content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              content: sanitizeInput(parsed.fullResponse),
                              sources: parsed.sources || [],
                            }
                          : msg,
                      ),
                    );
                    setIsLoading(false);
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
    }
  };

  const handleClose = () => {
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
              <Badge
                variant="secondary"
                className="ml-2 bg-violet-100 text-xs text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
              >
                Powered by Gemini
              </Badge>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-xs text-muted-foreground sm:block">
              Press
              <kbd className="rounded border border-border bg-background mx-1 px-1.5 py-0.5 text-xs shadow-sm dark:border-gray-600 dark:bg-gray-800">
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
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="scroll-area h-full">
            <div className="space-y-4 p-4 pb-6" style={{ minHeight: '400px' }}>
              {messages.length === 0 ? (
                <div className="py-8 text-center">
                  <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium text-foreground">
                    Hi! I&apos;m your AI page assistant
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    I can help you understand this page and answer questions about what you&apos;re
                    seeing. Your conversation is automatically saved and will persist across
                    sessions.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Current page:{' '}
                    <span className="rounded bg-muted px-2 py-1 font-mono text-xs dark:bg-gray-800">
                      {pathname}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
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
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReadAloud(message.content, message.id)}
                            className="h-6 w-6 rounded-full border border-border/50 bg-background/80 p-0 backdrop-blur-sm hover:bg-muted dark:border-gray-600/50 dark:bg-gray-800/80 dark:hover:bg-gray-700"
                            title={currentSpeakingId === message.id ? 'Stop reading' : 'Read aloud'}
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
                            U
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 ring-2 ring-violet-200 dark:bg-violet-900/50 dark:ring-violet-800">
                        <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="max-w-[85%] rounded-lg border bg-card p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                          <span>AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
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
          onSubmit={handleSubmit}
          className="border-t border-border bg-muted/20 p-4 dark:border-gray-700 dark:bg-gray-800/20"
        >
          {/* Error Display */}
          {inputError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{inputError}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setInputError(''); // Clear error on input change
              }}
              placeholder="Ask me about this page, Dionysus features, or development topics..."
              className={`max-h-[120px] min-h-[44px] flex-1 resize-none border-border bg-background focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-violet-400 ${
                inputError ? 'border-red-500 dark:border-red-400' : ''
              }`}
              maxLength={MAX_MESSAGE_LENGTH}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="button"
              onClick={toggleVoiceInput}
              disabled={!recognition}
              className={`self-end ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                  : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
              }`}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              type="submit"
              disabled={!question.trim() || isLoading || question.length < MIN_MESSAGE_LENGTH}
              className="self-end bg-primary hover:bg-primary/90 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden mt-2 md:flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Press{' '}
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">
                  Enter
                </kbd>{' '}
                to send,{' '}
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">
                  Shift + Enter
                </kbd>{' '}
                for new line
              </span>
              <span className="text-xs">
                {question.length}/{MAX_MESSAGE_LENGTH}
              </span>
              {recognition && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  🎤 Voice input available
                </span>
              )}
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

          {/* Security Notice */}
          <div className="mt-2 rounded-md bg-violet-50 p-2 dark:bg-violet-950/20">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-violet-600 dark:text-violet-400" />
              <p className="text-xs text-violet-700 dark:text-violet-300">
                Ask questions about Dionysus, development, or this page.
              </p>
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
