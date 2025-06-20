"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpLeftFromSquare, Presentation, Upload } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { uploadFile } from "@/lib/cloudinary";
import { api } from "@/trpc/react";
import useProject from "@/hooks/use-project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useTheme } from "next-themes";

const MeetingCard = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const router = useRouter();
  const uploadMeeting = api.project.uploadMeeting.useMutation();
  const { project } = useProject();

  // MEETING AUDIO PROCESSING FUCNTION USING ASSEMBLY-AI
  const processMeeting = useMutation({
    mutationFn: async (data: {
      meetingUrl: string;
      meetingId: string;
      projectId: string;
    }) => {
      const { meetingUrl, meetingId, projectId } = data;
      // hitting the /api/process-meeting endpoint to process the meeting
      const response = await axios.post("/api/process-meeting", {
        meetingUrl,
        meetingId,
        projectId,
      });
      return response.data;
    },
  });

  // using react drop zone for audio upload and 
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    multiple: false,
    maxSize: 50_000_000,
    onDrop: async (acceptedFiles) => {
      if (!project) return;

      setIsUploading(true);
      console.log(acceptedFiles);

      const file = acceptedFiles[0];
      if (!file) return;

      // after getting file, now upload it to cloudinary
      const downloadURL = (await uploadFile(
        file as File,
        setProgress,
      )) as string;
      uploadMeeting.mutate(
        {
          projectId: project.id,
          meetingUrl: downloadURL,
          name: file.name,
        },
        {
          onSuccess: (meeting) => {
            toast.success("Meeting uploaded successfully");
            router.push("/meetings");
            // after successfull-upload, now callng the processMeeting mutation 
            processMeeting.mutateAsync({
              meetingUrl: downloadURL,
              meetingId: meeting.id,
              projectId: project.id,
            });
          },
          onError: () => {
            toast.error("Failed to upload meeting");
          },
        },
      );

      setIsUploading(false);
    },
  });
  const {resolvedTheme} = useTheme()
  
  return (
    <Card
      className="col-span-2 flex flex-col items-center justify-center p-10"
      {...getRootProps()}
    >
      {!isUploading && (
        <>
          <Presentation className="h-10 w-10 animate-bounce"></Presentation>
          <h3 className={`mt-2 text-sm font-semibold text-${resolvedTheme === "dark" ? "white" : "gray-900"}`}>
            Create a new meeting
          </h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Analyse your meeting with Dionysus.
            <br />
            Powered by AI.
            <br />
            Please Provide an mp3 file.
          </p>
          <div className="mt-6">
            <Button disabled={isUploading}>
              <Upload className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Upload Meeting
              <input className="hidden" {...getInputProps()} />
            </Button>
          </div>
        </>
      )}

      {isUploading && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-24 flex items-center justify-center">
            <CircularProgressbar
              value={progress}
              text={""}
              className="size-24 transition-all"
              styles={buildStyles({
          pathColor: resolvedTheme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
          textColor: "transparent",
          trailColor: resolvedTheme === "dark" ? "hsl(var(--muted))" : "hsl(var(--muted))",
          rotation: 0.25,
          strokeLinecap: "round",
          pathTransitionDuration: 0.5,
          textSize: "16px",
              })}
            />
            <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
              {progress}%
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium">Uploading your meeting</p>
            <p className="text-xs text-muted-foreground">
              {progress === 100 ? "Processing..." : "Please wait while we upload your file"}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
