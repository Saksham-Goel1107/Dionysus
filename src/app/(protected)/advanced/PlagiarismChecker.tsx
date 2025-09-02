'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import Image from 'next/image';

async function checkPlagiarism(repoUrl: string, startIdx = 0): Promise<any[]> {
  const res = await fetch('/api/plagiarism-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, startIdx }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Unknown error');
  }
  const data = await res.json();
  return data.results || [];
}

const isValidGithubUrl = (url: string) => {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(url.trim());
};

const PlagiarismChecker: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cachedUrl, setCachedUrl] = useState('');
  const [cachedResults, setCachedResults] = useState<any[] | null>(null);
  const [scanning, setScanning] = useState(false); // background scan state
  const [scanAbort, setScanAbort] = useState<AbortController | null>(null);

  // Helper to scan next chunk in background (only when user requests)
  const scanNextChunk = async (url: string, startIdx: number, prevResults: any[]) => {
    setScanning(true);
    setLoading(true);
    const controller = new AbortController();
    setScanAbort(controller);
    try {
      const newResults = await checkPlagiarism(url, startIdx);
      const allResults = prevResults.concat(newResults);
      setResults(allResults);
      setCachedResults(allResults);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setScanning(false);
      setLoading(false);
      setScanAbort(null);
    }
  };

  const handleCheck = async (next = false) => {
    setError(null);
    if (!isValidGithubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g. https://github.com/user/repo)');
      return;
    }
    // If not paginating and the URL hasn't changed, just reopen modal with cached results
    if (!next && cachedResults && cachedUrl === repoUrl) {
      setResults(cachedResults);
      setModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      let results: any[] = [];
      let startIdx = 0;
      if (!next) {
        setCachedResults(null);
        setCachedUrl(repoUrl);
      }
      if (cachedResults && cachedUrl === repoUrl && next) {
        results = cachedResults;
        startIdx = results.length;
      }
      if (next) {
        // Only scan next chunk in background when user requests
        scanNextChunk(repoUrl, startIdx, results);
        setModalOpen(true);
        setLoading(false);
        return;
      }
      const newResults = await checkPlagiarism(repoUrl, startIdx);
      const allResults = results.concat(newResults);
      setResults(allResults);
      setCachedResults(allResults);
      setModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Cancel background scan if URL changes or component unmounts
  React.useEffect(() => {
    return () => {
      if (scanAbort) scanAbort.abort();
    };
  }, [repoUrl, scanAbort]);

  // Ensure modal always shows cached results for current URL, even during/after pagination
  React.useEffect(() => {
    if (modalOpen && cachedResults && cachedUrl === repoUrl) {
      setResults(cachedResults);
    }
    // If scanning is in progress, keep loading state true
    if (modalOpen && scanning) {
      setLoading(true);
    }
  }, [modalOpen, cachedResults, cachedUrl, repoUrl, scanning]);

  return (
    <div className="mx-auto my-10 max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-2 text-2xl font-bold text-blue-700 dark:text-blue-200">
        🔍 GitHub Plagiarism Checker
      </h2>
      <p className="mb-4 text-sm text-blue-600 dark:text-blue-300">
        Check for code similarity in public GitHub repositories using GitHub Code Search.
      </p>
      <input
        type="text"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="e.g. https://github.com/user/repo"
        className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
      />
      <Button onClick={() => handleCheck()} disabled={!repoUrl || loading} className="w-full">
        {loading ? 'Checking...' : 'Check Plagiarism'}
      </Button>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-300">
        This Process Takes Significant Time so Please don&apos;t leave this page. Till then have a
        coffee🍵
      </div>
      <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plagiarism Check Results</DialogTitle>
            <DialogDescription>
              Files checked and matches found for <span className="font-mono">{repoUrl}</span>
            </DialogDescription>
          </DialogHeader>
          {results && (
            <div className="mt-2 space-y-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <strong>Files checked:</strong> {results.length}
                </p>
                <p>
                  <strong>Total matches found:</strong>{' '}
                  {results.reduce((acc, file) => acc + file.matches.length, 0)}
                </p>
              </div>
              {results.map((file, i) => (
                <div
                  key={i}
                  className="rounded border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800"
                >
                  <div className="mb-1 font-semibold text-gray-900 dark:text-white">
                    {file.file}
                  </div>
                  <div className="mb-2 text-xs text-gray-500">
                    Snippet: <code>{file.snippet.slice(0, 100)}...</code>
                  </div>
                  {file.matches.length > 0 ? (
                    <ul className="ml-5 list-disc space-y-1 text-sm">
                      {file.matches.map((match: any, j: number) => (
                        <li key={j}>
                          <a
                            href={match.html_url}
                            target="_blank"
                            className="text-blue-600 underline"
                          >
                            {match.repo}/{match.path}
                          </a>
                          <a
                            href={match.user_url}
                            target="_blank"
                            className="ml-2 inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"
                          >
                            <Image
                              src={match.avatar_url}
                              alt={match.user}
                              width={16}
                              height={16}
                              className="h-4 w-4 rounded-full"
                            />
                            {match.user}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-gray-400">No matches found for this file.</p>
                  )}
                </div>
              ))}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleCheck(true)}
                  disabled={loading || (results.length > 0 && results.length % 5 !== 0)}
                >
                  {loading ? 'Scanning...' : 'Scan Next 5 Files'}
                </Button>
              </div>
            </div>
          )}
          <p className="mt-6 text-xs text-gray-500">
            Uses the{' '}
            <a
              href="https://docs.github.com/en/rest/search?apiVersion=2022-11-28#search-code"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GitHub Code Search API
            </a>
            . To avoid rate limits, only the first few code files are checked.
          </p>
          <DialogClose asChild>
            <Button className="mt-4 w-full" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlagiarismChecker;
