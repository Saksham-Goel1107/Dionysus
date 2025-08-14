'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Download, ClipboardCopy, Eye, EyeOff, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as acorn from 'acorn';
import { useTheme } from 'next-themes';
import { Textarea } from '@/components/ui/textarea';
import html2canvas from 'html2canvas';

// Language options for syntax highlighting
const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX/React' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'dockerfile', label: 'Dockerfile' },
];

// Improved linters for different languages
const lintCode = (code: string, language: string): { line: number; message: string }[] => {
  const errors: { line: number; message: string }[] = [];
  if (!code.trim()) return errors;
  const lines = code.split('\n');
  switch (language) {
    case 'javascript':
    case 'jsx':
    case 'typescript':
    case 'tsx':
      try {
        acorn.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
      } catch (err: any) {
        if (err.loc) {
          errors.push({ line: err.loc.line, message: err.message });
        } else {
          errors.push({ line: 1, message: err.message });
        }
      }
      break;
    case 'python':
      // Only check for indentation errors and unmatched brackets
      let indentStack: number[] = [];
      let bracketCount = 0;
      lines.forEach((line, index) => {
        if (line.includes('(')) bracketCount++;
        if (line.includes(')')) bracketCount--;
        if (line.trim().endsWith(':')) {
          indentStack.push((line.match(/^\s*/)?.[0].length || 0) + 4);
        } else if (line.trim().length > 0) {
          const actualIndent = line.match(/^\s*/)?.[0].length || 0;
          const expectedIndent =
            indentStack.length > 0 ? indentStack[indentStack.length - 1] : undefined;
          if (expectedIndent !== undefined && actualIndent < expectedIndent) {
            indentStack.pop();
          } else if (expectedIndent !== undefined && actualIndent !== expectedIndent) {
            errors.push({ line: index + 1, message: 'Indentation error' });
          }
        }
      });
      if (bracketCount !== 0) {
        errors.push({ line: lines.length, message: 'Unmatched parentheses in code' });
      }
      break;
    // Add more language-specific linting as needed
  }
  return errors;
};

const CodeFormatter = () => {
  // State variables
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showErrors, setShowErrors] = useState(true);
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('code-snippet');
  const { resolvedTheme } = useTheme();
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lint code on change
    const newErrors = lintCode(code, language);
    setErrors(newErrors);
  }, [code, language]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code as image with macOS style
  const downloadAsImage = async () => {
    if (codeRef.current) {
      try {
        // Create a wrapper div for the macOS style window
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '-9999px';
        wrapper.style.zIndex = '9999';
        wrapper.style.background = 'none';
        document.body.appendChild(wrapper);

        // Create the main window container with a subtle gradient and shadow
        const container = document.createElement('div');
        container.style.width = codeRef.current.offsetWidth + 'px';
        container.style.maxWidth = '800px';
        container.style.background =
          resolvedTheme === 'dark'
            ? 'linear-gradient(135deg, #232526 0%, #414345 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
        container.style.borderRadius = '12px';
        container.style.overflow = 'hidden';
        container.style.boxShadow =
          '0 12px 32px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.08)';
        container.style.border =
          resolvedTheme === 'dark' ? '1.5px solid #23272e' : '1.5px solid #e5e7eb';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        // Create macOS style header
        const header = document.createElement('div');
        header.style.height = '38px';
        header.style.padding = '0 18px';
        header.style.background =
          resolvedTheme === 'dark'
            ? 'linear-gradient(90deg, #232526 0%, #414345 100%)'
            : 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)';
        header.style.borderTopLeftRadius = '12px';
        header.style.borderTopRightRadius = '12px';
        header.style.borderBottom =
          resolvedTheme === 'dark' ? '1.5px solid #23272e' : '1.5px solid #e5e7eb';
        header.style.display = 'flex';
        header.style.alignItems = 'center';

        // Add the traffic light buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '8px';
        buttonsContainer.style.marginRight = '14px';
        ['#ff5f57', '#febc2e', '#28c840'].forEach((color) => {
          const button = document.createElement('div');
          button.style.width = '14px';
          button.style.height = '14px';
          button.style.borderRadius = '50%';
          button.style.backgroundColor = color;
          button.style.border = '1.5px solid rgba(0,0,0,0.08)';
          buttonsContainer.appendChild(button);
        });
        header.appendChild(buttonsContainer);

        // Add filename and language elegantly
        const title = document.createElement('div');
        title.style.flexGrow = '1';
        title.style.textAlign = 'center';
        title.style.fontFamily = 'JetBrains Mono, Menlo, Monaco, Consolas, monospace';
        title.style.fontSize = '15px';
        title.style.fontWeight = '600';
        title.style.letterSpacing = '0.02em';
        title.style.color = resolvedTheme === 'dark' ? '#e0e0e0' : '#22223b';
        title.textContent = `${fileName}.${language}`;
        header.appendChild(title);

        // Add language badge
        const langBadge = document.createElement('div');
        langBadge.style.fontSize = '12px';
        langBadge.style.fontWeight = 'bold';
        langBadge.style.background = resolvedTheme === 'dark' ? '#23272e' : '#e5e7eb';
        langBadge.style.color = resolvedTheme === 'dark' ? '#c7d2fe' : '#374151';
        langBadge.style.padding = '2px 10px';
        langBadge.style.borderRadius = '8px';
        langBadge.style.marginLeft = 'auto';
        langBadge.textContent = language.toUpperCase();
        header.appendChild(langBadge);

        container.appendChild(header);

        // Clone the code container
        const codeClone = codeRef.current.cloneNode(true) as HTMLElement;
        codeClone.style.border = 'none';
        codeClone.style.borderRadius = '0 0 12px 12px';
        codeClone.style.background = 'none';
        codeClone.style.boxShadow = 'none';
        codeClone.style.margin = '0';
        codeClone.style.padding = '0';
        // Enhance code font and padding
        const pre = codeClone.querySelector('pre');
        if (pre) {
          pre.style.background = 'none';
          pre.style.margin = '0';
          pre.style.padding = '28px 32px 28px 32px';
          pre.style.fontSize = '15px';
          pre.style.fontFamily = 'JetBrains Mono, Menlo, Monaco, Consolas, monospace';
          pre.style.borderRadius = '0 0 12px 12px';
          pre.style.boxShadow = 'none';
        }
        container.appendChild(codeClone);
        wrapper.appendChild(container);

        // Render to canvas with the entire wrapper
        const canvas = await html2canvas(container, {
          backgroundColor: 'rgba(0,0,0,0)',
          scale: 2, // Higher resolution
        });

        // Remove the temporary elements
        document.body.removeChild(wrapper);

        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Error generating image:', err);
      }
    }
  };

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 shadow-2xl dark:border-gray-700 dark:from-gray-900/80 dark:via-gray-950/90 dark:to-gray-900/80">
      <h2 className="mb-3 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
        <Sparkles className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        Code Beautifier
      </h2>
      <p className="z-10 mb-6 max-w-lg text-center text-sm text-gray-600 dark:text-gray-300 md:text-base">
        Paste your code, select a language, and create beautiful, shareable code snippets with
        syntax highlighting. Perfect for documentation and social media!
      </p>
      <div className="z-10 grid w-full gap-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row">
          <div className="min-w-[180px] flex-1">
            <Label
              htmlFor="language-select"
              className="mb-1 block text-gray-800 dark:text-gray-100"
            >
              Language
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full border-gray-300 bg-white/90 dark:border-gray-700 dark:bg-gray-950/90">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="filename" className="mb-1 block text-gray-800 dark:text-gray-100">
              File Name (for download)
            </Label>
            <input
              id="filename"
              className="w-full rounded-md border border-gray-300 bg-white/90 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950/90 dark:text-gray-100"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          <div className="mb-1 flex items-end">
            <div className="flex items-center space-x-2">
              <Switch id="show-errors" checked={showErrors} onCheckedChange={setShowErrors} />
              <Label htmlFor="show-errors" className="text-gray-800 dark:text-gray-100">
                {showErrors ? (
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> Show Errors
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-4 w-4" /> Hide Errors
                  </span>
                )}
              </Label>
            </div>
          </div>
        </div>

        <Textarea
          className="min-h-[200px] border border-gray-300 bg-gray-100 p-4 font-mono text-sm text-gray-900 transition-all focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-600"
          placeholder={`Paste your ${languageOptions.find((l) => l.value === language)?.label || language} code here...`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />

        {/* Simple file header for context */}
        <div className="flex items-center justify-between rounded-t-lg border border-gray-300 bg-gray-200 px-4 py-1 dark:border-gray-700 dark:bg-gray-800">
          <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
            {fileName}.{language}
          </span>
          <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
            {languageOptions.find((l) => l.value === language)?.label || language}
          </span>
        </div>

        {/* Preview Section */}
        <div
          ref={codeRef}
          className="overflow-hidden rounded-b-lg border border-t-0 border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-950"
        >
          <SyntaxHighlighter
            language={language}
            style={resolvedTheme === 'dark' ? vscDarkPlus : oneLight}
            showLineNumbers
            wrapLines
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '14px',
              borderRadius: 0,
              lineHeight: 1.5,
            }}
            codeTagProps={{
              style: {
                fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                paddingLeft: 0,
              },
            }}
            lineNumberStyle={{
              minWidth: '2em',
              paddingRight: '1em',
              fontSize: '0.8em',
              opacity: 0.5,
              textAlign: 'right',
            }}
            lineProps={(lineNumber) => {
              const isErrorLine = showErrors && errors.some((error) => error.line === lineNumber);
              return {
                style: {
                  display: 'block',
                  backgroundColor: isErrorLine
                    ? resolvedTheme === 'dark'
                      ? 'rgba(255,0,0,0.10)'
                      : 'rgba(255,0,0,0.06)'
                    : undefined,
                  borderLeft: isErrorLine ? '3px solid #ef4444' : undefined,
                  padding: isErrorLine ? '0 0 0 5px' : '0 0 0 8px',
                },
              };
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>

        {/* Error display */}
        {showErrors && (
          <div className="mt-2">
            {errors.length > 0 ? (
              <details
                open
                className="rounded-md border border-gray-300 bg-gray-100 p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <summary className="mb-2 cursor-pointer select-none font-medium text-red-700 dark:text-red-300">
                  Found {errors.length} {errors.length === 1 ? 'issue' : 'issues'} (click to toggle)
                </summary>
                <ul className="list-disc space-y-1 pl-5 text-sm text-red-600 dark:text-red-400">
                  {errors.map((error, index) => (
                    <li key={index}>
                      Line {error.line}: {error.message}
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-center text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <span className="font-medium">No errors found!</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="flex items-center gap-2 border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-900/40"
          >
            {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
          <Button
            onClick={downloadAsImage}
            className="flex items-center gap-2 border border-gray-700 bg-gray-800 text-white hover:bg-gray-900 dark:border-gray-300 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <Download className="h-4 w-4" />
            Download as Image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CodeFormatter;
