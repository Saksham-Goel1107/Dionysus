import { useCallback, useState } from 'react';

interface Deployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  target?: 'production' | 'staging' | 'preview' | null;
  creator?: {
    username?: string;
    email?: string;
  };
  meta?: Record<string, string>;
}

interface UseVercelDeploymentsOptions {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export function useVercelDeployments(options?: UseVercelDeploymentsOptions) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleError = useCallback(
    (error: unknown, defaultMessage: string) => {
      const message = error instanceof Error ? error.message : defaultMessage;
      options?.onError?.(new Error(message));
      console.error(message, error);
    },
    [options],
  );

  const handleSuccess = useCallback(
    (message: string) => {
      options?.onSuccess?.(message);
    },
    [options],
  );

  const fetchDeployments = useCallback(
    async (params?: {
      limit?: number;
      since?: number;
      until?: number;
      state?: string;
    }): Promise<{ deployments: Deployment[] } | null> => {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams();

        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.since) searchParams.set('since', String(params.since));
        if (params?.until) searchParams.set('until', String(params.until));
        if (params?.state && params.state !== 'all') searchParams.set('state', params.state);

        const response = await fetch(`/api/admin/vercel/deployments?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch deployments: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        handleError(error, 'Failed to fetch deployments');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const fetchDeployment = useCallback(
    async (deploymentId: string): Promise<Deployment | null> => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch deployment: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        handleError(error, 'Failed to fetch deployment');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const fetchLogs = useCallback(
    async (deploymentId: string): Promise<any[] | null> => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/logs`);

        if (!response.ok) {
          // 403 means logs not available on free plan
          if (response.status === 403) {
            return [];
          }
          throw new Error(`Failed to fetch logs: ${response.statusText}`);
        }

        const data = await response.json();
        return data.logs || [];
      } catch (error) {
        handleError(error, 'Failed to fetch logs');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const redeployDeployment = useCallback(
    async (
      deploymentId: string,
      target: 'production' | 'staging' = 'production',
    ): Promise<boolean> => {
      try {
        setActionLoading(deploymentId);
        const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/redeploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target }),
        });

        if (!response.ok) {
          throw new Error(`Failed to redeploy: ${response.statusText}`);
        }

        handleSuccess('Deployment initiated successfully');
        return true;
      } catch (error) {
        handleError(error, 'Failed to redeploy');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [handleError, handleSuccess],
  );

  const cancelDeployment = useCallback(
    async (deploymentId: string): Promise<boolean> => {
      try {
        setActionLoading(deploymentId);
        const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/cancel`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`Failed to cancel: ${response.statusText}`);
        }

        handleSuccess('Deployment canceled successfully');
        return true;
      } catch (error) {
        handleError(error, 'Failed to cancel deployment');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [handleError, handleSuccess],
  );

  const deleteDeployment = useCallback(
    async (deploymentId: string): Promise<boolean> => {
      try {
        setActionLoading(deploymentId);
        const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete: ${response.statusText}`);
        }

        handleSuccess('Deployment deleted successfully');
        return true;
      } catch (error) {
        handleError(error, 'Failed to delete deployment');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [handleError, handleSuccess],
  );

  const promoteToProduction = useCallback(
    async (deploymentId: string): Promise<boolean> => {
      try {
        setActionLoading(deploymentId);
        const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/promote`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`Failed to promote: ${response.statusText}`);
        }

        handleSuccess('Deployment promoted to production');
        return true;
      } catch (error) {
        handleError(error, 'Failed to promote deployment');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [handleError, handleSuccess],
  );

  return {
    loading,
    actionLoading,
    fetchDeployments,
    fetchDeployment,
    fetchLogs,
    redeployDeployment,
    cancelDeployment,
    deleteDeployment,
    promoteToProduction,
  };
}
