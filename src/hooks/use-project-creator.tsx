'use client';

import { api } from '@/trpc/react';
import useProject from './use-project';

export function useProjectCreator() {
  const { projectId } = useProject();

  const { data: isCreator, isLoading } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  return {
    isCreator: isCreator || false,
    isLoading,
  };
}

export default useProjectCreator;
