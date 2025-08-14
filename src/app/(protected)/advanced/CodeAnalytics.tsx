'use client';
import React, { useEffect, useRef, useState } from 'react';
import useProject from '@/hooks/use-project';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { FaChartBar, FaListAlt, FaRobot } from 'react-icons/fa';
import MDEditor from '@uiw/react-md-editor';

const CodeAnalytics = () => {
  const { project } = useProject();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'charts' | 'summary' | 'ai'>('charts');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [quality, setQuality] = useState<any[]>([]);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const rawRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!project?.githubUrl) return;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/code-analytics?repoUrl=${encodeURIComponent(project.githubUrl)}`,
        );
        const data = await res.json();
        setAnalytics(data.analytics);
        setRepoInfo(data.repo); // <-- store repo info
        // Fetch quality analysis
        setQualityLoading(true);
        setQualityError(null);
        try {
          const qres = await fetch('/api/code-analytics/quality', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analytics: data.analytics }),
          });
          const qdata = await qres.json();
          setQuality(qdata.issues);
        } catch {
          setQualityError('Failed to fetch quality analysis.');
        }
        setQualityLoading(false);
      } catch {
        setError('Failed to fetch analytics.');
      }
      setLoading(false);
    };
    fetchAnalytics();
    // Poll every 30s for new commits
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [project?.githubUrl]);

  const [repoInfo, setRepoInfo] = useState<any>(null);

  const handleShowAI = async () => {
    setActiveTab('ai');
    if (!aiExplanation && analytics && repoInfo) {
      try {
        const res = await fetch('/api/gemini/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analytics, repo: repoInfo }),
        });
        const data = await res.json();
        setAiExplanation(data.explanation);
      } catch {
        setAiExplanation('Failed to get AI explanation.');
      }
    }
  };

  const handleCopy = () => {
    if (rawRef.current) {
      navigator.clipboard.writeText(rawRef.current.innerText);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !analytics || !repoInfo) return;
    setChatLoading(true);
    setChatError(null);
    const newHistory = [...chatHistory, { role: 'user' as 'user', content: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: chatInput,
          analytics,
          repo: repoInfo,
          history: newHistory.filter((m) => m.role === 'user' || m.role === 'ai'),
        }),
      });
      const data = await res.json();
      if (data.answer) {
        setChatHistory([...newHistory, { role: 'ai' as 'ai', content: data.answer }]);
      } else {
        setChatError('AI did not return an answer.');
      }
    } catch {
      setChatError('Failed to get AI response.');
    }
    setChatLoading(false);
  };

  // Summary metrics
  const totalFiles = analytics ? analytics.length : 0;
  const avgComplexity =
    analytics && analytics.length
      ? (
          analytics.reduce((sum: number, a: any) => sum + (a.aggregate?.cyclomatic || 0), 0) /
          analytics.length
        ).toFixed(2)
      : 0;
  interface FunctionMetric {
    name: string;
    cyclomatic: number;
    [key: string]: any;
  }

  interface AggregateMetric {
    cyclomatic?: number;
    [key: string]: any;
  }

  interface FileAnalytics {
    path: string;
    functions?: FunctionMetric[];
    aggregate?: AggregateMetric;
    [key: string]: any;
  }

  const totalFunctions = analytics
    ? (analytics as FileAnalytics[]).reduce((sum, a) => sum + (a.functions?.length || 0), 0)
    : 0;
  // Enhanced: sort by complexity, highlight top files
  const topComplexFiles = analytics
    ? [...analytics]
        .sort((a, b) => (b.aggregate?.cyclomatic || 0) - (a.aggregate?.cyclomatic || 0))
        .slice(0, 3)
    : [];

  return (
    <>
      <div className="mx-auto my-8 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
          <FaChartBar className="text-blue-600" /> Code Analytics
        </h2>
        <Button onClick={() => setShowModal(true)} className="mb-2 bg-blue-600 text-white">
          Show Analytics
        </Button>
        {loading && <p>Loading analytics...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !analytics && <p>No analytics available.</p>}
      </div>
      {showModal && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/40">
          <div
            className="relative mx-1 max-h-[98vh] w-full max-w-full overflow-y-auto overflow-x-hidden rounded-xl bg-white p-2 shadow-xl dark:bg-gray-900 sm:mx-0 sm:max-w-4xl sm:p-6 md:rounded-xl"
            style={{ width: '98vw' }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-2 top-2 text-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              &times;
            </button>
            <h3 className="mb-4 flex items-center gap-2 text-center text-lg font-bold">
              <FaChartBar className="text-blue-600" /> Code Analytics Visualization
            </h3>
            <div className="mb-4 flex w-full flex-wrap justify-center gap-2 overflow-x-auto sm:gap-4">
              <button
                onClick={() => setActiveTab('charts')}
                className={`flex min-w-[90px] items-center gap-2 rounded px-2 py-2 text-xs sm:px-4 sm:text-base ${activeTab === 'charts' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
              >
                <FaChartBar /> Charts
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex min-w-[90px] items-center gap-2 rounded px-2 py-2 text-xs sm:px-4 sm:text-base ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
              >
                <FaListAlt /> Summary
              </button>
              <button
                onClick={handleShowAI}
                className={`flex min-w-[90px] items-center gap-2 rounded px-2 py-2 text-xs sm:px-4 sm:text-base ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
              >
                <FaRobot /> AI Explanation
              </button>
            </div>
            {activeTab === 'charts' && (
              <div className="grid w-full grid-cols-1 gap-3 overflow-x-hidden sm:gap-6 md:grid-cols-2">
                <div className="flex w-full max-w-full items-center justify-center">
                  <BarChart analytics={analytics} />
                </div>
                <div className="flex w-full max-w-full items-center justify-center">
                  <PieChart analytics={analytics} />
                </div>
                <div className="flex w-full max-w-full items-center justify-center">
                  <FunctionBarChart analytics={analytics} />
                </div>
                <div className="flex w-full max-w-full items-center justify-center">
                  <QualityBarChart quality={quality} />
                </div>
                <div className="col-span-1 mt-4 sm:mt-6 md:col-span-2">
                  <h4 className="mb-2 font-semibold">Top Complex Files</h4>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topComplexFiles.map((f) => (
                      <li key={f.path} className="flex items-center justify-between py-2">
                        <span className="break-all font-mono text-sm">{f.path}</span>
                        <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-200">
                          Cyclomatic: {f.aggregate?.cyclomatic}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                <div className="rounded-lg bg-blue-100 p-4 dark:bg-blue-900">
                  <div className="text-3xl font-bold">{totalFiles}</div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">Files Analyzed</div>
                </div>
                <div className="rounded-lg bg-green-100 p-4 dark:bg-green-900">
                  <div className="text-3xl font-bold">{avgComplexity}</div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Avg. Cyclomatic Complexity
                  </div>
                </div>
                <div className="rounded-lg bg-yellow-100 p-4 dark:bg-yellow-900">
                  <div className="text-3xl font-bold">{totalFunctions}</div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    Total Functions
                  </div>
                </div>
              </div>
            )}
            {/* Quality Analysis */}
            {activeTab === 'summary' && (
              <div className="mt-6">
                <h4 className="mb-2 font-semibold">Quality Analysis</h4>
                {qualityLoading && <p>Loading quality analysis...</p>}
                {qualityError && <p className="text-red-600">{qualityError}</p>}
                {quality.length === 0 && !qualityLoading && (
                  <p className="text-green-600">No major issues found.</p>
                )}
                {quality.length > 0 && (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {quality.map((q) => (
                      <li
                        key={q.path}
                        className="flex flex-col py-2 md:flex-row md:items-center md:justify-between"
                      >
                        <span className="font-mono text-xs md:text-sm">{q.path}</span>
                        <span className="mt-1 text-xs text-red-600 dark:text-red-300 md:mt-0">
                          {q.issues.join(', ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="mt-4 min-h-[120px]">
                <div
                  className="mb-2 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 transition-colors duration-200 dark:border-gray-700 dark:bg-[#18181b] sm:p-4"
                  style={{ minHeight: 180 }}
                >
                  {chatHistory.length === 0 && (
                    <p className="text-gray-400">Ask anything about your codebase analytics!</p>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90vw] break-words rounded-lg px-2 py-2 text-sm sm:max-w-[80%] sm:px-3 sm:py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-gray-50 text-gray-900 transition-colors duration-200 dark:border-gray-700 dark:bg-[#23272e] dark:text-gray-100'}`}
                      >
                        <MDEditor.Markdown
                          source={msg.content}
                          className="prose dark:prose-invert max-w-none"
                        />
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="text-xs text-gray-400">AI is typing...</div>}
                  {chatError && <div className="text-xs text-red-500">{chatError}</div>}
                </div>
                <form
                  className="flex w-full flex-col gap-2 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                >
                  <input
                    type="text"
                    className="w-full flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:outline-none dark:border-gray-700 dark:bg-[#18181b]"
                    placeholder={
                      analytics
                        ? 'Ask a question about your codebase...'
                        : 'No analytics available. Please connect your repo.'
                    }
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading || !analytics}
                    maxLength={500}
                    autoComplete="off"
                    style={{ overflow: 'auto' }}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 px-4 text-white sm:w-auto"
                    disabled={chatLoading || !chatInput.trim() || !analytics}
                  >
                    Send
                  </Button>
                </form>
                <div className="mt-1 text-xs text-gray-400">
                  AI answers are powered by Gemini and your code analytics.
                </div>
              </div>
            )}
            <div className="mt-6">
              <h4 className="mb-2 font-semibold">Raw Metrics</h4>
              <div className="mb-2 flex items-center gap-2">
                <Button
                  onClick={() => {
                    handleCopy();
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                  className="bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  onClick={() => {
                    if (analytics) {
                      const blob = new Blob([JSON.stringify(analytics, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'code-analytics.json';
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }, 0);
                    }
                  }}
                  className="bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600"
                >
                  Download JSON
                </Button>
                <span className="text-xs text-gray-400">Copy all metrics as JSON</span>
              </div>
              <pre
                ref={rawRef}
                className="max-h-64 overflow-x-auto rounded bg-gray-100 p-4 text-xs dark:bg-gray-800"
              >
                {JSON.stringify(analytics, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const BarChart = dynamic(() => import('./charts/BarChart'), { ssr: false });
const PieChart = dynamic(() => import('./charts/PieChart'), { ssr: false });
const FunctionBarChart = dynamic(() => import('./charts/FunctionBarChart'), { ssr: false });
const QualityBarChart = dynamic(() => import('./charts/QualityBarChart'), { ssr: false });

export default CodeAnalytics;
