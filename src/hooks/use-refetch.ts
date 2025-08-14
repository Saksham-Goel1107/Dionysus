import { useQueryClient } from '@tanstack/react-query';

const useRefetch = () => {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.refetchQueries({
      type: 'active',
    });
  };
};

export default useRefetch;
