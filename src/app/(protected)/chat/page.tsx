"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

import useProject from '@/hooks/use-project';

export default function ChatPage() {
  const { project, projectId } = useProject();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const [token, setToken] = useState<string | undefined>(undefined);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoaded) return; // Wait for Clerk user to load
    if (!project || !projectId || !user?.id) {
      setLoading(false);
      setError('Please make sure you are signed in with Clerk and a project is selected.');
      return;
    }
    setError(null);
    fetch("/api/livekit-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, projectId }),
    })
      .then(async (res) => {
        const data = await res.json();
        // Debug: log the token and roomName
        console.log('LiveKit token API response:', data);
        if (!res.ok || !data.token || !data.roomName) {
          setError(data.error || 'No token returned from server.');
          setLoading(false);
          return;
        }
        setToken(data.token as string | undefined);
        setRoomName(data.roomName);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError('Could not join video chat. Please check your permissions and try again.');
        console.error('LiveKit token fetch error:', err);
      });
  }, [project, projectId, user, userLoaded]);

  // Handle LiveKit connection errors (UI feedback)
  function handleRoomError(e: any) {
    setError('Could not connect to meeting. Please check your network, permissions, or try again later.');
    console.error('LiveKit room error:', e);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <div className="text-lg text-gray-700 font-medium">Connecting to project chat&hellip;</div>
          <div className="text-sm text-gray-400 mt-1">This may take a few seconds. Please wait.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl text-red-500 font-semibold mb-2">{error}</div>
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-8">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        data-lk-theme="default"
        style={{ height: "80vh", borderRadius: 16, overflow: "hidden", background: "#18181b" }}
        onError={handleRoomError}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 min-w-0 bg-zinc-900 rounded-lg shadow-lg flex flex-col justify-center items-center">
            <VideoConference />
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
}
