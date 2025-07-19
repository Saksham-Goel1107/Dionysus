'use client';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import useProject from '@/hooks/use-project';

const GitGraphs = () => {
  const { resolvedTheme } = useTheme();
  const { project } = useProject();
  const [hasProPlan, sethasProPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  let owner = '';
  let repo = '';
  if (project?.githubUrl) {
    try {
      const url = new URL(project.githubUrl);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2) {
        owner = pathSegments[0] ?? '';
        repo = pathSegments[1] ?? '';
      }
    } catch (e) {
      console.error('Error extracting info from db', e);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/pro-status');
        if (!res.ok) throw new Error('Failed to fetch pro status');
        const data = await res.json();
        sethasProPlan(data.pro);
      } catch (error) {
        sethasProPlan(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 dark:text-gray-300" />
        <p className="text-gray-500 dark:text-gray-300 text-lg">Checking your plan...</p>
      </div>
    );
  }
  return (
    <>
      {!hasProPlan ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2
            className={`text-center text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}
          >
            Pro Plan Required
          </h2>
          <p
            className={`text-center ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-600'} max-w-md`}
          >
            Access to Git Graph is available exclusively for{' '}
            <span className="font-semibold text-yellow-700">Dionysus Pro Pack</span> subscribers.
            <br />
            Upgrade your plan to unlock this feature.
          </p>
          <Link href="/subscriptions">
            <Button size="lg" className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700">
              Upgrade Now
            </Button>
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex flex-col items-center justify-center space-y-6 py-10">
            <div className="flex flex-col items-center space-y-2">
              <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-4 shadow-lg">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 20v-6M12 4v2m0 0a8 8 0 1 1-8 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Download Your Git Architecture Diagram
              </h3>
              <p className="text-center text-lg text-gray-500 dark:text-gray-300 max-w-xl">
                Instantly visualize your repository’s structure with a beautiful, premium-quality
                diagram. Perfect for documentation, onboarding, and sharing insights with your team.
              </p>
            </div>
            <Button
              disabled={false}
              onClick={async () => {
                try {
                  const res = await fetch('/api/GitGraph', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ owner, repo }),
                  });

                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    
                    // Determine file extension from content type
                    const contentType = res.headers.get('content-type') || '';
                    let extension = 'png';
                    if (contentType.includes('svg')) {
                      extension = 'svg';
                    } else if (contentType.includes('html')) {
                      extension = 'html';
                    }
                    
                    a.download = `${repo}_diagram.${extension}`;
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } else {
                    const err = await res.json();
                    alert('Failed to generate diagram: ' + (err?.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Error generating diagram:', error);
                  alert('Failed to generate diagram: Network error');
                }
              }}
              className="relative mt-4 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold text-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 border-0"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-white animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Diagram
              </span>
            </Button>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Exclusive to <span className="font-bold text-yellow-500">Dionysus Pro Pack</span>{' '}
              users
            </span>
            <div className="flex justify-center pt-0 mt-0">
              <span className="text-orange-400 text-xs">
                📋 Note: Generates repository structure diagrams. For private repos, ensure proper access permissions are configured.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GitGraphs;
