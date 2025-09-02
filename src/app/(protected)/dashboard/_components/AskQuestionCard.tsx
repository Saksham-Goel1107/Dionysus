'use client';
import GradientTypewriter from '@/components/mvpblocks/gradient-typewriter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import useProject from '@/hooks/use-project';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import MDEditor from '@uiw/react-md-editor';
import { readStreamableValue } from 'ai/rsc';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import React from 'react';
import { toast } from 'sonner';
import { askQuestion } from '../actions';
import CodeReferences from './CodeReferences';
import { Search } from 'lucide-react';

const AskQuestionCrad = () => {
  const { project } = useProject();
  const { theme } = useTheme();
  const [question, setQuestion] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = React.useState('');
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();

  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dark .gsc-control-cse {
        background-color: hsl(var(--card)) !important;
        border: 1px solid hsl(var(--border)) !important;
      }
      .dark .gsc-input-box {
        background-color: hsl(var(--background)) !important;
        border: 1px solid hsl(var(--border)) !important;
      }
      .dark .gsc-input {
        background-color: hsl(var(--background)) !important;
        color: hsl(var(--foreground)) !important;
      }
      .dark .gsc-search-button {
        background-color: hsl(var(--primary)) !important;
        border: 1px solid hsl(var(--primary)) !important;
      }
      .dark .gsc-search-button:hover {
        background-color: hsl(var(--primary)/0.9) !important;
      }
    `;
    document.head.appendChild(style);

    const initializeGoogleSearch = () => {
      if (window.google?.search?.cse?.element) {
        try {
          const container = document.getElementById('gcse-search-ask-card');
          if (container) {
            container.innerHTML = '';
            window.google.search.cse.element.render({
              div: 'gcse-search-ask-card',
              tag: 'search',
            });
          }
        } catch (error) {
          console.warn('Failed to initialize Google Custom Search:', error);
        }
      } else {
        setTimeout(initializeGoogleSearch, 500);
      }
    };

    const timeoutId = setTimeout(initializeGoogleSearch, 100);

    return () => {
      clearTimeout(timeoutId);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const onSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    setAnswer('');
    setFilesReferences([]);
    if (e) {
      e.preventDefault();
    }
    if (!project?.id) return;

    setLoading(true);
    setOpen(true);

    const { output, filesReferences } = await askQuestion(question, project.id);
    setFilesReferences(filesReferences);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }

    setLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="flex cursor-default items-center">
                <Image
                  className="mr-2 rounded-lg"
                  src="/logo.png"
                  alt="Logo"
                  width="40"
                  height="40"
                />
                <GradientTypewriter words="Dionysus" />
              </DialogTitle>
              <Button
                variant={'outline'}
                disabled={saveAnswer.isPending}
                onClick={() => {
                  saveAnswer.mutate(
                    {
                      projectId: project!.id,
                      question,
                      answer,
                      filesReferences,
                    },
                    {
                      onSuccess: () => {
                        toast.success('Answer saved!');
                        refetch();
                      },
                      onError: () => {
                        toast.error('Failed to save answer!');
                      },
                    },
                  );
                }}
              >
                Save Answer
              </Button>
            </div>
          </DialogHeader>
          <div data-color-mode={theme} className="markdown-editor-container">
            <ScrollArea className="m-auto !h-full max-h-[40vh] max-w-[70vw] overflow-auto">
              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-md bg-card p-4 text-card-foreground">
                {loading && !answer ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
                    <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
                    <div className="mb-2 h-4 w-1/3 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Waiting for AI response</span>
                      <span className="inline-block animate-bounce">.</span>
                      <span className="inline-block animate-bounce [animation-delay:0.2s]">.</span>
                      <span className="inline-block animate-bounce [animation-delay:0.4s]">.</span>
                    </div>
                  </div>
                ) : (
                  <MDEditor.Markdown source={answer} className="md-preview-content" />
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="h-4"></div>
          <CodeReferences filesReferences={filesReferences} />
          <Button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page ?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter' && question.trim().length >= 15 && !e.shiftKey) {
                  onSubmit(e);
                } else if (e.shiftKey && e.key === 'Enter') {
                  e.preventDefault();
                  setQuestion((q) => q + '\n');
                }
              }}
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={loading || question.trim().length < 15}>
              Ask Dionysus
            </Button>
          </form>

          <div className="mt-6 border-t pt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Search className="h-4 w-4" />
              Search on Google
            </div>
            <div
              id="gcse-search-ask-card"
              className="gcse-search"
              data-resultsurl=""
              data-newwindow="true"
              data-linktarget="_blank"
              style={{ minHeight: 56 }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCrad;
