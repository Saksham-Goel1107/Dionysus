'use client';
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import VoiceButton from '../components/VoiceButton';
import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionResult,
  SpeechRecognitionResultList,
  SpeechRecognitionAlternative,
} from '../types/speech-recognition';
import { useRouter } from 'next/navigation';
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface Command {
  command: string;
  description: string;
}

const formatMessageContent = (content: string) => {
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  content = content.replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold mt-2 mb-1">$1</h3>');
  content = content.replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-2 mb-1">$1</h2>');
  content = content.replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mt-2 mb-1">$1</h1>');

  content = content.replace(/(https?:\/\/[^\s]+)/g, (match) => {
    try {
      new URL(match);
      return `<a href="${match}" class="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">${match}</a>`;
    } catch {
      return match;
    }
  });

  const lines = content.split('\n');
  const formattedLines = lines.map((line) => {
    if (line.match(/^- /)) {
      return line.replace(
        /^- (.*?)$/,
        '<div class="flex mb-2"><span class="mr-2">•</span><div class="flex-1">$1</div></div>',
      );
    } else if (line.match(/^ {2}- /)) {
      return line.replace(
        /^ {2}- (.*?)$/,
        '<div class="flex mb-2 ml-6"><span class="mr-2">◦</span><div class="flex-1">$1</div></div>',
      );
    }
    return line;
  });

  content = formattedLines.join('\n');

  return content;
};

export default function AiChatSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [matchedCommand, setMatchedCommand] = useState<string>('');

  const commands: Command[] = [];

  const handleCommandSelection = (command: string) => {
    setMessage(command + ' ');
    setShowCommandSuggestions(false);
    setMatchedCommand('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    const lastAtIndex = newValue.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const currentCommand = newValue.slice(lastAtIndex).toLowerCase();
      const matchingCommand = commands.find((cmd) =>
        cmd.command.toLowerCase().startsWith(currentCommand),
      );

      if (matchingCommand) {
        setShowCommandSuggestions(true);
        setMatchedCommand(currentCommand.slice(1));
      } else {
        setShowCommandSuggestions(false);
        setMatchedCommand('');
      }
    } else {
      setShowCommandSuggestions(false);
      setMatchedCommand('');
    }
  };

  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    const newSessionId = savedSessionId || crypto.randomUUID();
    setSessionId(newSessionId);

    if (!savedSessionId) {
      localStorage.setItem('chatSessionId', newSessionId);
    }

    try {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      localStorage.removeItem('chatHistory');
    }
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // Extend the window interface for TypeScript
      type WebkitSpeechRecognitionType = typeof window & {
        webkitSpeechRecognition: new () => SpeechRecognition;
      };
      const SpeechRecognition = (window as WebkitSpeechRecognitionType).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results as SpeechRecognitionResultList)
          .map((result: SpeechRecognitionResult) => result[0])
          .filter(
            (alternative): alternative is SpeechRecognitionAlternative => alternative !== undefined,
          )
          .map((alternative: SpeechRecognitionAlternative) => alternative.transcript as string)
          .join('');
        setMessage(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message;
    setMessage('');

    setChatHistory((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error('Failed to get AI response');
      }

      const remainingRequests = response.headers.get('X-RateLimit-Remaining');
      const rateLimitTotal = response.headers.get('X-RateLimit-Limit');

      const data = await response.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        },
      ]);

      if (remainingRequests && rateLimitTotal) {
        const remaining = parseInt(remainingRequests);
        const total = parseInt(rateLimitTotal);

        if (remaining <= Math.max(2, Math.floor(total * 0.2))) {
          setChatHistory((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `⚠️ Rate limit warning: You have ${remaining} of ${total} requests remaining for this minute.`,
              timestamp: Date.now(),
            },
          ]);
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error.message || 'I apologize, but I encountered an error. Please try again',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);
  };

  const toggleVoice = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 transform bg-gray-900 shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className={`flex items-center justify-between border-b border-gray-700 p-4`}>
            <div className="flex items-center space-x-2">
              <h2 className={`font-semibold text-white`}>Dionysus Assistant</h2>
            </div>{' '}
            <div className="flex items-center space-x-2">
              <button
                onClick={clearHistory}
                className={`rounded-full p-2 hover:bg-gray-800`}
                title="Clear chat history"
              >
                <svg className="h-5 w-5" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button onClick={onClose} className={`rounded-full p-2 hover:bg-gray-800`}>
                <svg className="h-5 w-5" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>{' '}
          <div className={`flex-1 overflow-y-auto p-4 text-gray-100`}>
            {chatHistory.length === 0 && (
              <div className={`mt-2 text-center text-gray-400`}>
                <p>👋 Hi! I&apos;m your Dionysus assistant.</p>
                <p className="mt-2">Ask me anything about the platform!</p>
              </div>
            )}{' '}
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                } w-full`}
              >
                <div
                  className={`rounded-lg p-3 ${
                    msg.role === 'user' ? `bg-blue-500 text-white` : 'bg-gray-800'
                  } relative max-w-[95%] whitespace-pre-wrap break-words`}
                >
                  <div
                    className="message-content text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(formatMessageContent(msg.content)),
                    }}
                  />

                  <div className="mt-1 flex select-none items-center gap-1 text-[10px] opacity-70">
                    {msg.role === 'assistant' && (
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                    )}
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            )}
          </div>{' '}
          <div className={`border-t border-gray-700 p-4`}>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <textarea
                  value={message}
                  onChange={handleChange}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())
                  }
                  placeholder="Ask me anything..."
                  rows={1}
                  className={`w-full resize-none overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-2 pr-10 text-white [-ms-overflow-style:none] [scrollbar-width:none] focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-scrollbar]:hidden`}
                  suppressHydrationWarning
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 transform">
                  {<VoiceButton isListening={isListening} onClick={toggleVoice} />}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!message.trim()) {
                    router.push('/talking');
                    onClose();
                  } else {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className={`rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {!message.trim() ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon"
                  >
                    <path d="M7.33496 15.5V4.5C7.33496 4.13275 7.63275 3.83499 8 3.83496C8.36727 3.83496 8.66504 4.13273 8.66504 4.5V15.5C8.66504 15.8673 8.36727 16.165 8 16.165C7.63275 16.165 7.33496 15.8673 7.33496 15.5ZM11.335 13.1309V7.20801C11.335 6.84075 11.6327 6.54298 12 6.54297C12.3673 6.54297 12.665 6.84074 12.665 7.20801V13.1309C12.665 13.4981 12.3672 13.7959 12 13.7959C11.6328 13.7959 11.335 13.4981 11.335 13.1309ZM3.33496 11.3535V8.81543C3.33496 8.44816 3.63273 8.15039 4 8.15039C4.36727 8.15039 4.66504 8.44816 4.66504 8.81543V11.3535C4.66504 11.7208 4.36727 12.0186 4 12.0186C3.63273 12.0186 3.33496 11.7208 3.33496 11.3535ZM15.335 11.3535V8.81543C15.335 8.44816 15.6327 8.15039 16 8.15039C16.3673 8.15039 16.665 8.44816 16.665 8.81543V11.3535C16.665 11.7208 16.3673 12.0186 16 12.0186C15.6327 12.0186 15.335 11.7208 15.335 11.3535Z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
