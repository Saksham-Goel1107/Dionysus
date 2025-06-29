"use client";
import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

interface MediaRoomProps {
  projectId: string;
  video: boolean;
  audio: boolean;
}

export const MediaRoom = ({ projectId, video, audio }: MediaRoomProps) => {
  const { user } = useUser();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !projectId) return;
    setLoading(true);
    const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.id;
    fetch('/api/livekit-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName, projectId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.token) {
          setToken(data.token);
        } else {
          setToken('');
        }
        setLoading(false);
      })
      .catch(() => {
        setToken('');
        setLoading(false);
      });
  }, [user?.id, user?.fullName, user?.firstName, user?.lastName, user?.username, projectId]);

  if (loading || token === '') {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={video}
      audio={audio}
    >
      <VideoConference />
    </LiveKitRoom>
  );
};
