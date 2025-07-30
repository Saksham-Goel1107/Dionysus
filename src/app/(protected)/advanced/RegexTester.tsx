'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type RegexMatch = {
  value: string;
  index: number;
  length: number;
};

type RegexFlag = {
  name: string;
  value: string;
  description: string;
  checked: boolean;
};

const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState<string>('');
  const [testText, setTestText] = useState<string>('');
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('tester');
  const [replacePattern, setReplacePattern] = useState<string>('');
  const [replacementText, setReplacementText] = useState<string>('');
  const [flags, setFlags] = useState<RegexFlag[]>([
    { name: 'Global', value: 'g', description: 'Match all occurrences', checked: true },
    { name: 'Case Insensitive', value: 'i', description: 'Ignore case', checked: false },
    {
      name: 'Multiline',
      value: 'm',
      description: 'Anchor ^ and $ match start/end of each line',
      checked: false,
    },
    {
      name: 'Dotall',
      value: 's',
      description: 'Dot (.) matches newline character',
      checked: false,
    },
    { name: 'Unicode', value: 'u', description: 'Enable Unicode support', checked: false },
  ]);

  // Test regex pattern against the input text
  useEffect(() => {
    if (!pattern || !testText) {
      setMatches([]);
      setMatchCount(0);
      setError(null);
      return;
    }

    try {
      const selectedFlags = flags
        .filter((flag) => flag.checked)
        .map((flag) => flag.value)
        .join('');
      const regex = new RegExp(pattern, selectedFlags);
      const newMatches: RegexMatch[] = [];

      // If global flag is set, find all matches
      if (selectedFlags.includes('g')) {
        let match;
        while ((match = regex.exec(testText)) !== null) {
          newMatches.push({
            value: match[0],
            index: match.index,
            length: match[0].length,
          });
        }
      } else {
        // Otherwise, find just the first match
        const match = regex.exec(testText);
        if (match) {
          newMatches.push({
            value: match[0],
            index: match.index,
            length: match[0].length,
          });
        }
      }

      setMatches(newMatches);
      setMatchCount(newMatches.length);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setMatches([]);
      setMatchCount(0);
    }
  }, [pattern, testText, flags]);

  // Helper function to toggle flag state
  const toggleFlag = (flagValue: string) => {
    setFlags(
      flags.map((flag) => (flag.value === flagValue ? { ...flag, checked: !flag.checked } : flag)),
    );
  };

  // Copy regex pattern to clipboard
  const handleCopy = () => {
    const selectedFlags = flags
      .filter((flag) => flag.checked)
      .map((flag) => flag.value)
      .join('');
    navigator.clipboard.writeText(`/${pattern}/${selectedFlags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get highlighted text with regex matches
  const getHighlightedText = () => {
    if (!testText || matches.length === 0) return testText;

    let result = [];
    let lastIndex = 0;

    // Sort matches by index to handle them in order
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

    sortedMatches.forEach((match, i) => {
      // Add text before the match
      if (match.index > lastIndex) {
        result.push(<span key={`text-${i}`}>{testText.substring(lastIndex, match.index)}</span>);
      }

      // Add highlighted match
      result.push(
        <mark key={`match-${i}`} className="rounded bg-green-200 px-0.5 dark:bg-green-700">
          {testText.substring(match.index, match.index + match.length)}
        </mark>,
      );

      lastIndex = match.index + match.length;
    });

    // Add any remaining text
    if (lastIndex < testText.length) {
      result.push(<span key="text-end">{testText.substring(lastIndex)}</span>);
    }

    return result;
  };

  // Replace function
  const handleReplace = () => {
    if (!pattern || !testText) return;

    try {
      const selectedFlags = flags
        .filter((flag) => flag.checked)
        .map((flag) => flag.value)
        .join('');
      const regex = new RegExp(pattern, selectedFlags);
      const result = testText.replace(regex, replacementText);
      setReplacePattern(result);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const regexCheatsheet = [
    { pattern: '^', description: 'Start of string or line' },
    { pattern: '$', description: 'End of string or line' },
    { pattern: '.', description: 'Any single character' },
    { pattern: '[abc]', description: 'Any character in the set' },
    { pattern: '[^abc]', description: 'Any character not in the set' },
    { pattern: '\\w', description: 'Word character (a-z, A-Z, 0-9, _)' },
    { pattern: '\\d', description: 'Digit (0-9)' },
    { pattern: '\\s', description: 'Whitespace character' },
    { pattern: '\\b', description: 'Word boundary' },
    { pattern: 'a*', description: '0 or more of a' },
    { pattern: 'a+', description: '1 or more of a' },
    { pattern: 'a?', description: '0 or 1 of a' },
    { pattern: 'a{3}', description: 'Exactly 3 of a' },
    { pattern: 'a{3,}', description: '3 or more of a' },
    { pattern: 'a{1,3}', description: 'Between 1 and 3 of a' },
    { pattern: 'a|b', description: 'a or b' },
    { pattern: '(abc)', description: 'Group' },
    { pattern: '(?:abc)', description: 'Non-capturing group' },
    { pattern: '(?=abc)', description: 'Positive lookahead' },
    { pattern: '(?!abc)', description: 'Negative lookahead' },
  ];

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-50 via-white to-violet-100 p-8 shadow-xl dark:border-violet-700 dark:from-violet-900/60 dark:via-violet-950/80 dark:to-violet-900/60">
      <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-violet-200 opacity-30 blur-2xl dark:bg-violet-800" />
      <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full bg-violet-100 opacity-20 blur-2xl dark:bg-violet-900" />

      <h2 className="z-10 mb-3 text-2xl font-extrabold tracking-tight text-violet-800 drop-shadow-lg dark:text-violet-100">
        <span className="mr-2 inline-block align-middle">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="inline-block text-violet-500 dark:text-violet-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </span>
        RegEx Tester
      </h2>

      <p className="z-10 mb-6 max-w-lg text-center text-sm text-violet-700/80 dark:text-violet-200/80 md:text-base">
        Test and debug regular expressions with live match highlighting and a handy cheatsheet. Find
        and replace text patterns with ease.
      </p>

      <div className="z-10 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="tester">Pattern Tester</TabsTrigger>
            <TabsTrigger value="replace">Find & Replace</TabsTrigger>
          </TabsList>

          <TabsContent value="tester" className="space-y-4">
            {/* Regex input */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                  <span>RegEx Pattern</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-help text-violet-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Enter your regular expression pattern without the slashes and flags.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-6 items-center gap-1 px-2 text-xs"
                  onClick={handleCopy}
                  disabled={!pattern}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="flex">
                <span className="rounded-l-md border border-r-0 border-violet-300 bg-violet-100 px-3 py-2 font-mono text-violet-800 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-200">
                  /
                </span>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter your regex pattern..."
                  className="flex-1 border border-violet-300 bg-white p-2 font-mono text-sm text-violet-900 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100"
                />
                <span className="flex items-center rounded-r-md border border-l-0 border-violet-300 bg-violet-100 px-3 py-2 font-mono text-violet-800 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-200">
                  /
                  {flags
                    .filter((flag) => flag.checked)
                    .map((flag) => flag.value)
                    .join('')}
                </span>
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-3">
              {flags.map((flag) => (
                <label key={flag.value} className="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={flag.checked}
                    onChange={() => toggleFlag(flag.value)}
                    className="rounded border-violet-400 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-violet-800 dark:text-violet-200">
                    {flag.name}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-1 inline-block h-3 w-3 cursor-help text-violet-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{flag.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </label>
              ))}
            </div>

            {/* Test string */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-700 dark:text-violet-300">
                Test String
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test against your regex..."
                className="min-h-[100px] w-full rounded-md border border-violet-300 bg-white p-3 text-sm text-violet-900 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-100 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Matches */}
            {pattern && testText && !error && (
              <div className="overflow-hidden rounded-md border border-violet-300 dark:border-violet-700">
                <div className="flex items-center justify-between border-b border-violet-300 bg-violet-100 px-4 py-2 dark:border-violet-700 dark:bg-violet-900">
                  <span className="text-sm font-medium text-violet-800 dark:text-violet-200">
                    Matches ({matchCount})
                  </span>
                </div>
                <div className="max-h-[200px] overflow-auto bg-white p-4 dark:bg-violet-950">
                  {matches.length > 0 ? (
                    <div className="whitespace-pre-wrap font-mono text-sm text-violet-900 dark:text-violet-100">
                      {getHighlightedText()}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-violet-500 dark:text-violet-400">
                      No matches found
                    </div>
                  )}
                </div>
                {matches.length > 0 && (
                  <div className="border-t border-violet-300 bg-violet-50 px-4 py-2 dark:border-violet-700 dark:bg-violet-900/50">
                    <h4 className="mb-2 text-sm font-medium text-violet-800 dark:text-violet-200">
                      Match Details:
                    </h4>
                    <div className="max-h-[150px] overflow-auto">
                      {matches.map((match, index) => (
                        <div
                          key={index}
                          className="mb-1 rounded bg-violet-100 p-1 text-xs dark:bg-violet-900"
                        >
                          <span className="font-mono text-violet-700 dark:text-violet-300">
                            {index + 1}: &quot;{match.value}&quot; (index: {match.index}, length:{' '}
                            {match.length})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="replace" className="space-y-4">
            {/* Regex input */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  RegEx Pattern
                </label>
              </div>
              <div className="flex">
                <span className="rounded-l-md border border-r-0 border-violet-300 bg-violet-100 px-3 py-2 font-mono text-violet-800 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-200">
                  /
                </span>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter your regex pattern..."
                  className="flex-1 border border-violet-300 bg-white p-2 font-mono text-sm text-violet-900 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100"
                />
                <span className="flex items-center rounded-r-md border border-l-0 border-violet-300 bg-violet-100 px-3 py-2 font-mono text-violet-800 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-200">
                  /
                  {flags
                    .filter((flag) => flag.checked)
                    .map((flag) => flag.value)
                    .join('')}
                </span>
              </div>
            </div>

            {/* Replacement text */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-700 dark:text-violet-300">
                Replacement Text
              </label>
              <input
                type="text"
                value={replacementText}
                onChange={(e) => setReplacementText(e.target.value)}
                placeholder="Text to replace matched patterns..."
                className="w-full rounded-md border border-violet-300 bg-white p-2 text-sm text-violet-900 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100"
              />
              <p className="mt-1 text-xs text-violet-500 dark:text-violet-400">
                Use $1, $2, etc. to refer to capturing groups
              </p>
            </div>

            {/* Test string */}
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-700 dark:text-violet-300">
                Text to Process
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to find and replace..."
                className="min-h-[100px] w-full rounded-md border border-violet-300 bg-white p-3 text-sm text-violet-900 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100"
              />
            </div>

            {/* Replace button */}
            <Button
              onClick={handleReplace}
              disabled={!pattern || !testText}
              className="w-full bg-violet-600 text-white hover:bg-violet-700"
            >
              Replace
            </Button>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-100 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Replacement result */}
            {replacePattern && (
              <div className="overflow-hidden rounded-md border border-violet-300 dark:border-violet-700">
                <div className="border-b border-violet-300 bg-violet-100 px-4 py-2 dark:border-violet-700 dark:bg-violet-900">
                  <span className="text-sm font-medium text-violet-800 dark:text-violet-200">
                    Result
                  </span>
                </div>
                <div className="bg-white p-4 dark:bg-violet-950">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-violet-900 dark:text-violet-100">
                    {replacePattern}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* RegEx cheatsheet */}
        <div className="mt-8 border-t border-violet-300 pt-4 dark:border-violet-700">
          <h3 className="mb-3 font-medium text-violet-800 dark:text-violet-200">
            RegEx Cheatsheet
          </h3>
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {regexCheatsheet.map((item, index) => (
              <div
                key={index}
                className="flex items-start rounded bg-violet-50 p-1.5 dark:bg-violet-900/30"
              >
                <code className="mr-2 rounded bg-violet-100 px-1.5 py-0.5 font-mono text-violet-800 dark:bg-violet-800 dark:text-violet-200">
                  {item.pattern}
                </code>
                <span className="text-violet-700 dark:text-violet-300">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegexTester;
