'use client';
import React, { useEffect, useState, use } from 'react';
import IssueList from './_components/IssueList';
import TranscriptViewer from '../_components/TranscriptViewer';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Props = {
  params: Promise<{ meetingId: string }>;
};

const MeetingDetailsPage = ({ params }: Props) => {
  const paramsObj = use(params);
  const [meetingId, setMeetingId] = useState<string | null>(null);

  useEffect(() => {
    setMeetingId(paramsObj.meetingId);
  }, [paramsObj.meetingId]);
  const [hasProPlan, sethasProPlan] = useState(false);
  const [loading, setLoading] = useState(true);

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
            Pro Plan Required
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 max-w-md">
            Access to meetings is available exclusively for{' '}
            <span className="font-semibold text-yellow-700 dark:text-yellow-300">
              Dionysus Pro Pack
            </span>{' '}
            subscribers.
            <br />
            Upgrade your plan to unlock this feature.
          </p>
          <Link href="/subscriptions">
            <Button
              size="lg"
              className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-700 dark:hover:bg-yellow-800"
            >
              Upgrade Now
            </Button>
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Meeting Summary</h1>
            <TranscriptViewer meetingId={meetingId ?? ''} />
          </div>
          <IssueList meetingId={meetingId ?? ''} />
        </div>
      )}
    </>
  );
};

export default MeetingDetailsPage;
