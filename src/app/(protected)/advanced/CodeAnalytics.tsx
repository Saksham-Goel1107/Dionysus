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
  const [lastCommit, setLastCommit] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'charts' | 'summary' | 'ai'>('charts');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
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
        setLastCommit(data.commit);
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
      } catch (e) {
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
      setAiLoading(true);
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
      setAiLoading(false);
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
      <div className="w-full max-w-2xl mx-auto my-8 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaChartBar className="text-blue-600" /> Code Analytics
        </h2>
        <Button onClick={() => setShowModal(true)} className="bg-blue-600 text-white mb-2">
          Show Analytics
        </Button>
        {loading && <p>Loading analytics...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !analytics && <p>No analytics available.</p>}
      </div>
      {showModal && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-auto">
          <div
            className="bg-white dark:bg-gray-900 rounded-xl md:rounded-xl shadow-xl p-2 sm:p-6 w-full max-w-full sm:max-w-4xl relative max-h-[98vh] overflow-y-auto overflow-x-hidden mx-1 sm:mx-0"
            style={{ width: '98vw' }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl"
            >
              &times;
            </button>
            <h3 className="font-bold text-lg mb-4 text-center flex items-center gap-2">
              <FaChartBar className="text-blue-600" /> Code Analytics Visualization
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 justify-center w-full overflow-x-auto">
              <button
                onClick={() => setActiveTab('charts')}
                className={`px-2 sm:px-4 py-2 rounded flex items-center gap-2 text-xs sm:text-base min-w-[90px] ${activeTab === 'charts' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              >
                <FaChartBar /> Charts
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-2 sm:px-4 py-2 rounded flex items-center gap-2 text-xs sm:text-base min-w-[90px] ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              >
                <FaListAlt /> Summary
              </button>
              <button
                onClick={handleShowAI}
                className={`px-2 sm:px-4 py-2 rounded flex items-center gap-2 text-xs sm:text-base min-w-[90px] ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              >
                <FaRobot /> AI Explanation
              </button>
            </div>
            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 w-full overflow-x-hidden">
                <div className="w-full max-w-full flex justify-center items-center">
                  <BarChart analytics={analytics} />
                </div>
                <div className="w-full max-w-full flex justify-center items-center">
                  <PieChart analytics={analytics} />
                </div>
                <div className="w-full max-w-full flex justify-center items-center">
                  <FunctionBarChart analytics={analytics} />
                </div>
                <div className="w-full max-w-full flex justify-center items-center">
                  <QualityBarChart quality={quality} />
                </div>
                <div className="col-span-1 md:col-span-2 mt-4 sm:mt-6">
                  <h4 className="font-semibold mb-2">Top Complex Files</h4>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topComplexFiles.map((f, i) => (
                      <li key={f.path} className="py-2 flex justify-between items-center">
                        <span className="font-mono text-sm break-all">{f.path}</span>
                        <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-2 py-1 rounded text-xs font-bold">
                          Cyclomatic: {f.aggregate?.cyclomatic}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
                  <div className="text-3xl font-bold">{totalFiles}</div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">Files Analyzed</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4">
                  <div className="text-3xl font-bold">{avgComplexity}</div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Avg. Cyclomatic Complexity
                  </div>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4">
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
                <h4 className="font-semibold mb-2">Quality Analysis</h4>
                {qualityLoading && <p>Loading quality analysis...</p>}
                {qualityError && <p className="text-red-600">{qualityError}</p>}
                {quality.length === 0 && !qualityLoading && (
                  <p className="text-green-600">No major issues found.</p>
                )}
                {quality.length > 0 && (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {quality.map((q, i) => (
                      <li
                        key={q.path}
                        className="py-2 flex flex-col md:flex-row md:justify-between md:items-center"
                      >
                        <span className="font-mono text-xs md:text-sm">{q.path}</span>
                        <span className="text-xs text-red-600 dark:text-red-300 mt-1 md:mt-0">
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
                  className="border rounded-lg p-2 sm:p-4 max-h-80 overflow-y-auto mb-2 bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-700 transition-colors duration-200 w-full"
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
                        className={`rounded-lg px-2 py-2 sm:px-3 sm:py-2 max-w-[90vw] sm:max-w-[80%] text-sm break-words ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-[#23272e] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 transition-colors duration-200'}`}
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
                  className="flex flex-col sm:flex-row gap-2 w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                >
                  <input
                    type="text"
                    className="flex-1 rounded border px-3 py-2 text-sm bg-white dark:bg-[#18181b] border-gray-300 dark:border-gray-700 focus:outline-none transition-colors duration-200 w-full"
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
                    className="bg-blue-600 text-white px-4 w-full sm:w-auto"
                    disabled={chatLoading || !chatInput.trim() || !analytics}
                  >
                    Send
                  </Button>
                </form>
                <div className="text-xs text-gray-400 mt-1">
                  AI answers are powered by Gemini and your code analytics.
                </div>
              </div>
            )}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Raw Metrics</h4>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  onClick={() => {
                    handleCopy();
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
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
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs"
                >
                  Download JSON
                </Button>
                <span className="text-xs text-gray-400">Copy all metrics as JSON</span>
              </div>
              <pre
                ref={rawRef}
                className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-xs overflow-x-auto max-h-64"
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
