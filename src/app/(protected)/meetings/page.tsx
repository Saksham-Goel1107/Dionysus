"use client";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";
import MeetingCard from "../dashboard/_components/MeetingCard";
import TranscriptViewer from "./_components/TranscriptViewer";
import { Loader2, Lock } from "lucide-react";
import { useTheme } from "next-themes";

const MeetingsPage = () => {
  const { projectId } = useProject();
  const { data: meetings } = api.project.getMeetings.useQuery(
    { projectId },
    {
      refetchInterval: 4000,
    },
  );
  const deleteMeeting = api.project.deleteMeeting.useMutation();
  const refetch = useRefetch();
  const { resolvedTheme } = useTheme();
  const [hasProPlan, sethasProPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/pro-status");
        if (!res.ok) throw new Error("Failed to fetch pro status");
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
        <p className="text-gray-500 dark:text-gray-300 text-lg">
          Checking your plan...
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
              resolvedTheme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Pro Plan Required
          </h2>
          <p
            className={`${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-600"
            } max-w-md text-sm sm:text-base`}
          >
            Access to meetings is available exclusively for{" "}
            <span className="font-semibold text-yellow-700">
              Dionysus Pro Pack
            </span>{" "}
            subscribers. <br />
            Upgrade your plan to unlock this feature.
          </p>
          <Link href="/subscriptions">
            <Button
              size="lg"
              className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <MeetingCard />
          <div className="h-6" />
          <h1 className="text-xl font-semibold px-4 sm:px-0">Meetings</h1>
          <ul className="divide-y divide-gray-200 mt-4 px-4 sm:px-0">
            {meetings?.map((meeting) => (
              <li
                key={meeting.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="text-sm font-semibold break-all"
                    >
                      {meeting.name}
                    </Link>
                    {meeting.status === "PROCESSING" && (
                      <Badge className="bg-yellow-500 text-white w-fit mt-1 sm:mt-0">
                        Processing...
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-2 text-xs text-gray-500 mt-1">
                    <p className="whitespace-nowrap">
                      {meeting.createdAt.toLocaleDateString()}
                    </p>
                    <p className="truncate">{meeting.issues.length} issues</p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end">
                  <Link href={`/meetings/${meeting.id}`}>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      View Meeting
                    </Button>
                  </Link>

                  {meeting.status === "COMPLETED" && (
                    <TranscriptViewer meetingId={meeting.id} />
                  )}

                  <Button
                    size="sm"
                    disabled={deleteMeeting.isPending}
                    variant="destructive"
                    onClick={() =>
                      deleteMeeting.mutate(
                        { meetingId: meeting.id },
                        {
                          onSuccess: () => {
                            toast.success("Meeting deleted successfully");
                            refetch();
                          },
                        },
                      )
                    }
                    className="w-full sm:w-auto"
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
};

export default MeetingsPage;
