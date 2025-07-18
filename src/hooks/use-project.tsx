import { api } from '@/trpc/react';
import { useLocalStorage } from 'usehooks-ts';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';

const useProject = () => {
  const { data: projectsRaw, isLoading } = api.project.getProjects.useQuery();
  const projects = React.useMemo(
    () => (Array.isArray(projectsRaw) ? projectsRaw : []),
    [projectsRaw],
  );
  const [projectId, setProjectId] = useLocalStorage('dionysus-projectId', '');
  const pathname = usePathname();
  const router = useRouter();

  const projectExists: boolean = projects.some((project) => project.id === projectId);

  useEffect(() => {
    if (!isLoading && projects && projectId && !projectExists) {
      if (projects.length > 0) {
        const newProjectId = projects[0]?.id || '';
        setProjectId(newProjectId);

        toast.warning('You no longer have access to that project. Switching to another project.');
        if (pathname && pathname !== '/dashboard' && pathname !== '/create') {
          router.push('/dashboard');
        }
      }
    }
  }, [projectId, projects, projectExists, setProjectId, isLoading, pathname, router]);

  const effectiveProjectId =
    (!projectId || !projectExists) && projects && projects.length > 0
      ? projects[0]?.id || ''
      : projectExists
        ? projectId
        : '';

  const project = projects?.find((project) => project.id === effectiveProjectId);

  useEffect(() => {
  if (!isLoading && projects && projectId && !projectExists) {
    if (projects.length > 0) {
      const newProjectId = projects[0]?.id || '';
      setProjectId(newProjectId);

      if (projectId) { 
        toast.warning('You no longer have access to that project. Switching to another project.');
      }
      if (pathname && pathname !== '/dashboard' && pathname !== '/create') {
        router.push('/dashboard');
      }
    }
  }
}, [projectId, projects, projectExists, setProjectId, isLoading, pathname, router]);

  return {
    projects,
    project,
    projectId: effectiveProjectId,
    setProjectId,
  };
};

export default useProject;
