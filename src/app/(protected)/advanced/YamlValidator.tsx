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
    <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-cyan-50 via-white to-cyan-100 dark:from-cyan-900/60 dark:via-cyan-950/80 dark:to-cyan-900/60 rounded-2xl border border-cyan-300 dark:border-cyan-700 shadow-xl flex flex-col items-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-200 dark:bg-cyan-800 rounded-full opacity-30 blur-2xl z-0" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-100 dark:bg-cyan-900 rounded-full opacity-20 blur-2xl z-0" />

      <h2 className="text-2xl font-extrabold mb-3 text-cyan-800 dark:text-cyan-100 drop-shadow-lg z-10 tracking-tight">
        <span className="inline-block align-middle mr-2">
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

      <p className="mb-6 text-cyan-700/80 dark:text-cyan-200/80 text-center max-w-lg z-10 text-sm md:text-base">
        Validate, format, and convert YAML with real-time error detection. Perfect for configuration
        files and data interchange.
      </p>

      <div className="w-full z-10">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="validator">YAML Validator</TabsTrigger>
            <TabsTrigger value="converter">YAML to JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="validator" className="w-full">
            <div className="flex flex-col gap-4 w-full">
              <div className="relative">
                <textarea
                  className="w-full h-64 p-4 rounded-md border border-cyan-300 dark:border-cyan-700 bg-white dark:bg-cyan-950 text-sm font-mono text-cyan-900 dark:text-cyan-100 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Paste your YAML here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                {error && (
                  <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200 font-mono">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="break-all whitespace-pre-wrap">{error}</span>
                    </div>
                  </div>
                )}
                {output && !error && (
                  <div className="mt-4 relative">
                    <div className="absolute top-2 right-2 z-20">
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
                    <pre className="p-4 bg-white dark:bg-cyan-950 rounded-md border border-green-300 dark:border-green-800 overflow-auto max-h-64 text-sm font-mono text-green-800 dark:text-green-200">
                      {output}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="converter" className="w-full">
            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-cyan-800 dark:text-cyan-200">
                    YAML Input
                  </h3>
                  <textarea
                    className="w-full h-64 p-4 rounded-md border border-cyan-300 dark:border-cyan-700 bg-white dark:bg-cyan-950 text-sm font-mono text-cyan-900 dark:text-cyan-100 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Paste your YAML here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-cyan-800 dark:text-cyan-200">
                    JSON Output
                  </h3>
                  <div className="relative h-64">
                    <div className="absolute top-2 right-2 z-20">
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
                    <pre className="h-full p-4 bg-white dark:bg-cyan-950 rounded-md border border-cyan-300 dark:border-cyan-700 overflow-auto text-sm font-mono text-cyan-900 dark:text-cyan-100">
                      {jsonOutput || 'Converted JSON will appear here...'}
                    </pre>
                  </div>
                </div>
              </div>
              {error && (
                <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200 font-mono">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="break-all whitespace-pre-wrap">{error}</span>
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
