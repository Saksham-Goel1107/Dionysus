import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import templates from '@/gitignore-helper/templates';
import { Check, Download, Copy, X, Search } from 'lucide-react';

const osOptions = [
  { label: 'iOS/macOS', value: 'ios' },
  { label: 'Linux', value: 'linux' },
  { label: 'MacOS', value: 'macos' },
  { label: 'Windows', value: 'windows' },
];

const techOptions = [
  { label: '.NET', value: 'dotnet' },
  { label: 'Android', value: 'android' },
  { label: 'Android Studio', value: 'androidstudio' },
  { label: 'Ansible', value: 'ansible' },
  { label: 'Arduino', value: 'arduino' },
  { label: 'Archives', value: 'archives' },
  { label: 'AWS', value: 'aws' },
  { label: 'Backup files', value: 'backup' },
  { label: 'Blender', value: 'blender' },
  { label: 'CodeAnalytics', value: 'codeanalytics' },
  { label: 'Configs', value: 'configs' },
  { label: 'Database files', value: 'databases' },
  { label: 'Django', value: 'django' },
  { label: 'Docker', value: 'docker' },
  { label: 'Eclipse', value: 'eclipse' },
  { label: 'Electron', value: 'electron' },
  { label: 'Elixir', value: 'elixir' },
  { label: 'Emacs', value: 'emacs' },
  { label: 'Firestore', value: 'firestore' },
  { label: 'Flask', value: 'flask' },
  { label: 'Fonts', value: 'fonts' },
  { label: 'Go', value: 'go' },
  { label: 'Google Cloud SDK', value: 'gcloud' },
  { label: 'Google Firestore', value: 'firestore' },
  { label: 'Gradle', value: 'gradle' },
  { label: 'HashiCorp Vault', value: 'vault' },
  { label: 'Images', value: 'images' },
  { label: 'IntelliJ IDEA', value: 'intellij' },
  { label: 'Java', value: 'java' },
  { label: 'JetBrains IDEs', value: 'jetbrains' },
  { label: 'Jupyter', value: 'jupyter' },
  { label: 'Julia', value: 'julia' },
  { label: 'Keras', value: 'keras' },
  { label: 'Kubernetes', value: 'kubernetes' },
  { label: 'LaTeX', value: 'latex' },
  { label: 'Laravel', value: 'laravel' },
  { label: 'LicenseMakerPage', value: 'licensemakerpage' },
  { label: 'Logs', value: 'logs' },
  { label: 'Maven', value: 'maven' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'NetBeans', value: 'netbeans' },
  { label: 'Next.js', value: 'next' },
  { label: 'Node.js', value: 'node' },
  { label: 'Notebooks', value: 'notebooks' },
  { label: 'npm', value: 'npm' },
  { label: 'Others', value: 'others' },
  { label: 'PHP', value: 'php' },
  { label: 'Photoshop', value: 'photoshop' },
  { label: 'pnpm', value: 'pnpm' },
  { label: 'Python', value: 'python' },
  { label: 'Rails', value: 'rails' },
  { label: 'Raspberry Pi', value: 'raspberry_pi' },
  { label: 'React', value: 'react' },
  { label: 'R', value: 'r' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Rust', value: 'rust' },
  { label: 'Search', value: 'search' },
  { label: 'StressTester', value: 'stresstester' },
  { label: 'SublimeText', value: 'sublimetext' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'TensorFlow', value: 'tensorflow' },
  { label: 'Terraform', value: 'terraform' },
  { label: 'Unity', value: 'unity' },
  { label: 'Vagrant', value: 'vagrant' },
  { label: 'Vault', value: 'vault' },
  { label: 'Videos', value: 'videos' },
  { label: 'VirtualBox', value: 'virtualbox' },
  { label: 'Vim', value: 'vim' },
  { label: 'VSCode', value: 'vscode' },
  { label: 'Vue', value: 'vue' },
  { label: 'WebStorm', value: 'webstorm' },
  { label: 'Wiki', value: 'wiki' },
  { label: 'Yarn', value: 'yarn' },
];

function generateGitignore(selected: string[]) {
  return (
    selected.map((key) => templates[key as keyof typeof templates]).join('\n') ||
    '# Select a tech stack to generate .gitignore'
  );
}

const GitignoreModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<string[]>(['node']);
  const [search, setSearch] = useState('');

  const gitignoreTemplate = generateGitignore(selected);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(gitignoreTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([gitignoreTemplate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.gitignore';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelect = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const filterOptions = (options: { label: string; value: string }[]) =>
    options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-xl border border-muted-foreground/10 bg-background p-0 shadow-lg">
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between bg-background px-6 pb-2 pt-6">
          <DialogTitle className="flex-1 text-lg font-bold">
            Generate a Perfect .gitignore
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 pb-2 pt-1">
          <div className="mb-4">
            <div className="mb-2 font-semibold">Search & Choose your tech stack(s) or OS:</div>
            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tech stack or OS..."
                className="w-full rounded-lg border border-muted-foreground/20 bg-muted py-2 pl-8 pr-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="mb-2">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Operating Systems
              </div>
              <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto">
                {filterOptions(osOptions).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={selected.includes(opt.value) ? 'default' : 'outline'}
                    onClick={() => handleSelect(opt.value)}
                    size="sm"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected.includes(opt.value) ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted-foreground/10'}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Tech Stacks & Tools
              </div>
              <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                {filterOptions(techOptions).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={selected.includes(opt.value) ? 'default' : 'outline'}
                    onClick={() => handleSelect(opt.value)}
                    size="sm"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected.includes(opt.value) ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted-foreground/10'}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="relative mb-4 mt-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Your .gitignore
            </label>
            <pre
              className="max-h-64 select-all overflow-x-auto whitespace-pre-wrap rounded-lg border border-muted-foreground/20 bg-muted p-4 font-mono text-xs shadow-inner focus:outline-none"
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
              {gitignoreTemplate}
            </pre>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-muted-foreground/10 bg-background px-6 py-4">
          <Button onClick={handleCopy} variant="outline" className="flex items-center gap-1">
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
          <Button onClick={handleDownload} variant="default" className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GitignoreModal;
