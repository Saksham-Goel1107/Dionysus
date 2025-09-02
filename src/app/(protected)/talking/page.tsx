'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    // @ts-ignore
    webkitSpeechRecognition: any;
  }
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function TalkingPage() {
  const SYSTEM_PROMPT: Message = {
    role: 'system',
    content:
      'You are a helpful AI voice assistant for the Github-Saas project. Answer questions about this project and general topics. If asked about this project, answer as an expert. You are a voice agent: do not use code blocks, markdown, ###, or comments. Only say things that can be spoken and easily understood.',
  };

  // State variables
  const [listening, setListening] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [voicePitch, setVoicePitch] = useState(1);
  const [_active, setActive] = useState(false);
  const [_speakingNow, setSpeakingNow] = useState('');
  const [_messages, setMessages] = useState<Message[]>([]);
  const [isAlphaBetaTester, setIsAlphaBetaTester] = useState(false);
  const [isLoadingAbStatus, setIsLoadingAbStatus] = useState(true);

  // Refs
  const speechRef = useRef<any>(null);
  const lastUserCommand = useRef('');
  const stoppedByUser = useRef(false);
  const speakingActive = useRef(false);
  const recognitionActive = useRef(false);
  const clearContextNext = useRef(false);

  const { user } = useUser();

  // Check A/B testing status
  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      fetch('/api/ab-testing/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.abTestingOptIn) {
            setIsAlphaBetaTester(true);
          } else {
            setIsAlphaBetaTester(false);
          }
          setIsLoadingAbStatus(false);
        })
        .catch(() => {
          setIsAlphaBetaTester(false);
          setIsLoadingAbStatus(false);
        });
    } else {
      setIsAlphaBetaTester(false);
      setIsLoadingAbStatus(false);
    }

    return () => {
      if (speechRef.current) speechRef.current.abort();
      window.speechSynthesis.cancel();
      recognitionActive.current = false;
      speakingActive.current = false;
    };
  }, [user]);

  // Start speech recognition
  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    if (recognitionActive.current) return;
    if (speechRef.current) speechRef.current.abort();
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionActive.current = true;

    recognition.onresult = (event: any) => {
      const lastResult = event.results?.[event.results.length - 1];
      const transcript = lastResult?.[0]?.transcript;
      if (!transcript) {
        setListening(false);
        setActive(false);
        recognitionActive.current = false;
        return;
      }

      const text = transcript.trim().toLowerCase();
      lastUserCommand.current = text;
      const stopCount = (text.match(/\bstop\b/g) || []).length;

      if (stopCount >= 2) {
        stoppedByUser.current = true;
        clearContextNext.current = true;
        window.speechSynthesis.cancel();
        setSpeakingNow('');
        setAssistantSpeaking(false);
        setListening(false);
        setActive(false);
        recognition.abort();
        recognitionActive.current = false;
        return;
      } else {
        stoppedByUser.current = false;
        setListening(false);
        setActive(true);
        fetchLLMResponse(text);
        recognition.abort();
        recognitionActive.current = false;
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setActive(false);
      recognitionActive.current = false;
    };

    recognition.onend = () => {
      recognitionActive.current = false;
      if (!assistantSpeaking && !stoppedByUser.current) {
        setListening(false);
        setActive(false);
      }
    };

    speechRef.current = recognition;
    recognition.start();
    setListening(true);
    setActive(true);
  };

  // Fetch LLM response
  const fetchLLMResponse = async (text: string) => {
    setAssistantSpeaking(true);
    setSpeakingNow('');
    setMessages((prev) => {
      let updated;
      if (clearContextNext.current) {
        updated = [SYSTEM_PROMPT, { role: 'user', content: text } as Message];
        clearContextNext.current = false;
      } else {
        updated = [...prev, { role: 'user', content: text } as Message];
      }
      doFetch(updated);
      return updated;
    });
  };

  const doFetch = async (contextMessages: Message[]): Promise<void> => {
    try {
      const userMessages = contextMessages.filter((m) => m.role === 'user');
      const lastUser =
        userMessages.length > 0 && userMessages[userMessages.length - 1]
          ? userMessages[userMessages.length - 1]!.content
          : '';
      const history = contextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .map((m) => ({
          role: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content,
        }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: lastUser,
          analytics: {},
          history,
        }),
      });

      if (!res.ok) throw new Error('Gemini service unavailable');
      const data = await res.json();
      const geminiResponse = data.answer || '';

      if (geminiResponse.trim()) {
        setAssistantSpeaking(true);
        speakText(geminiResponse);
        setSpeakingNow(geminiResponse);
        speakingActive.current = true;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: geminiResponse } as Message]);
    } catch {
      const errorMsg = 'Sorry, the AI service is currently unavailable. Please try again later.';
      setSpeakingNow(errorMsg);
      setAssistantSpeaking(false);
      setActive(false);
      setTimeout(() => {
        speakText(errorMsg);
      }, 100);
    } finally {
      speakingActive.current = false;
    }
  };

  // Text to speech
  const speakText = (text: string) => {
    if (stoppedByUser.current) {
      window.speechSynthesis.cancel();
      setSpeakingNow('');
      setAssistantSpeaking(false);
      setActive(false);
      speakingActive.current = false;
      return;
    }

    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    speakingActive.current = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = Math.random() * 0.5 + 0.8;
    utterance.rate = 1.3;
    setVoicePitch(utterance.pitch);

    utterance.onend = () => {
      setSpeakingNow('');
      setAssistantSpeaking(false);
      setActive(false);
      speakingActive.current = false;
      if (!stoppedByUser.current) {
        setTimeout(() => {
          if (!recognitionActive.current && !speakingActive.current) startRecognition();
        }, 200);
      }
    };

    utterance.onerror = () => {
      setSpeakingNow('');
      setAssistantSpeaking(false);
      setActive(false);
      speakingActive.current = false;
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle ball click
  const handleBallClick = () => {
    if (!isAlphaBetaTester) return;

    if (listening || assistantSpeaking || speakingActive.current || recognitionActive.current) {
      stoppedByUser.current = true;
      if (speechRef.current) speechRef.current.abort();
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
      setSpeakingNow('');
      setAssistantSpeaking(false);
      setListening(false);
      setActive(false);
      speakingActive.current = false;
      recognitionActive.current = false;
    } else {
      stoppedByUser.current = false;
      startRecognition();
    }
  };

  if (isLoadingAbStatus) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-300">Checking access permissions...</p>
      </main>
    );
  }

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-50">
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-white/[0.03] to-transparent"></div>
        </div>
        <div className="animate-blob absolute left-1/4 top-0 h-72 w-72 rounded-full bg-purple-500 opacity-20 mix-blend-multiply blur-xl filter"></div>
        <div className="animate-blob animation-delay-2000 absolute right-1/4 top-0 h-72 w-72 rounded-full bg-yellow-500 opacity-20 mix-blend-multiply blur-xl filter"></div>
        <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-1/3 h-72 w-72 rounded-full bg-pink-500 opacity-20 mix-blend-multiply blur-xl filter"></div>

        {!isAlphaBetaTester ? (
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center px-6">
            {/* Main card */}
            <div className="w-full rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
              {/* Header section */}
              <div className="mb-8 text-center">
                <div className="mb-6 inline-flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg">
                  <div className="text-3xl">🎙️</div>
                </div>
                <h1 className="mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent">
                  Voice AI Assistant
                </h1>
                <p className="text-xl leading-relaxed text-gray-300">
                  Experience the future of AI interaction with our revolutionary voice assistant
                </p>
              </div>

              {/* Status badge */}
              <div className="mb-8 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-6 py-3 backdrop-blur-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-orange-400"></div>
                  <span className="font-medium text-orange-300">Alpha/Beta Exclusive</span>
                </div>
              </div>

              {/* Feature highlights */}
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="mb-2 text-2xl">🧠</div>
                  <div className="text-sm text-gray-300">AI-Powered</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="mb-2 text-2xl">🎯</div>
                  <div className="text-sm text-gray-300">Real-time</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="mb-2 text-2xl">🔊</div>
                  <div className="text-sm text-gray-300">Voice Interactive</div>
                </div>
              </div>

              {/* Join instructions */}
              <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-300">
                  <span className="text-xl">🚀</span>
                  Ready to join the future?
                </h3>

                <div className="space-y-4 text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      1
                    </div>
                    <p className="text-sm">Look for your profile button in the top-right corner</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      2
                    </div>
                    <p className="text-sm">Double-click it to access alpha/beta testing options</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      3
                    </div>
                    <p className="text-sm">Enable alpha testing and return here to start</p>
                  </div>
                </div>

                {/* Demo user button */}
                <div className="mt-6 flex flex-col items-center">
                  <div className="group relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-50 blur transition duration-300 group-hover:opacity-75"></div>
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                      <span className="text-lg">👤</span>
                      <div className="absolute -right-1 -top-1 h-4 w-4 animate-bounce rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
                        <div className="h-full w-full animate-ping rounded-full bg-white/30"></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 animate-pulse text-xs text-gray-400">
                    Find this in your header ↑
                  </p>
                </div>
              </div>

              {/* Call to action */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                  Join our exclusive testing program and shape the future of AI interaction
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex flex-col items-center justify-center">
            <div
              onClick={handleBallClick}
              className={`mx-auto mb-4 h-48 w-48 cursor-pointer rounded-full bg-blue-500 shadow-2xl transition-all duration-300 ${
                assistantSpeaking ? 'animate-pulse-ball' : ''
              } ${listening ? 'animate-listen-ball' : ''}`}
              style={{
                filter:
                  `blur(${assistantSpeaking ? 8 : listening ? 4 : 2}px) brightness(${
                    assistantSpeaking ? 1.2 : 1
                  })` + (assistantSpeaking ? ` drop-shadow(0 0 80px #3b82f6)` : ''),
                boxShadow: assistantSpeaking
                  ? '0 0 120px 40px #3b82f6'
                  : listening
                    ? '0 0 60px 20px #3b82f6'
                    : '0 0 20px 5px #3b82f6',
                transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
                outline: listening ? '4px solid #60a5fa' : 'none',
                outlineOffset: '8px',
                transform: `scale(${
                  assistantSpeaking ? 1.1 + voicePitch * 0.1 : listening ? 1.05 : 1
                })`,
              }}
              title={
                listening ? 'Listening...' : assistantSpeaking ? 'Speaking...' : 'Click to talk'
              }
            />
            {assistantSpeaking && (
              <div className="animate-pulse text-lg font-bold text-blue-300">Speaking...</div>
            )}
            {listening && !assistantSpeaking && (
              <div className="animate-pulse text-lg font-bold text-blue-200">Listening...</div>
            )}
          </div>
        )}
      </main>
      <style jsx global>{`
        @keyframes pulse-ball {
          0%,
          100% {
            box-shadow:
              0 0 120px 40px #3b82f6,
              0 0 0 0 #3b82f6;
          }
          50% {
            box-shadow:
              0 0 200px 80px #2563eb,
              0 0 0 40px #3b82f6;
          }
        }
        .animate-pulse-ball {
          animation: pulse-ball 1.2s infinite;
        }
        @keyframes listen-ball {
          0%,
          100% {
            box-shadow:
              0 0 60px 20px #60a5fa,
              0 0 0 0 #60a5fa;
          }
          50% {
            box-shadow:
              0 0 120px 40px #3b82f6,
              0 0 0 20px #60a5fa;
          }
        }
        .animate-listen-ball {
          animation: listen-ball 1.2s infinite;
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
}
