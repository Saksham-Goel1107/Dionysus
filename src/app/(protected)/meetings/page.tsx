"use client";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";
import MeetingCard from "../dashboard/_components/MeetingCard";
import TranscriptViewer from "./_components/TranscriptViewer";
import { Protect } from "@clerk/nextjs";
import { Lock } from "lucide-react";
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
  const {resolvedTheme} = useTheme();
  return (
    <>
    <Protect
      plan="dionysus_pro_pack"
      fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100">
          <Lock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className={`text-2xl font-bold text-center ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Pro Plan Required
        </h2>
        <p className={`text-center ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-600'} max-w-md`}>
          Access to meetings is available exclusively for <span className="font-semibold text-yellow-700">Dionysus Pro Pack</span> subscribers.
          <br />
          Upgrade your plan to unlock this feature.
        </p>
        <Link href="/subscriptions">
          <Button size="lg" className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white">
        Upgrade Now
          </Button>
        </Link>
      </div>}
    >
      <MeetingCard></MeetingCard>
      <div className="h-6"></div>
      <h1 className="text-xl font-semibold">Meetings</h1>
      <ul className="divide-y divide-gray-200">
        {meetings?.map((meeting) => (
          <li
            key={meeting.id}
            className="flex items-center justify-between gap-x-6 py-5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/meetings/${meeting.id}`}
                  className="text-sm font-semibold"
                >
                  {meeting.name}
                </Link>
                {meeting.status === "PROCESSING" && (
                  <Badge className="bg-yellow-500 text-white">
                    Processing...
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-x-2 text-xs text-gray-500">
                <p className="whitespace-nowrap">
                  {meeting.createdAt.toLocaleDateString()}
                </p>
                <p className="truncate">{meeting.issues.length} issues</p>
              </div>
            </div>

            <div className="flex flex-none items-center gap-x-4">
              <Link href={`/meetings/${meeting.id}`}>
                <Button size="sm" variant="outline">
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
              >
                Delete Meeting
              </Button>
            </div>
          </li>
        ))}
      </ul>
      </Protect>
    </>
  );
};

export default MeetingsPage;
