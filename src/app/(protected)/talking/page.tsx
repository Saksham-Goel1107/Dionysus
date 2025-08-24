// @ts-nocheck
'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
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
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white">
        {!isAlphaBetaTester ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
            <div className="mb-8 rounded-xl border border-orange-400 bg-gradient-to-r from-orange-500 to-red-500 p-6 shadow-2xl">
              <div className="mb-4 text-4xl">🔒</div>
              <h2 className="mb-4 text-2xl font-bold">Alpha/Beta Feature</h2>
              <p className="mb-4 text-lg opacity-90">
                This voice interaction feature is currently available only for our alpha and beta
                testers.
              </p>
              <div className="mb-4 rounded-lg bg-black/20 p-4">
                <h3 className="mb-2 text-sm font-semibold">How to join Alpha/Beta Testing:</h3>
                <p className="mb-3 text-sm opacity-75">
                  Double-click your user button in the top-right corner of the header to access
                  testing options.
                </p>
                <div className="flex justify-center">
                  <div
                    className="relative cursor-not-allowed opacity-50"
                    title="Demo user button (disabled)"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                      <span className="text-xs font-bold text-white">👤</span>
                    </div>
                    <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
                  </div>
                </div>
                <p className="mt-2 text-xs opacity-60">↑ Find this button in your actual header</p>
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
      `}</style>
    </>
  );
}
