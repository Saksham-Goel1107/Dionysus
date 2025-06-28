"use client";
import useProject from "@/hooks/use-project";
import { ExternalLink, Github} from "lucide-react";
import Link from "next/link";
import CommitTabs from "./_components/CommitTabs";
import AskQuestionCard from "./_components/AskQuestionCard";
import MeetingCard from "./_components/MeetingCard";
import ArchiveButton from "./_components/ArchiveButton";
const InviteButton=dynamic(()=>import('./_components/InviteButton'),{ssr:false});

import TeamMembers from "./_components/TeamMembers";
import dynamic from "next/dynamic";
import RepoMetricsCard from "./_components/RepoMetricsCard";

type Props = {};

const page = ({}: Props) => {
  const { project, projects } = useProject();

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-4">No Projects Found</h2>
        <p className="mb-4">You don't have any projects yet.</p>
        <Link 
          href="/create" 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Create a Project
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-4">Select a Project</h2>
        <p className="mb-4">Please select a project to continue.</p>
      </div>
    );
  }

  const maintenanceScheduled = process.env.NEXT_PUBLIC_MAINTAINENCE_SCHEDULED
  const maintenanceDate = process.env.NEXT_PUBLIC_MAINTAINENCE_DATE
  const maintenanceTime = process.env.NEXT_PUBLIC_MAINTAINENCE_TIME

  return (
    <div>
      {maintenanceScheduled === "true" && maintenanceDate && maintenanceTime && (
        <div
          className="mb-4 rounded-md px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100 flex items-center"
          role="alert"
        >
          <span className="mr-2">⚠️</span>
          Scheduled maintenance on{" "}
          <span className="mx-1 font-semibold">
            {maintenanceTime}
          </span>
          . You shall be unable to access the site at that time.
        </div>
      )}

      {/* Repo Metrics Card - now between header and dashboard */}
      <RepoMetricsCard githubUrl={project.githubUrl ?? ""} />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-y-4">
          {/* GITHUB LINK */}
          <div className="w-fit rounded-md bg-primary px-4 py-3">
            <div className="flex items-center">
              <Github className="size-5 text-white" />
              <div className="ml-2">
                <p className="text-sm font-medium text-white">
                  This project is linked to{" "}
                  <Link
                    href={project.githubUrl ?? ""}
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
          <div className="flex items-center gap-4">
              <TeamMembers />
              <InviteButton />
              <ArchiveButton /> 
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

export default page;
