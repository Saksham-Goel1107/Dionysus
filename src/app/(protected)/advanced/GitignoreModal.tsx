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
      <DialogContent className="max-w-2xl p-0 rounded-xl shadow-lg border border-muted-foreground/10 bg-background overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2 sticky top-0 z-10 bg-background">
          <DialogTitle className="text-lg font-bold flex-1">
            Generate a Perfect .gitignore
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] px-6 pb-2 pt-1">
          <div className="mb-4">
            <div className="font-semibold mb-2">Search & Choose your tech stack(s) or OS:</div>
            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tech stack or OS..."
                className="pl-8 pr-2 py-2 rounded-lg border border-muted-foreground/20 bg-muted w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div className="mb-2">
              <div className="font-medium text-xs mb-1 text-muted-foreground">
                Operating Systems
              </div>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {filterOptions(osOptions).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={selected.includes(opt.value) ? 'default' : 'outline'}
                    onClick={() => handleSelect(opt.value)}
                    size="sm"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected.includes(opt.value) ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted-foreground/10'}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-xs mb-1 text-muted-foreground">
                Tech Stacks & Tools
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {filterOptions(techOptions).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={selected.includes(opt.value) ? 'default' : 'outline'}
                    onClick={() => handleSelect(opt.value)}
                    size="sm"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected.includes(opt.value) ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted-foreground/10'}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="relative mb-4 mt-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Your .gitignore
            </label>
            <pre
              className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64 border border-muted-foreground/20 select-all focus:outline-none whitespace-pre-wrap font-mono shadow-inner"
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
        <DialogFooter className="flex gap-2 justify-end px-6 py-4 bg-background border-t border-muted-foreground/10 sticky bottom-0 z-10">
          <Button onClick={handleCopy} variant="outline" className="flex items-center gap-1">
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
          <Button onClick={handleDownload} variant="default" className="flex items-center gap-1">
            <Download className="w-4 h-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GitignoreModal;
