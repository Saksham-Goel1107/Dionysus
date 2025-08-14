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

// List of config files to skip
const CONFIG_FILES = [
  'next.config.js',
  'next-env.d.ts',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'prettier.config.js',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'vite.config.js',
  'vite.config.ts',
  'webpack.config.js',
  'babel.config.js',
  'jest.config.js',
  'cypress.config.js',
  'playwright.config.js',
  'eslint.config.js',
  'eslintrc.js',
  'commitlint.config.js',
  'prisma/schema.prisma',
  'prisma/migrations',
  'README.md',
  'LICENSE.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'public/robots.txt',
  'public/site.webmanifest',
  'public/favicon.ico',
  'public/logo.png',
];

async function checkPlagiarism(repoUrl: string, startIdx = 0): Promise<any[]> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) throw new Error('Invalid GitHub repo URL');
  const [_, owner, repo] = match;

  const GITHUB_PAT = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    ...(GITHUB_PAT && { Authorization: `Bearer ${GITHUB_PAT}` }),
  };

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) throw new Error('Failed to fetch file list. Ensure the repo is public.');
  const { tree } = await treeRes.json();

  // Filter out only non-blob, config, shadcn/ui, node_modules, and duplicate files
  const seenFiles = new Set();
  const codeFiles = tree.filter(
    (f: any) =>
      f.type === 'blob' &&
      /\.(js|ts|py|java|cpp|c|cs|rb|php|rs|swift|kt|m|scala|sh|pl|rb|dart|jsx|tsx)$/i.test(
        f.path,
      ) &&
      !CONFIG_FILES.some((cfg) => f.path.endsWith(cfg)) &&
      !/components[\\\/]ui[\\\/]/i.test(f.path) && // skip shadcn/ui components
      !/node_modules[\\\/]/i.test(f.path) && // skip node_modules just in case
      !seenFiles.has(f.path) &&
      seenFiles.add(f.path),
  );

  const results: any[] = [];
  let checked = 0;
  let idx = startIdx;
  let attempts = 0;
  // Try up to 50 attempts to find 5 valid files (avoid infinite loop if many files are empty)
  while (checked < 5 && idx < codeFiles.length && attempts < 50) {
    const file = codeFiles[idx++];
    attempts++;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`;
    const fileRes = await fetch(rawUrl);
    if (!fileRes.ok) continue;

    const content = await fileRes.text();
    let snippet = content.trim();
    // Try to extract a short, single-line snippet for the search query
    let searchSnippet = '';
    // Prefer a non-empty, non-comment, non-import line (for code files)
    const lines = snippet
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    searchSnippet =
      lines.find(
        (l) =>
          l &&
          !l.startsWith('//') &&
          !l.startsWith('/*') &&
          !l.startsWith('*') &&
          !l.startsWith('import') &&
          !l.startsWith('export') &&
          l.length > 10,
      ) ||
      lines[0] ||
      '';
    // Fallback: use up to 100 chars of the snippet
    if (searchSnippet.length > 100) searchSnippet = searchSnippet.slice(0, 100);
    // Fallback: if still too long or empty, use up to 50 chars
    if (!searchSnippet && snippet.length > 0) searchSnippet = snippet.slice(0, 50);
    if (!searchSnippet) continue;

    let searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchSnippet)}+in:file`;
    let searchRes = await fetch(searchUrl, { headers });
    // If 403 error, throw a rate limit error
    if (searchRes.status === 403) {
      throw new Error(
        'GitHub API rate limit reached or access denied. Please wait a few minutes and try again. If you are using a token, ensure it is valid and has the correct scopes.',
      );
    }
    // If 422 error, retry with a shorter snippet (first 30 chars)
    if (searchRes.status === 422 && searchSnippet.length > 30) {
      searchSnippet = searchSnippet.slice(0, 30);
      searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchSnippet)}+in:file`;
      searchRes = await fetch(searchUrl, { headers });
      if (searchRes.status === 403) {
        throw new Error(
          'GitHub API rate limit reached or access denied. Please wait a few minutes and try again. If you are using a token, ensure it is valid and has the correct scopes.',
        );
      }
    }
    if (!searchRes.ok) continue;

    const searchData = await searchRes.json();
    // Show up to 5 unique file matches (by repo+path) that are not the same repo
    const uniqueMatches: any[] = [];
    const seen = new Set();
    for (const item of searchData.items || []) {
      const key = item.repository.full_name + '/' + item.path;
      if (
        item.repository.full_name !== `${owner}/${repo}` &&
        item.repository.owner.login !== owner &&
        !seen.has(key)
      ) {
        uniqueMatches.push({
          repo: item.repository.full_name,
          path: item.path,
          html_url: item.html_url,
          user: item.repository.owner.login,
          avatar_url: item.repository.owner.avatar_url,
          user_url: item.repository.owner.html_url,
        });
        seen.add(key);
        if (uniqueMatches.length >= 5) break;
      }
    }

    results.push({
      file: file.path,
      snippet: searchSnippet,
      matches: uniqueMatches,
    });
    checked++; // Only increment if a valid file is found
    await new Promise((r) => setTimeout(r, 800)); // delay to avoid rate limit
  }

  return results;
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
