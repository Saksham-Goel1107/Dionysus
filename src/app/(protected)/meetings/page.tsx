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
import { Input } from '@/components/ui/input';
import useProject from '@/hooks/use-project';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { Loader2, Lock, Search, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import MeetingCard from '../dashboard/_components/MeetingCard';
import RefreshButton from './_components/RefreshButton';
import TranscriptViewer from './_components/TranscriptViewer';

const MeetingsPage = () => {
  const { projectId } = useProject();
  const { data: projectsData, isLoading: isProjectsLoading } = api.project.getProjects.useQuery();
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
  const [searchQuery, setSearchQuery] = useState('');

  // Sort meetings by newest first and filter by search query
  const sortedAndFilteredMeetings = useMemo(() => {
    if (!meetings) return [];

    const filtered = meetings.filter((meeting) =>
      meeting.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [meetings, searchQuery]);

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

  if (loading || isProjectsLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-300" />
        <p className="text-lg text-gray-500 dark:text-gray-300">
          {isProjectsLoading ? 'Loading projects...' : 'Checking your plan...'}
        </p>
      </div>
    );
  }

  // Check if user has any projects
  const hasProjects = projectsData && Array.isArray(projectsData) && projectsData.length > 0;

  if (!hasProjects) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <svg
            className="h-8 w-8 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2
          className={`text-2xl font-bold ${
            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}
        >
          No Projects Found
        </h2>
        <p
          className={`${
            resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-600'
          } max-w-md text-sm sm:text-base`}
        >
          You need to create a project first before accessing meetings. <br />
          Projects help organize your repositories and meetings.
        </p>
        <Link href="/create">
          <Button size="lg" className="mt-2">
            Create Your First Project
          </Button>
        </Link>
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
          <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
            <h1 className="text-xl font-semibold">Meetings</h1>
            {meetings && meetings.length > 0 && (
              <div className="flex items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search meetings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {!meetings ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-300" />
              <p className="text-lg text-gray-500 dark:text-gray-300">Loading meetings...</p>
            </div>
          ) : sortedAndFilteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-lg text-gray-500 dark:text-gray-300 sm:py-24">
              <span className="mb-4 text-4xl sm:text-5xl">💤</span>
              <h2 className="mb-4 text-xl font-bold sm:text-2xl lg:text-3xl">
                {searchQuery ? 'No meetings found' : 'No Meetings Analysed Yet'}
              </h2>
              <p className="mb-6 max-w-xs text-sm sm:max-w-md sm:text-base lg:max-w-xl lg:text-lg">
                {searchQuery ? (
                  <>
                    No meetings match your search for &quot;{searchQuery}&quot;.
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    Try a different search term or clear the search.
                  </>
                ) : (
                  <>
                    You haven&apos;t analysed any meetings for this project yet.
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    Once you do, they will appear here for easy access and review.
                  </>
                )}
              </p>
              {!searchQuery && (
                <span className="text-xs text-gray-400 sm:text-sm">
                  Start by uploading or recording a meeting to see it here.
                </span>
              )}
            </div>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-gray-200 px-4 sm:px-0">
                {sortedAndFilteredMeetings.map((meeting) => (
                  <li
                    key={meeting.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-5"
                  >
                    <div className="min-w-0 flex-1 space-y-2 sm:space-y-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        {meeting.status === 'COMPLETED' ? (
                          <Link
                            href={`/meetings/${meeting.id}`}
                            className="break-words text-sm font-semibold leading-tight hover:underline sm:break-all"
                          >
                            {meeting.name}
                          </Link>
                        ) : (
                          <span className="break-words text-sm font-semibold leading-tight sm:break-all">
                            {meeting.name}
                          </span>
                        )}
                        {meeting.status === 'PROCESSING' && (
                          <Badge className="w-fit bg-yellow-500 px-2 py-1 text-xs text-white sm:mt-0">
                            Processing...
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 sm:gap-x-4">
                        <p className="whitespace-nowrap">
                          {meeting.createdAt.toLocaleDateString()}
                        </p>
                        {/* Show creation time only on larger screens for responsiveness */}
                        <p className="hidden whitespace-nowrap md:block">
                          {meeting.createdAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                        <p className="whitespace-nowrap">
                          {meeting.issues.length} {meeting.issues.length === 1 ? 'issue' : 'issues'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2 lg:flex-nowrap">
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

                      {meeting.status === 'FAILED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 sm:w-auto"
                          disabled
                        >
                          Failed to Process
                        </Button>
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
                          {deleteMeeting.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Delete'
                          )}
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
