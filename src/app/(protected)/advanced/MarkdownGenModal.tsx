import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy, X, Download, Eye, EyeOff } from 'lucide-react';
import templates from './markdown-templates';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const docOptions = [
  { label: 'Code of Conduct', value: 'CODE_OF_CONDUCT.md' },
  { label: 'Contributing', value: 'CONTRIBUTING.md' },
  { label: 'Security', value: 'SECURITY.md' },
];

const MarkdownGenModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<string>(docOptions[0]?.value ?? '');
  const [email, setEmail] = useState('');
  const [project, setProject] = useState('');
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(true);

  const handleSelect = (value: string) => {
    setSelected(value);
  };

  const generated = templates[selected as keyof typeof templates]({ email, project, username });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([generated], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selected || 'MARKDOWN_DOCS.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-0 shadow-2xl dark:border-muted-foreground/10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between bg-blue-50/80 px-8 pb-2 pt-8 backdrop-blur dark:bg-background/80">
          <DialogTitle className="flex-1 text-xl font-extrabold tracking-tight text-blue-900 dark:text-blue-100">
            Markdown Docs Generator
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-8 pb-2 pt-1">
          <div className="mb-6">
            <div className="mb-2 font-semibold text-blue-900 dark:text-blue-200">
              Select documents to generate:
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {docOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={selected === opt.value ? 'default' : 'outline'}
                  onClick={() => handleSelect(opt.value)}
                  size="sm"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected === opt.value ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500 dark:bg-primary/10 dark:text-primary dark:ring-primary' : 'hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-muted-foreground/10'}`}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="mb-2 flex flex-col gap-3 md:flex-row">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-muted-foreground">
                  Project Name
                </label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. MyAwesomeRepo"
                  className="w-full rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-muted-foreground/20 dark:bg-muted dark:text-white dark:focus:ring-primary/30"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-muted-foreground">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-muted-foreground/20 dark:bg-muted dark:text-white dark:focus:ring-primary/30"
                />
              </div>
              {selected === 'CONTRIBUTING.md' && (
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-muted-foreground">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Saksham-Goel1107"
                    className="w-full rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-muted-foreground/20 dark:bg-muted dark:text-white dark:focus:ring-primary/30"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="relative mb-4 mt-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-blue-800 dark:text-muted-foreground">
                Generated Markdown
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={() => setPreview((p) => !p)}
                title={preview ? 'Show Raw Markdown' : 'Show Preview'}
              >
                {preview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
            {preview ? (
              <div className="prose prose-sm min-h-[120px] max-w-none overflow-x-auto rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 shadow-inner dark:border-muted-foreground/20 dark:bg-gray-900 dark:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generated}</ReactMarkdown>
              </div>
            ) : (
              <pre
                className="max-h-48 min-h-[120px] select-all overflow-x-auto whitespace-pre-wrap rounded-lg border border-blue-200 bg-blue-50 p-4 font-mono text-xs text-blue-900 shadow-inner focus:outline-none dark:border-muted-foreground/20 dark:bg-muted dark:text-white"
                tabIndex={0}
                style={{ userSelect: 'all', cursor: 'text' }}
                onClick={(e) => {
                  const range = document.createRange();
                  range.selectNodeContents(e.currentTarget);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                }}
              >
                {generated}
              </pre>
            )}
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-blue-200 bg-blue-50/80 px-8 py-5 dark:border-muted-foreground/10 dark:bg-background/80">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex items-center gap-1 border-blue-200 text-blue-900 hover:bg-blue-100 dark:border-muted-foreground/20 dark:text-white dark:hover:bg-muted-foreground/10"
          >
            <Copy className="h-4 w-4" />{' '}
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </span>
            ) : (
              'Copy'
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="default"
            className="flex items-center gap-1 border-0 bg-blue-500 text-white hover:bg-blue-600"
          >
            <Download className="h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkdownGenModal;
