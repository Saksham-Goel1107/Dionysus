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
    <div className="mx-auto my-8 flex w-full max-w-2xl flex-col items-center rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-2 text-xl font-bold">JWT Secret Generator</h2>
      <div className="mb-4 flex w-full flex-col items-center gap-3 sm:flex-row">
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
          className="w-full cursor-grab accent-blue-600 active:cursor-grabbing sm:w-64"
        />
        <span className="ml-2 rounded bg-gray-200 px-2 py-1 font-mono text-xs dark:bg-gray-700">
          {bytes} bytes
        </span>
        <Button onClick={handleRegenerate} className="bg-blue-600 px-3 py-1 text-xs text-white">
          Regenerate
        </Button>
      </div>
      <div className="flex w-full flex-col items-center">
        <pre
          ref={secretRef}
          className="mb-2 w-full select-all overflow-x-auto break-all rounded bg-gray-100 p-4 text-xs dark:bg-gray-800"
        >
          {secret}
        </pre>
        <Button
          onClick={handleCopy}
          className="w-full bg-blue-500 px-3 py-1 text-xs text-white sm:w-auto"
        >
          {copied ? 'Copied!' : 'Copy Secret'}
        </Button>
      </div>
    </div>
  );
};

export default JWTSecretGenerator;
