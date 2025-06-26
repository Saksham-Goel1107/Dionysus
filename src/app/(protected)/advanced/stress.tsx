"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

const StressTester = () => {
  const { user } = useUser();
  const [url, setUrl] = useState("");
  const [users, setUsers] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [simulateReal, setSimulateReal] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const [result, setResult] = useState<null | Record<string, any>>();
  const [showCopied, setShowCopied] = useState(false);

  const OFFICIAL_URL = "https://dionysus-sgun.onrender.com";

  const BLOCKED_DOMAINS = [
    "dionysus-sgun.onrender.com",
    "amazon.com",
    "google.com",
    "github.com",
    "facebook.com",
    "youtube.com",
    "twitter.com",
    "instagram.com",
    "microsoft.com",
    "apple.com",
    "netflix.com",
    "linkedin.com",
    "paypal.com",
    "wikipedia.org",
    "reddit.com",
    "yahoo.com",
    "bing.com",
    "office.com",
    "vercel.app",
  ];

  function isBlockedUrl(url: string) {
    try {
      const u = new URL(url);
      return BLOCKED_DOMAINS.some(domain => {
        if (domain === "vercel.app") {
          return u.hostname === "vercel.app";
        }
        if (domain === "onrender.com") {
          return u.hostname === "onrender.com";
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
      setInputError("Please enter a valid URL starting with https://");
      return;
    }

    if (users > 10000) {
      setInputError("Number of users cannot exceed 10,000.");
      return;
    }

    if (isBlockedUrl(url.trim().toLowerCase())) {
      setInputError("Stress testing this domain is not allowed.");
      return;
    }

    const userInfo = user ? { id: user.id, email: user.emailAddresses?.[0]?.emailAddress } : null;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, users, simulateReal, userInfo }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to run stress test." });
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
      <div className="flex flex-col items-center min-h-[40vh] py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-6 text-gradient bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          Website Stress Test
        </h1>

        {/* Legal Notice */}
        <div className="w-full max-w-2xl bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Legal Notice</h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-100">
            Stress testing a website you do not own or have explicit permission for is illegal and may result in criminal prosecution. By proceeding, you confirm you are authorized to test the specified website and accept all legal responsibility.
          </p>
        </div>

        {/* Stress Test Form */}
        <form onSubmit={handleStressTest} className="w-full max-w-2xl bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md space-y-4">
          <input
            type="url"
            required
            placeholder="Enter website URL (https://...)"
            className={`w-full px-4 py-2 border-2 rounded-md text-lg ${inputError ? "border-red-500" : "border-blue-400 focus:border-blue-600"}`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {inputError && <p className="text-sm text-red-600 font-semibold">{inputError}</p>}

          <input
            type="number"
            min={1}
            max={100000}
            className="w-full px-4 py-2 border-2 border-blue-400 focus:border-blue-600 rounded-md text-lg"
            placeholder="Number of users"
            value={users}
            onChange={(e) => setUsers(Number(e.target.value))}
          />

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={simulateReal} onChange={(e) => setSimulateReal(e.target.checked)} className="accent-blue-600" />
            <span className="text-sm text-blue-900 dark:text-blue-200">Simulate Real Users (browser-like)</span>
          </label>

          <label className="flex items-start gap-2 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-yellow-600 mt-1"
            />
            <span className="text-xs text-yellow-900 dark:text-yellow-100">
              I confirm this website is mine or I am authorized to test it. I accept legal responsibility. <b>Unlawful use may lead to legal action.</b>
            </span>
          </label>

          <Button
            type="submit"
            disabled={loading || !confirmed}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-bold text-lg py-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Running...
              </span>
            ) : (
              "Start Stress Test"
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6">
            <Button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
              Show Output
            </Button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl"
              >
                &times;
              </button>
              <h3 className="text-lg font-bold text-center mb-4">Stress Test Output</h3>
              <pre
                ref={outputRef}
                className="whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 rounded p-4 max-h-96 overflow-auto border border-gray-200 dark:border-gray-700"
              >
                {JSON.stringify(result, null, 2)}
              </pre>
                <Button
                onClick={() => {
                  handleCopy();
                  setShowCopied(true);
                  setTimeout(() => setShowCopied(false), 1500);
                }}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                {showCopied ? "Copied!" : "Copy Output"}
                </Button>
            </div>
          </div>
        )}
      </div>
  );
};

export default StressTester;