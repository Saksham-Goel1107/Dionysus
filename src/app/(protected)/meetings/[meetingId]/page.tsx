import React from "react";
import IssueList from "./_components/IssueList";
import TranscriptViewer from "../_components/TranscriptViewer";
import { Protect } from "@clerk/nextjs";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ meetingId: string }>;
};
const MeetingDetailsPage = async ({ params }: Props) => {
  const { meetingId } = await params;
  return (
    <>
    <Protect
      plan="dionysus_pro_pack"
      fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900">
        <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
        Pro Plan Required
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 max-w-md">
        Access to meetings is available exclusively for <span className="font-semibold text-yellow-700 dark:text-yellow-300">Dionysus Pro Pack</span> subscribers.
        <br />
        Upgrade your plan to unlock this feature.
        </p>
        <Link href="/subscriptions">
        <Button size="lg" className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-700 dark:hover:bg-yellow-800">
          Upgrade Now
        </Button>
        </Link>
      </div>
      }
    >
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meeting Summary</h1>
        <TranscriptViewer meetingId={meetingId} />
      </div>
      <IssueList meetingId={meetingId} />
    </div>
    </Protect>
    </>
  );
};

export default MeetingDetailsPage;
