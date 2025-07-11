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
        <mark key={`match-${i}`} className="bg-green-200 dark:bg-green-700 px-0.5 rounded">
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
    <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-violet-50 via-white to-violet-100 dark:from-violet-900/60 dark:via-violet-950/80 dark:to-violet-900/60 rounded-2xl border border-violet-300 dark:border-violet-700 shadow-xl flex flex-col items-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-200 dark:bg-violet-800 rounded-full opacity-30 blur-2xl z-0" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-100 dark:bg-violet-900 rounded-full opacity-20 blur-2xl z-0" />

      <h2 className="text-2xl font-extrabold mb-3 text-violet-800 dark:text-violet-100 drop-shadow-lg z-10 tracking-tight">
        <span className="inline-block align-middle mr-2">
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

      <p className="mb-6 text-violet-700/80 dark:text-violet-200/80 text-center max-w-lg z-10 text-sm md:text-base">
        Test and debug regular expressions with live match highlighting and a handy cheatsheet. Find
        and replace text patterns with ease.
      </p>

      <div className="w-full z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="tester">Pattern Tester</TabsTrigger>
            <TabsTrigger value="replace">Find & Replace</TabsTrigger>
          </TabsList>

          <TabsContent value="tester" className="space-y-4">
            {/* Regex input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-violet-700 dark:text-violet-300 flex items-center gap-2">
                  <span>RegEx Pattern</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-violet-400 cursor-help" />
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
                  className="h-6 text-xs px-2 flex items-center gap-1"
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
                <span className="bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 px-3 py-2 rounded-l-md border border-r-0 border-violet-300 dark:border-violet-700 font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter your regex pattern..."
                  className="flex-1 p-2 border border-violet-300 dark:border-violet-700 bg-white dark:bg-violet-950 text-violet-900 dark:text-violet-100 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono text-sm"
                />
                <span className="bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 px-3 py-2 rounded-r-md border border-l-0 border-violet-300 dark:border-violet-700 font-mono flex items-center">
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
                <label key={flag.value} className="flex items-center gap-1 cursor-pointer">
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
                          <Info className="inline-block h-3 w-3 ml-1 text-violet-400 cursor-help" />
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
              <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">
                Test String
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test against your regex..."
                className="w-full min-h-[100px] p-3 border border-violet-300 dark:border-violet-700 rounded-md bg-white dark:bg-violet-950 text-violet-900 dark:text-violet-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Matches */}
            {pattern && testText && !error && (
              <div className="border border-violet-300 dark:border-violet-700 rounded-md overflow-hidden">
                <div className="bg-violet-100 dark:bg-violet-900 px-4 py-2 border-b border-violet-300 dark:border-violet-700 flex justify-between items-center">
                  <span className="font-medium text-sm text-violet-800 dark:text-violet-200">
                    Matches ({matchCount})
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-violet-950 max-h-[200px] overflow-auto">
                  {matches.length > 0 ? (
                    <div className="whitespace-pre-wrap font-mono text-sm text-violet-900 dark:text-violet-100">
                      {getHighlightedText()}
                    </div>
                  ) : (
                    <div className="text-center text-violet-500 dark:text-violet-400 text-sm py-4">
                      No matches found
                    </div>
                  )}
                </div>
                {matches.length > 0 && (
                  <div className="bg-violet-50 dark:bg-violet-900/50 px-4 py-2 border-t border-violet-300 dark:border-violet-700">
                    <h4 className="font-medium text-sm text-violet-800 dark:text-violet-200 mb-2">
                      Match Details:
                    </h4>
                    <div className="max-h-[150px] overflow-auto">
                      {matches.map((match, index) => (
                        <div
                          key={index}
                          className="text-xs mb-1 p-1 bg-violet-100 dark:bg-violet-900 rounded"
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  RegEx Pattern
                </label>
              </div>
              <div className="flex">
                <span className="bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 px-3 py-2 rounded-l-md border border-r-0 border-violet-300 dark:border-violet-700 font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter your regex pattern..."
                  className="flex-1 p-2 border border-violet-300 dark:border-violet-700 bg-white dark:bg-violet-950 text-violet-900 dark:text-violet-100 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono text-sm"
                />
                <span className="bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 px-3 py-2 rounded-r-md border border-l-0 border-violet-300 dark:border-violet-700 font-mono flex items-center">
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
              <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">
                Replacement Text
              </label>
              <input
                type="text"
                value={replacementText}
                onChange={(e) => setReplacementText(e.target.value)}
                placeholder="Text to replace matched patterns..."
                className="w-full p-2 border border-violet-300 dark:border-violet-700 rounded-md bg-white dark:bg-violet-950 text-violet-900 dark:text-violet-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
              />
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
                Use $1, $2, etc. to refer to capturing groups
              </p>
            </div>

            {/* Test string */}
            <div>
              <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">
                Text to Process
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to find and replace..."
                className="w-full min-h-[100px] p-3 border border-violet-300 dark:border-violet-700 rounded-md bg-white dark:bg-violet-950 text-violet-900 dark:text-violet-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
              />
            </div>

            {/* Replace button */}
            <Button
              onClick={handleReplace}
              disabled={!pattern || !testText}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Replace
            </Button>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Replacement result */}
            {replacePattern && (
              <div className="border border-violet-300 dark:border-violet-700 rounded-md overflow-hidden">
                <div className="bg-violet-100 dark:bg-violet-900 px-4 py-2 border-b border-violet-300 dark:border-violet-700">
                  <span className="font-medium text-sm text-violet-800 dark:text-violet-200">
                    Result
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-violet-950">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-violet-900 dark:text-violet-100">
                    {replacePattern}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* RegEx cheatsheet */}
        <div className="mt-8 border-t border-violet-300 dark:border-violet-700 pt-4">
          <h3 className="font-medium text-violet-800 dark:text-violet-200 mb-3">
            RegEx Cheatsheet
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {regexCheatsheet.map((item, index) => (
              <div
                key={index}
                className="flex items-start p-1.5 bg-violet-50 dark:bg-violet-900/30 rounded"
              >
                <code className="font-mono bg-violet-100 dark:bg-violet-800 text-violet-800 dark:text-violet-200 px-1.5 py-0.5 rounded mr-2">
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
