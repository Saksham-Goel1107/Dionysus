'use client';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';

function generateSecret(byteLength: number) {
  const array = new Uint8Array(byteLength);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // fallback for environments without crypto
    for (let i = 0; i < byteLength; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const JWTSecretGenerator = () => {
  const [bytes, setBytes] = useState(32);
  const [secret, setSecret] = useState(() => generateSecret(32));
  const [copied, setCopied] = useState(false);
  const secretRef = useRef<HTMLPreElement>(null);

  const handleRegenerate = () => {
    setSecret(generateSecret(bytes));
    setCopied(false);
  };

  const handleCopy = () => {
    if (secretRef.current) {
      navigator.clipboard.writeText(secretRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md flex flex-col items-center">
      <h2 className="text-xl font-bold mb-2">JWT Secret Generator</h2>
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 w-full">
        <label className="text-sm font-medium">Bytes:</label>
        <input
          type="range"
          min={16}
          max={128}
          step={1}
          value={bytes}
          onChange={(e) => {
            const val = Math.max(16, Math.min(128, Number(e.target.value)));
            setBytes(val);
            setSecret(generateSecret(val));
            setCopied(false);
          }}
          className="w-full sm:w-64 accent-blue-600 cursor-grab active:cursor-grabbing"
        />
        <span className="ml-2 font-mono text-xs bg-gray-200 dark:bg-gray-700 rounded px-2 py-1">
          {bytes} bytes
        </span>
        <Button onClick={handleRegenerate} className="bg-blue-600 text-white px-3 py-1 text-xs">
          Regenerate
        </Button>
      </div>
      <div className="w-full flex flex-col items-center">
        <pre
          ref={secretRef}
          className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-xs overflow-x-auto w-full select-all break-all mb-2"
        >
          {secret}
        </pre>
        <Button
          onClick={handleCopy}
          className="bg-blue-500 text-white px-3 py-1 text-xs w-full sm:w-auto"
        >
          {copied ? 'Copied!' : 'Copy Secret'}
        </Button>
      </div>
    </div>
  );
};

export default JWTSecretGenerator;
