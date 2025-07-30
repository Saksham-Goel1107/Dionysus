'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

const StressTester = () => {
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const [users, setUsers] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [simulateReal, setSimulateReal] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const [result, setResult] = useState<null | Record<string, any>>();
  const [showCopied, setShowCopied] = useState(false);

  const BLOCKED_DOMAINS = [
    // "dionysus-sgun.onrender.com",
    'dionysus-gray.vercel.app',
    'amazon.com',
    'google.com',
    'github.com',
    'facebook.com',
    'youtube.com',
    'twitter.com',
    'instagram.com',
    'microsoft.com',
    'apple.com',
    'netflix.com',
    'linkedin.com',
    'paypal.com',
    'wikipedia.org',
    'reddit.com',
    'yahoo.com',
    'bing.com',
    'office.com',
    'vercel.app',
  ];

  function isBlockedUrl(url: string) {
    try {
      const u = new URL(url);
      return BLOCKED_DOMAINS.some((domain) => {
        if (domain === 'vercel.app') {
          return u.hostname === 'vercel.app';
        }
        if (domain === 'onrender.com') {
          return u.hostname === 'onrender.com';
        }
        return u.hostname === domain || u.hostname.endsWith(`.${domain}`);
      });
    } catch {
      return false;
    }
  }

  const handleStressTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    if (!url || !/^https:\/\/.+\..+/.test(url.trim())) {
      setInputError('Please enter a valid URL starting with https://');
      return;
    }

    if (users > 10000) {
      setInputError('Number of users cannot exceed 10,000.');
      return;
    }

    if (isBlockedUrl(url.trim().toLowerCase())) {
      setInputError('Stress testing this domain is not allowed.');
      return;
    }

    const userInfo = user ? { id: user.id, email: user.emailAddresses?.[0]?.emailAddress } : null;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, users, simulateReal, userInfo }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to run stress test.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputRef.current) {
      navigator.clipboard.writeText(outputRef.current.innerText);
    }
  };

  return (
    <div className="flex min-h-[40vh] flex-col items-center px-4 py-8">
      <h1 className="text-gradient mb-6 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-center text-4xl font-bold text-transparent">
        Website Stress Test
      </h1>

      {/* Legal Notice */}
      <div className="mb-6 w-full max-w-2xl rounded-lg border-2 border-yellow-400 bg-yellow-100 p-4 dark:bg-yellow-900/40">
        <h3 className="mb-2 text-lg font-bold text-yellow-800 dark:text-yellow-200">
          ⚠️ Legal Notice
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-100">
          Stress testing a website you do not own or have explicit permission for is illegal and may
          result in criminal prosecution. By proceeding, you confirm you are authorized to test the
          specified website and accept all legal responsibility.
          <br />
          Remember: We stores who used the stress test.
        </p>
      </div>

      {/* Stress Test Form */}
      <form
        onSubmit={handleStressTest}
        className="w-full max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900"
      >
        <input
          type="url"
          required
          placeholder="Enter website URL (https://...)"
          className={`w-full rounded-md border-2 px-4 py-2 text-lg ${inputError ? 'border-red-500' : 'border-blue-400 focus:border-blue-600'}`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {inputError && <p className="text-sm font-semibold text-red-600">{inputError}</p>}

        <input
          type="number"
          min={1}
          max={100000}
          className="w-full rounded-md border-2 border-blue-400 px-4 py-2 text-lg focus:border-blue-600"
          placeholder="Number of users"
          value={users}
          onChange={(e) => setUsers(Number(e.target.value))}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={simulateReal}
            onChange={(e) => setSimulateReal(e.target.checked)}
            className="accent-blue-600"
          />
          <span className="text-sm text-blue-900 dark:text-blue-200">
            Simulate Real Users (browser-like)
          </span>
        </label>

        <label className="flex items-start gap-2 rounded bg-yellow-100 p-3 dark:bg-yellow-900/30">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 accent-yellow-600"
          />
          <span className="text-xs text-yellow-900 dark:text-yellow-100">
            I confirm this website is mine or I am authorized to test it. I accept legal
            responsibility. <b>Unlawful use may lead to legal action.</b>
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading || !confirmed}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-2 text-lg font-bold text-white transition hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Running...
            </span>
          ) : (
            'Start Stress Test'
          )}
        </Button>
      </form>

      {result && (
        <div className="mt-6">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Show Output
          </Button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-2 top-2 text-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              &times;
            </button>
            <h3 className="mb-4 text-center text-lg font-bold">Stress Test Output</h3>
            <pre
              ref={outputRef}
              className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-gray-100 p-4 text-xs dark:border-gray-700 dark:bg-gray-800"
            >
              {JSON.stringify(result, null, 2)}
            </pre>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => {
                  handleCopy();
                  setShowCopied(true);
                  setTimeout(() => setShowCopied(false), 1500);
                }}
                className="w-full bg-blue-500 text-white hover:bg-blue-600 sm:w-auto"
              >
                {showCopied ? 'Copied!' : 'Copy Output'}
              </Button>
              <Button
                onClick={() => {
                  if (result) {
                    const blob = new Blob([JSON.stringify(result, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'stress-test-output.json';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 0);
                  }
                }}
                className="w-full bg-green-500 text-white hover:bg-green-600 sm:w-auto"
              >
                Download JSON
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StressTester;
