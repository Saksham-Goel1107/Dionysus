// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';

// Extend Window interface for SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition;
  }
}

export default function Home() {
  const SYSTEM_PROMPT = {
    role: 'system',
    content:
      'You are a helpful AI voice assistant for the Github-Saas project. Answer questions about this project and general topics. If asked about this project, answer as an expert. You are a voice agent: do not use code blocks, markdown, ###, or comments. Only say things that can be spoken and easily understood.',
  };
  const [listening, setListening] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [voicePitch, setVoicePitch] = useState(1);
  const speechRef = useRef<any>(null);
  const lastUserCommand = useRef('');
  const stoppedByUser = useRef(false);
  const speakingActive = useRef(false);
  const recognitionActive = useRef(false);
  const clearContextNext = useRef(false);

  // Helper: Start recognition
  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported');
      return;
    }
    if (recognitionActive.current) return; // Prevent double start
    if (speechRef.current) speechRef.current.abort();
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionActive.current = true;
    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (speechRef.current) speechRef.current.abort();
      window.speechSynthesis.cancel();
      recognitionActive.current = false;
      speakingActive.current = false;
    };
  }, []);

  // Fetch LLM response and speak
  const fetchLLMResponse = async (text: string) => {
    setAssistantSpeaking(true);
    setSpeakingNow('');
    setMessages((prev) => {
      let updated;
      if (clearContextNext.current) {
        updated = [SYSTEM_PROMPT as Message, { role: 'user', content: text } as Message];
        clearContextNext.current = false;
      } else {
        updated = [...prev, { role: 'user', content: text } as Message];
      }
      doFetch(updated);
      return updated;
    });
  };

  // Actually fetch and stream LLM response
  interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  interface LLMResponseChunk {
    message?: {
      content?: string;
    };
  }

  const doFetch = async (contextMessages: Message[]): Promise<void> => {
    let fullResponse = '';
    let speaking = '';
    let spoken = false; // Only allow one utterance per response
    try {
      const res: Response = await fetch(
        'https://maiden-pounds-contacted-pct.trycloudflare.com/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'maryasov/qwen2.5-coder-cline:7b-instruct-q8_0',
            messages: contextMessages,
            stream: true,
          }),
        },
      );
      if (!res.ok || !res.body) throw new Error('LLM service unavailable. Please try again later.');
      const reader: ReadableStreamDefaultReader<Uint8Array> = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        if (stoppedByUser.current) break;
        const { done, value }: { done: boolean; value?: Uint8Array } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            if (stoppedByUser.current) break;
            const json: LLMResponseChunk = JSON.parse(line);
            const chunk: string | undefined = json?.message?.content;
            if (!chunk) continue;
            fullResponse += chunk;
            speaking += chunk;
            if (/[.?!]\s?$/.test(speaking) && !spoken) {
              if (!stoppedByUser.current && !speakingActive.current) {
                setAssistantSpeaking(true);
                speakText(speaking);
                setSpeakingNow(speaking);
                speakingActive.current = true;
                spoken = true;
              }
              speaking = '';
            } else if (stoppedByUser.current) {
              window.speechSynthesis.cancel();
              setSpeakingNow('');
              setAssistantSpeaking(false);
              setActive(false);
              speakingActive.current = false;
              break;
            }
          } catch {}
        }
      }
      // Only speak the full response if nothing was spoken yet
      if (fullResponse.trim() && !stoppedByUser.current && !speakingActive.current && !spoken) {
        setAssistantSpeaking(true);
        speakText(fullResponse);
        setSpeakingNow(fullResponse);
        speakingActive.current = true;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: fullResponse } as Message]);
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

  // Speak and animate ball based on pitch
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
      // Only auto-resume if not stopped by user
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

  // Ball click handler: toggle all activity
  const handleBallClick = () => {
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
      stoppedByUser.current = false; // Only allow resume on user click
      startRecognition();
    }
  };

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <div className="mb-8 flex flex-col items-center justify-center">
          <div
            onClick={handleBallClick}
            className={`mx-auto mb-4 h-48 w-48 cursor-pointer rounded-full bg-blue-500 shadow-2xl transition-all duration-300 ${assistantSpeaking ? 'animate-pulse-ball' : ''} ${listening ? 'animate-listen-ball' : ''}`}
            style={{
              filter:
                `blur(${assistantSpeaking ? 8 : listening ? 4 : 2}px) brightness(${assistantSpeaking ? 1.2 : 1})` +
                (assistantSpeaking ? ` drop-shadow(0 0 80px #3b82f6)` : ''),
              boxShadow: assistantSpeaking
                ? '0 0 120px 40px #3b82f6'
                : listening
                  ? '0 0 60px 20px #3b82f6'
                  : '0 0 20px 5px #3b82f6',
              transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
              outline: listening ? '4px solid #60a5fa' : 'none',
              outlineOffset: '8px',
              transform: `scale(${assistantSpeaking ? 1.1 + voicePitch * 0.1 : listening ? 1.05 : 1})`,
            }}
            title={listening ? 'Listening...' : assistantSpeaking ? 'Speaking...' : 'Click to talk'}
          />
          {assistantSpeaking && (
            <div className="animate-pulse text-lg font-bold text-blue-300">Speaking...</div>
          )}
          {listening && !assistantSpeaking && (
            <div className="animate-pulse text-lg font-bold text-blue-200">Listening...</div>
          )}
        </div>
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
