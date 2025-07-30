'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Info, CheckCircle } from 'lucide-react';
import yaml from 'js-yaml';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const YamlValidator: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('validator');
  const [jsonOutput, setJsonOutput] = useState<string>('');

  // Validate YAML input
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setJsonOutput('');
      setError(null);
      return;
    }

    try {
      // Parse YAML to JSON object
      const parsedYaml = yaml.load(input);

      // Convert back to formatted YAML
      const formattedYaml = yaml.dump(parsedYaml, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
      });

      setOutput(formattedYaml);
      setJsonOutput(JSON.stringify(parsedYaml, null, 2));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setOutput('');
      setJsonOutput('');
    }
  }, [input]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-cyan-300 bg-gradient-to-br from-cyan-50 via-white to-cyan-100 p-8 shadow-xl dark:border-cyan-700 dark:from-cyan-900/60 dark:via-cyan-950/80 dark:to-cyan-900/60">
      <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-cyan-200 opacity-30 blur-2xl dark:bg-cyan-800" />
      <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full bg-cyan-100 opacity-20 blur-2xl dark:bg-cyan-900" />

      <h2 className="z-10 mb-3 text-2xl font-extrabold tracking-tight text-cyan-800 drop-shadow-lg dark:text-cyan-100">
        <span className="mr-2 inline-block align-middle">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="inline-block text-cyan-500 dark:text-cyan-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2zm4-16h.01M12 7h.01"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 11h14M5 16h14"
            />
          </svg>
        </span>
        YAML Formatter & Validator
      </h2>

      <p className="z-10 mb-6 max-w-lg text-center text-sm text-cyan-700/80 dark:text-cyan-200/80 md:text-base">
        Validate, format, and convert YAML with real-time error detection. Perfect for configuration
        files and data interchange.
      </p>

      <div className="z-10 w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="validator">YAML Validator</TabsTrigger>
            <TabsTrigger value="converter">YAML to JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="validator" className="w-full">
            <div className="flex w-full flex-col gap-4">
              <div className="relative">
                <textarea
                  className="h-64 w-full resize-none rounded-md border border-cyan-300 bg-white p-4 font-mono text-sm text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-100"
                  placeholder="Paste your YAML here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                {error && (
                  <div className="mt-2 rounded-md border border-red-300 bg-red-100 p-3 font-mono text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                      <span className="whitespace-pre-wrap break-all">{error}</span>
                    </div>
                  </div>
                )}
                {output && !error && (
                  <div className="relative mt-4">
                    <div className="absolute right-2 top-2 z-20">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopy(output)}
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-md border border-green-300 bg-white p-4 font-mono text-sm text-green-800 dark:border-green-800 dark:bg-cyan-950 dark:text-green-200">
                      {output}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="converter" className="w-full">
            <div className="flex w-full flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                    YAML Input
                  </h3>
                  <textarea
                    className="h-64 w-full resize-none rounded-md border border-cyan-300 bg-white p-4 font-mono text-sm text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-100"
                    placeholder="Paste your YAML here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                    JSON Output
                  </h3>
                  <div className="relative h-64">
                    <div className="absolute right-2 top-2 z-20">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopy(jsonOutput)}
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="h-full overflow-auto rounded-md border border-cyan-300 bg-white p-4 font-mono text-sm text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-100">
                      {jsonOutput || 'Converted JSON will appear here...'}
                    </pre>
                  </div>
                </div>
              </div>
              {error && (
                <div className="mt-2 rounded-md border border-red-300 bg-red-100 p-3 font-mono text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                    <span className="whitespace-pre-wrap break-all">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default YamlValidator;
