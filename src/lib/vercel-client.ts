/**
 * Vercel API Client
 * Handles all interactions with Vercel REST API
 * Docs: https://vercel.com/docs/rest-api
 */

import { env } from '@/env';

const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  creator: {
    uid: string;
    email?: string;
    username?: string;
  };
  target?: 'production' | 'staging' | 'preview' | null;
  aliasAssigned?: boolean | null;
  aliasError?: {
    code: string;
    message: string;
  } | null;
  buildingAt?: number;
  ready?: number;
  checksState?: 'registered' | 'running' | 'completed';
  checksConclusion?: 'succeeded' | 'failed' | 'skipped' | 'canceled';
  readyState?: 'QUEUED' | 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'READY' | 'CANCELED';
  meta?: Record<string, string>;
}

export interface VercelDeploymentBuild {
  id: string;
  use: string;
  createdIn: string;
  deployedTo: { url: string }[];
  readyState: 'BUILDING' | 'ERROR' | 'READY';
  readyStateAt: number;
  path?: string;
  entrypoint?: string;
}

export interface VercelBuildLog {
  deploymentId: string;
  entrypoint: string;
  id: string;
  message: string;
  timestamp: number;
  type: 'stdout' | 'stderr' | 'command';
  source?: string;
}

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  updatedAt: number;
  createdAt: number;
  framework?: string;
  devCommand?: string | null;
  installCommand?: string | null;
  buildCommand?: string | null;
  outputDirectory?: string | null;
  rootDirectory?: string | null;
  directoryListing: boolean;
  nodeVersion: string;
  env?: { key: string; value: string; target: string[] }[];
}

export interface VercelAlias {
  uid: string;
  alias: string;
  created: string;
  deployment?: {
    id: string;
    url: string;
  };
  deploymentId?: string;
}

class VercelClient {
  private token: string;
  private teamId?: string;
  private projectId: string;

  constructor() {
    this.token = env.VERCEL_ACCESS_TOKEN;
    this.teamId = env.VERCEL_TEAM_ID;
    this.projectId = env.VERCEL_PROJECT_ID;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${VERCEL_API_BASE}${path}`);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  /**
   * Get list of deployments
   */
  async getDeployments(options?: {
    limit?: number;
    since?: number;
    until?: number;
    state?: VercelDeployment['state'];
  }): Promise<{ deployments: VercelDeployment[] }> {
    const params: Record<string, string> = {
      projectId: this.projectId,
      limit: String(options?.limit ?? 20),
    };

    if (options?.since) params.since = String(options.since);
    if (options?.until) params.until = String(options.until);
    if (options?.state) params.state = options.state;

    const url = this.buildUrl('/v6/deployments', params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deployments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a single deployment by ID
   */
  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    const url = this.buildUrl(`/v13/deployments/${deploymentId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deployment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get deployment builds (Note: Limited on free plan)
   */
  async getDeploymentBuilds(deploymentId: string): Promise<{ builds: VercelDeploymentBuild[] }> {
    const url = this.buildUrl(`/v1/deployments/${deploymentId}/builds`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch builds: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get build logs for a deployment
   * Note: This may be limited on free plan, but we'll try multiple endpoints
   */
  async getBuildLogs(deploymentId: string): Promise<VercelBuildLog[]> {
    // Try the events endpoint first (works on free plan for recent deployments)
    try {
      const url = this.buildUrl(`/v2/deployments/${deploymentId}/events`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();

        // Helper function to extract message from event
        const extractMessage = (event: any): string => {
          // Try different message fields
          if (typeof event.text === 'string') return event.text;
          if (typeof event.message === 'string') return event.message;

          // Handle payload object
          if (event.payload) {
            if (typeof event.payload === 'string') return event.payload;
            if (typeof event.payload.text === 'string') return event.payload.text;
            if (typeof event.payload.message === 'string') return event.payload.message;
            // Try to stringify if it's an object
            try {
              return JSON.stringify(event.payload);
            } catch {
              return String(event.payload);
            }
          }

          // Last resort: stringify the entire event
          try {
            return JSON.stringify(event);
          } catch {
            return 'Unable to parse log entry';
          }
        };

        // Handle different response formats
        const events = Array.isArray(data) ? data : data.events || [];

        if (events.length > 0) {
          return events
            .map(
              (event: any, index: number): VercelBuildLog => ({
                id: event.id || `log-${index}`,
                message: extractMessage(event),
                timestamp: event.created || event.timestamp || Date.now(),
                type: (event.type === 'stderr'
                  ? 'stderr'
                  : event.type === 'command'
                    ? 'command'
                    : 'stdout') as 'stdout' | 'stderr' | 'command',
                source: event.source || 'build',
                deploymentId: deploymentId,
                entrypoint: event.entrypoint || 'build',
              }),
            )
            .filter((log: VercelBuildLog) => log.message && log.message.trim().length > 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch from events endpoint:', error);
    }

    // Try alternative file endpoint for build output
    try {
      const fileUrl = this.buildUrl(`/v1/deployments/${deploymentId}/files/build-output.txt`);
      const fileResponse = await fetch(fileUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (fileResponse.ok) {
        const text = await fileResponse.text();
        const lines = text.split('\n').filter((line) => line.trim());
        return lines.map(
          (line, index): VercelBuildLog => ({
            id: `log-${index}`,
            message: line,
            timestamp: Date.now(),
            type: 'stdout',
            source: 'build',
            deploymentId: deploymentId,
            entrypoint: 'build',
          }),
        );
      }
    } catch (error) {
      console.error('Failed to fetch from files endpoint:', error);
    }

    // Return empty array if no logs available (common on free plan for older deployments)
    return [];
  }

  /**
   * Create a new deployment (redeploy)
   */
  async createDeployment(options: {
    name: string;
    gitSource?: {
      type: 'github' | 'gitlab' | 'bitbucket';
      repo: string;
      ref?: string;
    };
    target?: 'production' | 'staging';
    env?: Record<string, string>;
  }): Promise<VercelDeployment> {
    const url = this.buildUrl('/v13/deployments');
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: options.name,
        gitSource: options.gitSource,
        target: options.target,
        projectSettings: {
          framework: null,
        },
        env: options.env,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to create deployment: ${error.error?.message ?? response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Redeploy an existing deployment
   */
  async redeployDeployment(
    deploymentId: string,
    target?: 'production' | 'staging',
  ): Promise<VercelDeployment> {
    const url = this.buildUrl(`/v13/deployments`);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        deploymentId,
        target: target ?? 'production',
        name: this.projectId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to redeploy: ${error.error?.message ?? response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<{ state: string }> {
    const url = this.buildUrl(`/v12/deployments/${deploymentId}/cancel`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel deployment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a deployment
   */
  async deleteDeployment(deploymentId: string): Promise<{ state: string }> {
    const url = this.buildUrl(`/v13/deployments/${deploymentId}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete deployment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get project information
   */
  async getProject(): Promise<VercelProject> {
    const url = this.buildUrl(`/v9/projects/${this.projectId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get project domains/aliases
   */
  async getProjectDomains(): Promise<{ domains: VercelAlias[] }> {
    const url = this.buildUrl(`/v9/projects/${this.projectId}/domains`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch domains: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Promote deployment to production (assign production alias)
   */
  async promoteToProduction(deploymentId: string): Promise<VercelDeployment> {
    // This re-deploys with production target
    return this.redeployDeployment(deploymentId, 'production');
  }
}

// Export singleton instance
export const vercelClient = new VercelClient();
