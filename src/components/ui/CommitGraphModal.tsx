'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useProject from '@/hooks/use-project';
import React, { useEffect, useState, useRef } from 'react';
import CommitGraph from '@/components/ui/CommitGraph';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';
import MDEditor from '@uiw/react-md-editor';
import { readStreamableValue } from 'ai/rsc';
import { askQuestion } from '@/app/(protected)/dashboard/actions';
import Image from 'next/image';

const CommitGraphModal: React.FC = () => {
  const { project } = useProject();
  const { theme: appTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState('');

  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && project?.id && project.id !== lastProjectId) {
      setSummaryLoading(true);
      setSummaryError('');
      setSummary('');
      (async () => {
        try {
          const { output } = await askQuestion('Explain this repository', project.id);
          let result = '';
          for await (const delta of readStreamableValue(output)) {
            if (delta) result += delta;
          }
          setSummary(result);
          setLastProjectId(project.id);
        } catch (e) {
          setSummaryError('Failed to load summary.');
        } finally {
          setSummaryLoading(false);
        }
      })();
    }
  }, [open, project, lastProjectId]);

  const handleAskMore = async () => {
    if (!question.trim() || !project?.id) return;
    setAnswerLoading(true);
    setAnswerError('');
    setAnswer('');
    try {
      const { output } = await askQuestion(question, project.id);
      let result = '';
      for await (const delta of readStreamableValue(output)) {
        if (delta) result += delta;
      }
      setAnswer(result);
    } catch (e) {
      setAnswerError('Failed to get answer.');
    } finally {
      setAnswerLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setQuestion('');
      setAnswer('');
      setAnswerError('');
      setAnswerLoading(false);
    }
  }, [open]);

  const handleDownload = async () => {
    if (!graphRef.current) return;
    // Find the SVG element inside the graph container
    const svg = graphRef.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    // Get SVG size
    const width = parseInt(svg.getAttribute('width') || '900', 10);
    const height = parseInt(svg.getAttribute('height') || '600', 10);
    // Create a canvas and draw the SVG onto it
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // for high-res
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Create an image from the SVG string
    const img = new window.Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      // Download
      const link = document.createElement('a');
      link.download = `${project?.name || 'commit-graph'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  const isDark = appTheme === 'dark';
  const cardBg = isDark
    ? 'bg-gradient-to-br from-[#181a20] via-[#23272f] to-[#181a20]'
    : 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100';
  const cardBorder = isDark ? 'border-indigo-900' : 'border-indigo-200';
  const textMain = isDark ? 'text-indigo-100' : 'text-indigo-900';
  const textSubtle = isDark ? 'text-indigo-300' : 'text-indigo-600';
  const inputBg = isDark ? 'bg-[#23272f] text-white' : 'bg-indigo-50 text-indigo-900';
  const inputBorder = isDark ? 'border-indigo-800' : 'border-indigo-300';
  const buttonMain = isDark
    ? 'bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white'
    : 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 text-white';
  const buttonOutline = isDark
    ? 'border-indigo-700 text-indigo-200'
    : 'border-indigo-400 text-indigo-700';

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-5xl px-0 py-0 border-none bg-transparent max-h-[90vh] overflow-y-auto">
          <div
            className={`rounded-3xl shadow-2xl border-2 ${cardBorder} ${cardBg} w-full p-0 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 dark:from-indigo-900 dark:via-indigo-800 dark:to-indigo-950 shadow-md">
              <Image
                src="/logo.png"
                alt="Logo"
                width={44}
                height={44}
                className="rounded shadow-lg border-2 border-white dark:border-indigo-900"
              />
              <DialogTitle className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex-1 drop-shadow-lg">
                {project?.name || 'Repository'}{' '}
                <span className="font-light">– Commit Graph & Repo AI</span>
              </DialogTitle>
              {project?.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-100 hover:text-yellow-200 text-sm font-semibold underline underline-offset-2 transition-all duration-150"
                >
                  View on GitHub
                </a>
              )}
            </div>
            {/* Main content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 px-4 md:px-10 py-8 w-full">
              {/* AI Summary & QnA */}
              <div className="flex flex-col gap-6">
                <div
                  className={`rounded-2xl border-2 ${cardBorder} bg-white/80 dark:bg-[#23272f]/80 shadow-lg p-6 flex flex-col gap-3`}
                >
                  <h3 className={`text-xl font-bold mb-2 ${textMain}`}>AI Repository Summary</h3>
                  <ScrollArea className="h-48 rounded border border-indigo-200 dark:border-indigo-800 p-3 text-base font-medium bg-white dark:bg-zinc-800">
                    {summaryLoading ? (
                      <p className="animate-pulse text-indigo-400">Loading summary...</p>
                    ) : summaryError ? (
                      <p className="text-red-500">{summaryError}</p>
                    ) : (
                      <MDEditor.Markdown
                        source={summary}
                        className="prose dark:prose-invert max-w-none"
                      />
                    )}
                  </ScrollArea>
                </div>
                <div
                  className={`rounded-2xl border-2 ${cardBorder} bg-white/80 dark:bg-[#23272f]/80 shadow-lg p-6 flex flex-col gap-3`}
                >
                  <h3 className={`text-lg font-semibold mb-2 ${textMain}`}>Ask the Repo AI</h3>
                  <div className="text-xs text-indigo-500 dark:text-indigo-300 mb-2">
                    Tip: For concise suggestions, ask specific questions (e.g., “How do I fix this
                    error?” or “Suggest a function name”).
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question about this repo..."
                      className={`w-full rounded-xl border-2 px-3 py-2 text-base font-medium focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-150 ${inputBg} ${inputBorder} shadow-sm`}
                      rows={2}
                    ></textarea>
                    <Button
                      className={`mt-1 px-6 py-2 rounded-lg font-semibold ${buttonMain} shadow-md disabled:opacity-60`}
                      size="sm"
                      onClick={handleAskMore}
                      disabled={answerLoading || !question.trim()}
                    >
                      {answerLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>{' '}
                          Asking...
                        </span>
                      ) : (
                        'Ask'
                      )}
                    </Button>
                  </div>
                  {answer && (
                    <div className="mt-3 flex flex-col gap-2 max-h-[320px] overflow-y-auto w-full">
                      <div className="flex items-end gap-2 w-full">
                        <div className="rounded-xl px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 shadow w-full text-base font-medium self-end ml-auto">
                          {question}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 w-full">
                        <div className="rounded-xl px-4 py-2 bg-white dark:bg-zinc-800 text-indigo-900 dark:text-indigo-100 shadow w-full text-base font-medium">
                          <MDEditor.Markdown
                            source={answer}
                            className="prose dark:prose-invert max-w-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Commit Graph */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-xl font-bold ${textMain}`}>Commit Graph</h3>
                  <Button
                    onClick={handleDownload}
                    className="text-xs px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-300 dark:from-indigo-900 dark:via-indigo-800 dark:to-indigo-950 text-indigo-800 dark:text-white border border-indigo-300 dark:border-indigo-700 shadow"
                  >
                    Download PNG
                  </Button>
                </div>
                <div
                  ref={graphRef}
                  className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-4 bg-white dark:bg-zinc-800 shadow-lg"
                >
                  <CommitGraph />
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 pt-4 flex flex-col md:flex-row gap-3">
              <Button
                onClick={() => setOpen(false)}
                className="w-full md:w-auto px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg text-lg mt-2 md:mt-0"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="max-w-2xl mx-auto my-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex justify-center items-center gap-3 flex-col">
        <div className="flex items-center gap-2">
          <svg
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="inline-block drop-shadow-lg"
          >
            <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="#3b82f6" />
            <circle cx="12" cy="12" r="4" fill="#6366f1" />
          </svg>
          <span className="text-2xl font-extrabold tracking-tight dark:text-white text-black drop-shadow-lg">
            Commit Graph & Repo AI
          </span>
        </div>
        <p className="text-base dark:text-indigo-100/90 text-gray-500 font-medium text-center max-w-xl">
          Visualize your repository&apos;s commit history and get instant AI-powered insights. Click
          below to open the interactive commit graph and ask questions about your codebase.
        </p>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="px-8 py-3 rounded-2xl text-lg font-bold shadow-lg bg-gradient-to-r from-blue-500 via-primary to-blue-600 hover:from-blue-600 hover:to-primary/90 transition-all duration-200 border-0 flex items-center gap-2 text-white tracking-tight"
          style={{ minWidth: 240 }}
        >
          <svg
            width="22"
            height="22"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="inline-block"
          >
            <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="#3b82f6" />
            <circle cx="12" cy="12" r="4" fill="#6366f1" />
          </svg>
          View Commit Graph
        </Button>
      </div>
    </>
  );
};

export default CommitGraphModal;
