import React from 'react';

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
}

export default function VoiceButton({ isListening, onClick }: VoiceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 hover:bg-red-600 text-white'
          :  
            'text-white hover:bg-gray-700'
      }`}
      suppressHydrationWarning
      title={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        {isListening ? (
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        )}
      </svg>
    </button>
  );
}
