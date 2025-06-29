"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';

export default function ChatPage() {
  const { project, projectId } = useProject();
  const { data: members } = api.project.getTeamMembers.useQuery({ projectId });
  const router = useRouter();

  const users = members || [];

  useEffect(() => {
    if (!project || users.length < 2) {
      router.replace('/dashboard');
    }
  }, [project, users.length, router]);

  if (!project || users.length < 2) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Project Chat</h1>
      <div className="text-gray-500">Chat functionality coming soon.</div>
    </div>
  );
}
