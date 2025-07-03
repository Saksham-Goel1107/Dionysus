import { api } from '@/trpc/react';
import { useLocalStorage } from 'usehooks-ts';

const useProject = () => {
  const { data: projects } = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useLocalStorage('dionysus-projectId', '');

  const effectiveProjectId =
    !projectId && projects && projects.length > 0 ? projects[0]?.id || '' : projectId;

  const project = projects?.find((project) => project.id === effectiveProjectId);

  if (effectiveProjectId !== projectId && effectiveProjectId) {
    setProjectId(effectiveProjectId);
  }

  return {
    projects,
    project,
    projectId,
    setProjectId,
  };
};

export default useProject;
