import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';

export function useProjectTeamGuard(projectId?: string) {
  const router = useRouter();
  const { data: members, isLoading } = api.project.getTeamMembers.useQuery(
    projectId ? { projectId } : { projectId: '' },
    { enabled: !!projectId }
  );

  useEffect(() => {
    if (!isLoading && members && members.length <= 1) {
      router.replace('/dashboard');
    }
  }, [isLoading, members, router]);

  return { members, isLoading };
}
