'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useProject from '@/hooks/use-project';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { Loader2, Lock } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import MeetingCard from '../dashboard/_components/MeetingCard';
import RefreshButton from './_components/RefreshButton';
import TranscriptViewer from './_components/TranscriptViewer';

const MeetingsPage = () => {
  const { projectId } = useProject();
  const { data: meetings } = api.project.getMeetings.useQuery(
    { projectId },
    {
      refetchInterval: 4000,
      enabled: !!projectId,
    },
  );
  const { data: isCreator } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );
  const deleteMeeting = api.project.deleteMeeting.useMutation();
  const refetch = useRefetch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [hasProPlan, sethasProPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/pro-status');
        if (!res.ok) throw new Error('Failed to fetch pro status');
        const data = await res.json();
        sethasProPlan(data.pro);
      } catch {
        sethasProPlan(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Show loading state while checking plan or if no projectId yet
  if (loading || !projectId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-300" />
        <p className="text-lg text-gray-500 dark:text-gray-300">
          {!projectId ? 'Loading project...' : 'Checking your plan...'}
        </p>
      </div>
    );
  }

  return (
    <>
      {!hasProPlan ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2
            className={`text-2xl font-bold ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}
          >
            Pro Plan Required
          </h2>
          <p
            className={`${
              resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-600'
            } max-w-md text-sm sm:text-base`}
          >
            Access to meetings is available exclusively for{' '}
            <span className="font-semibold text-yellow-700">Dionysus Pro Pack</span> subscribers.{' '}
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
        <>
          <MeetingCard />
          <div className="h-6" />
          <div className="flex items-center justify-between px-4 sm:px-0">
            <h1 className="text-xl font-semibold">Meetings</h1>
          </div>

          {!meetings ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-300" />
              <p className="text-lg text-gray-500 dark:text-gray-300">Loading meetings...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-lg text-gray-500 dark:text-gray-300">
              <span className="mb-4 text-5xl">💤</span>
              <h2 className="mb-4 text-3xl font-bold">No Meetings Analysed Yet</h2>
              <p className="mb-6 max-w-xl text-base sm:text-lg">
                You haven&apos;t analysed any meetings for this project yet.
                <br />
                Once you do, they will appear here for easy access and review.
              </p>
              <span className="text-sm text-gray-400">
                Start by uploading or recording a meeting to see it here.
              </span>
            </div>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-gray-200 px-4 sm:px-0">
                {meetings.map((meeting) => (
                  <li
                    key={meeting.id}
                    className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        {meeting.status === 'COMPLETED' ? (
                          <Link
                            href={`/meetings/${meeting.id}`}
                            className="break-all text-sm font-semibold"
                          >
                            {meeting.name}
                          </Link>
                        ) : (
                          <span className="break-all text-sm font-semibold">{meeting.name}</span>
                        )}
                        {meeting.status === 'PROCESSING' && (
                          <Badge className="mt-1 w-fit bg-yellow-500 text-white sm:mt-0">
                            Processing...
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-gray-500">
                        <p className="whitespace-nowrap">
                          {meeting.createdAt.toLocaleDateString()}
                        </p>
                        <p className="truncate">{meeting.issues.length} issues</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
                      <RefreshButton
                        meetingId={meeting.id}
                        status={meeting.status}
                        size="sm"
                        showText={false}
                      />

                      {meeting.status === 'COMPLETED' && (
                        <>
                          <Link href={`/meetings/${meeting.id}`}>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto">
                              View Meeting
                            </Button>
                          </Link>

                          <TranscriptViewer meetingId={meeting.id} />
                        </>
                      )}

                      {/* Only show delete button to project creator */}
                      {isCreator && (
                        <Button
                          size="sm"
                          disabled={deleteMeeting.isPending}
                          variant="destructive"
                          onClick={() => {
                            setMeetingToDelete(meeting.id);
                            setDialogOpen(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Confirmation Dialog for Meeting Deletion */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Meeting</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this meeting? This action cannot be undone.
                      All meeting data, including transcripts and issues, will be permanently
                      removed.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleteMeeting.isPending}
                      onClick={() => {
                        if (meetingToDelete) {
                          deleteMeeting.mutate(
                            { meetingId: meetingToDelete },
                            {
                              onSuccess: () => {
                                toast.success('Meeting deleted successfully');
                                refetch();
                                setDialogOpen(false);
                                setMeetingToDelete(null);
                              },
                              onError: (error) => {
                                toast.error(error.message || 'Failed to delete meeting');
                                setDialogOpen(false);
                              },
                            },
                          );
                        }
                      }}
                    >
                      {deleteMeeting.isPending ? 'Deleting...' : 'Delete Meeting'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}
    </>
  );
};

export default MeetingsPage;
