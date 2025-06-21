import React from "react";
import IssueList from "./_components/IssueList";
import TranscriptViewer from "../_components/TranscriptViewer";

type Props = {
  params: Promise<{ meetingId: string }>;
};
const MeetingDetailsPage = async ({ params }: Props) => {
  const { meetingId } = await params;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meeting Summary</h1>
        <TranscriptViewer meetingId={meetingId} />
      </div>
      <IssueList meetingId={meetingId} />
    </div>
  );
};

export default MeetingDetailsPage;
