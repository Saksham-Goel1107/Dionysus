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
      <DialogContent className="max-w-xl p-0 rounded-2xl shadow-2xl border border-blue-200 dark:border-muted-foreground/10 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-2 sticky top-0 z-10 bg-blue-50/80 dark:bg-background/80 backdrop-blur">
          <DialogTitle className="text-xl font-extrabold flex-1 text-blue-900 dark:text-blue-100 tracking-tight">
            Markdown Docs Generator
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] px-8 pb-2 pt-1">
          <div className="mb-6">
            <div className="font-semibold mb-2 text-blue-900 dark:text-blue-200">
              Select documents to generate:
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {docOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={selected === opt.value ? 'default' : 'outline'}
                  onClick={() => handleSelect(opt.value)}
                  size="sm"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected === opt.value ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-900 dark:ring-primary dark:bg-primary/10 dark:text-primary' : 'hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-muted-foreground/10'}`}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-3 mb-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-blue-800 dark:text-muted-foreground mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. MyAwesomeRepo"
                  className="w-full px-3 py-2 rounded border border-blue-200 dark:border-muted-foreground/20 bg-blue-50 dark:bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-primary/30 transition text-blue-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-blue-800 dark:text-muted-foreground mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 rounded border border-blue-200 dark:border-muted-foreground/20 bg-blue-50 dark:bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-primary/30 transition text-blue-900 dark:text-white"
                />
              </div>
              {selected === 'CONTRIBUTING.md' && (
                <div className="flex-1">
                  <label className="block text-xs font-medium text-blue-800 dark:text-muted-foreground mb-1">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Saksham-Goel1107"
                    className="w-full px-3 py-2 rounded border border-blue-200 dark:border-muted-foreground/20 bg-blue-50 dark:bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-primary/30 transition text-blue-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="relative mb-4 mt-4">
            <div className="flex items-center justify-between mb-1">
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
                {preview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
            {preview ? (
              <div className="prose prose-sm max-w-none bg-blue-50 dark:bg-gray-900 p-4 rounded-lg border border-blue-200 dark:border-muted-foreground/20 shadow-inner min-h-[120px] text-xs overflow-x-auto text-blue-900 dark:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generated}</ReactMarkdown>
              </div>
            ) : (
              <pre
                className="bg-blue-50 dark:bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-48 border border-blue-200 dark:border-muted-foreground/20 select-all focus:outline-none whitespace-pre-wrap font-mono shadow-inner min-h-[120px] text-blue-900 dark:text-white"
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
        <DialogFooter className="flex gap-2 justify-end px-8 py-5 bg-blue-50/80 dark:bg-background/80 border-t border-blue-200 dark:border-muted-foreground/10 sticky bottom-0 z-10">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex items-center gap-1 border-blue-200 dark:border-muted-foreground/20 text-blue-900 dark:text-white hover:bg-blue-100 dark:hover:bg-muted-foreground/10"
          >
            <Copy className="w-4 h-4" />{' '}
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                Copied!
              </span>
            ) : (
              'Copy'
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="default"
            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white border-0"
          >
            <Download className="w-4 h-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkdownGenModal;
