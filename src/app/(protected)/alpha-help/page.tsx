'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@clerk/nextjs';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Shield,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface StoredChatSession {
  messages: ChatMessage[];
  lastActivity: number;
  userId: string;
}

export default function AlphaHelpPage() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAlphaTester, setIsAlphaTester] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = 'alpha-chat-session';
  const SESSION_DURATION = 60 * 60 * 1000;

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest',
        });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat session from localStorage
  const loadChatSession = useCallback(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: StoredChatSession = JSON.parse(stored);
        const now = Date.now();

        if (session.userId === user.id && now - session.lastActivity < SESSION_DURATION) {
          const messagesWithDates = session.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(messagesWithDates);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, STORAGE_KEY, SESSION_DURATION]);

  const saveChatSession = useCallback(
    (updatedMessages: ChatMessage[]) => {
      if (!user) return;

      try {
        const session: StoredChatSession = {
          messages: updatedMessages,
          lastActivity: Date.now(),
          userId: user.id,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (error) {
        console.error('Error saving chat session:', error);
      }
    },
    [user, STORAGE_KEY],
  );

  useEffect(() => {
    const cleanup = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session: StoredChatSession = JSON.parse(stored);
          const now = Date.now();

          if (now - session.lastActivity >= SESSION_DURATION) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    cleanup();
    const interval = setInterval(cleanup, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [SESSION_DURATION]);

  useEffect(() => {
    if (user && isAlphaTester === true) {
      loadChatSession();
    }
  }, [user, isAlphaTester, loadChatSession]);

  useEffect(() => {
    if (messages.length > 0 && user) {
      saveChatSession(messages);
    }
  }, [messages, user, saveChatSession]);

  useEffect(() => {
    const checkAlphaAccess = async () => {
      if (!isLoaded || !user) {
        setIsCheckingAccess(false);
        return;
      }

      try {
        const response = await fetch('/api/ab-testing/status');
        if (response.ok) {
          const data = await response.json();
          setIsAlphaTester(data.abTestingOptIn === true);

          if (data.abTestingOptIn === true) {
            const stored = localStorage.getItem(STORAGE_KEY);
            let hasExistingSession = false;

            if (stored) {
              try {
                const session: StoredChatSession = JSON.parse(stored);
                const now = Date.now();
                hasExistingSession =
                  session.userId === user.id && now - session.lastActivity < SESSION_DURATION;
              } catch {
                localStorage.removeItem(STORAGE_KEY);
              }
            }

            if (!hasExistingSession) {
              const welcomeMessage: ChatMessage = {
                id: 'welcome',
                content: `Welcome to Alpha Support, ${user.firstName || 'Alpha Tester'}! 🚀\n\nI'm your AI assistant here to help with any questions, feedback, or support needs you might have. As an alpha tester, your input is incredibly valuable to us.\n\nI can help you with:\n• 🐛 Bug reports\n• 💡 Feature suggestions\n• 🔧 Technical issues\n• ❓ General questions\n• 💬 Feedback and suggestions\n\nJust describe what's on your mind in natural language, and I'll provide you with helpful responses!`,
                isUser: false,
                timestamp: new Date(),
              };
              setMessages([welcomeMessage]);
            }
          }
        } else {
          setIsAlphaTester(false);
        }
      } catch (error) {
        console.error('Failed to check alpha tester status:', error);
        setIsAlphaTester(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAlphaAccess();
  }, [isLoaded, user, SESSION_DURATION]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || !user) return;

    const messageToSend = currentMessage.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      return updated;
    });
    setCurrentMessage('');
    setIsLoading(true);

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      content: 'Processing your message...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const payload = {
        message: messageToSend,
        userInfo: {
          name: user.fullName || user.firstName,
          email: user.emailAddresses?.[0]?.emailAddress || '',
        },
      };

      const response = await fetch('/api/alpha-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          content:
            responseData.output ||
            'Your issue has been registered and we will look into it shortly. Thank you for your feedback!',
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const filtered = prev.filter((msg) => !msg.id.startsWith('loading-'));
          return [...filtered, aiMessage];
        });
      } else {
        throw new Error('Failed to send message to support system');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: `❌ Sorry, there was an issue sending your message.\n\nPlease try again in a few moments. If the problem persists, you can reach out to our team directly at support@dionysus.dev\n\nYour message: "${messageToSend}" has been saved locally and we'll make sure it gets to our development team.`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.id.startsWith('loading-'));
        return [...filtered, errorMessage];
      });

      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isLoaded || isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verifying alpha tester access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the alpha testing support center.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isAlphaTester === false) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="mx-auto h-16 w-16 text-amber-500" />
            <CardTitle className="text-amber-700">Alpha Access Required</CardTitle>
            <CardDescription>
              This support center is exclusively for alpha and beta testers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to be enrolled in our Alpha Testing Program to access this support center.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-muted-foreground">
              Interested in becoming an alpha tester? Click the user button in the header twice and
              check for available spots in the alpha testing program. Then get registered for it.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen max-w-4xl flex-col p-4">
      <div className="mb-6 flex-shrink-0">
        <div className="mb-2 flex items-center gap-2">
          <Bot className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Alpha Support Center</h1>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Chat with our AI assistant for support, feedback, questions, or general help. Get instant
          responses and assistance from our intelligent support system. Get your issues resolved
          quickly.
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
              <span className="font-medium">AI Assistant Online</span>
            </div>
            <Badge variant="outline" className="border-green-200 text-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Alpha Support
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isUser && (
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] break-words rounded-lg px-4 py-3 ${
                        message.isUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{message.content}</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        {message.timestamp.toLocaleTimeString()}
                        {message.priority && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              message.priority === 'high' ? 'border-red-200 text-red-600' : ''
                            }`}
                          >
                            {message.priority} priority
                          </Badge>
                        )}
                      </div>
                    </div>

                    {message.isUser && (
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </ScrollArea>
          </div>

          <div className="flex-shrink-0 border-t bg-white p-4 dark:bg-gray-900">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your issue, bug, or feature request..."
                className="flex-1"
                disabled={isLoading}
                maxLength={1000}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press Enter to send • High Priority Solution • AI-powered responses
              </p>
              <p className="text-xs text-muted-foreground">{currentMessage.length}/500</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
