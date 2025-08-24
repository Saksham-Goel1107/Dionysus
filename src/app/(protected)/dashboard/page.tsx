'use client';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import { ExternalLink, Github, MessageCirclePlus } from 'lucide-react';
import Link from 'next/link';
import ArchiveButton from './_components/ArchiveButton';
import AskQuestionCard from './_components/AskQuestionCard';
import CommitTabs from './_components/CommitTabs';
import MeetingCard from './_components/MeetingCard';
const InviteButton = dynamic(() => import('./_components/InviteButton'), { ssr: false });

import { Button } from '@/components/ui/button';
import { useFeatureFlag } from 'configcat-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';
import RepoMetricsCard from './_components/RepoMetricsCard';
import TeamMembers from './_components/TeamMembers';

type Props = {};

const Page = ({}: Props) => {
  const { project, projects, projectId } = useProject();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLeavingLoading, setisLeavingLoading] = useState(false);
  const utils = api.useContext();

  const { value: maintenanceScheduled } = useFeatureFlag('maintenancescheduled', false);
  const { value: maintenanceDate } = useFeatureFlag('maintenancedate', '');
  const { value: maintenanceTime } = useFeatureFlag('maintenancetime', '');

  const { data: isCreator } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const leaveMutation = api.project.leaveProject.useMutation({
    onSuccess: async () => {
      setShowConfirm(false);
      setisLeavingLoading(false);
      await utils.project.invalidate();
      toast.success('You have left the project.');
    },
    onError: (error) => {
      setShowConfirm(false);
      setisLeavingLoading(false);
      toast.error(error?.message || 'Failed to leave project.');
    },
  });

  const handleLeaveProject = () => {
    setShowConfirm(true);
  };

  const confirmLeaveProject = async () => {
    if (!projectId) {
      setisLeavingLoading(false);
      return;
    }
    setisLeavingLoading(true);
    leaveMutation.mutate({ projectId });
  };

  const cancelLeaveProject = () => {
    setShowConfirm(false);
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="mb-4 text-xl font-semibold">No Projects Found</h2>
        <p className="mb-4">You don&apos;t have any projects yet.</p>
        <Link
          href="/create"
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Create a Project
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="mb-4 text-xl font-semibold">Select a Project</h2>
        <p className="mb-4">Please select a project to continue.</p>
      </div>
    );
  }

  return (
    <div>
      {maintenanceScheduled && maintenanceDate && maintenanceTime && (
        <div
          className="mb-4 flex items-center rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100"
          role="alert"
        >
          <span className="mr-2">⚠️</span>
          Scheduled maintenance on{' '}
          <span className="mx-1 font-semibold">
            {maintenanceTime} on {maintenanceDate}
          </span>
          . You shall be unable to access the site at that time.
        </div>
      )}

      {/* Repo Metrics Card - now between header and dashboard */}
      {project.githubUrl && <RepoMetricsCard githubUrl={project.githubUrl} />}

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-y-4">
          {/* GITHUB LINK */}
          <div className="w-fit rounded-md bg-primary px-4 py-3">
            <div className="flex items-center">
              <Github className="size-5 text-white" />
              <div className="ml-2">
                <p className="text-sm font-medium text-white">
                  This project is linked to{' '}
                  <Link
                    href={project.githubUrl ?? ''}
                    className="inline-flex items-center text-white/80 hover:underline"
                    target="_blank"
                  >
                    {project.githubUrl}
                    <ExternalLink className="ml-1 size-4" />
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="h-4"></div>

          {/* TEAM MEMBERS, INVITE, ARCHIVE */}
          <div className="flex items-center gap-2">
            <TeamMembers />
            <Link href="/chatting">
              <Button className="px-2 py-1">
                <MessageCirclePlus />
              </Button>
            </Link>
            <InviteButton />
            <ArchiveButton />
            {!isCreator && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLeaveProject}
                  className="font-bold"
                >
                  Leave Project
                </Button>
                {showConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Leave Project?
                      </h3>
                      <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
                        Are you sure you want to leave this project? You will lose access to all its
                        resources.
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={cancelLeaveProject}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={confirmLeaveProject}
                          disabled={isLeavingLoading}
                        >
                          {isLeavingLoading ? 'Leaving...' : 'Yes, Leave'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <AskQuestionCard />
            <MeetingCard />
          </div>
        </div>

        <div className="mt-8"></div>

        <CommitTabs />
      </div>
    </div>
  );
};

export default Page;
