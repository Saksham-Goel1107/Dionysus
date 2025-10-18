/**
 * Doppler API Integration
 * Provides full access to Doppler secrets management API
 */

import { env } from '@/env';

const DOPPLER_API_BASE = 'https://api.doppler.com/v3';

interface DopplerConfig {
  token: string;
}

interface DopplerProject {
  id: string;
  name: string;
  description: string;
  created_at: string;
  slug: string;
}

interface DopplerEnvironment {
  id: string;
  name: string;
  slug: string;
  initial_fetch_at: string;
  created_at: string;
  project: string;
}

interface DopplerConfigItem {
  name: string;
  environment: string;
  project: string;
  created_at: string;
  initial_fetch_at: string;
  last_fetch_at: string;
  locked: boolean;
  root: boolean;
}

interface DopplerSecret {
  raw: string;
  computed: string;
}

interface DopplerSecretUpdate {
  name: string;
  value: string;
  visibility?: 'masked' | 'unmasked' | 'restricted';
  change_type?: 'create' | 'update' | 'delete';
}

class DopplerClient {
  private token: string;
  private headers: HeadersInit;

  constructor(config: DopplerConfig) {
    this.token = config.token;
    this.headers = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${DOPPLER_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.messages?.join(', ') || data.message || 'Doppler API error',
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // ============ PROJECT OPERATIONS ============

  async listProjects(): Promise<{ success: boolean; data?: DopplerProject[]; error?: string }> {
    const result = await this.request<{ projects: DopplerProject[] }>('/projects');
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.projects,
      };
    }
    return {
      success: false,
      error: result.error,
    };
  }

  async getProject(
    project: string,
  ): Promise<{ success: boolean; data?: DopplerProject; error?: string }> {
    return this.request<DopplerProject>(`/projects/project?project=${project}`);
  }

  async createProject(
    name: string,
    description?: string,
  ): Promise<{ success: boolean; data?: DopplerProject; error?: string }> {
    return this.request<DopplerProject>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteProject(project: string): Promise<{ success: boolean; error?: string }> {
    return this.request(`/projects/project?project=${project}`, {
      method: 'DELETE',
    });
  }

  // ============ ENVIRONMENT OPERATIONS ============

  async listEnvironments(
    project: string,
  ): Promise<{ success: boolean; data?: DopplerEnvironment[]; error?: string }> {
    const result = await this.request<{ environments: DopplerEnvironment[] }>(
      `/environments?project=${project}`,
    );
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.environments,
      };
    }
    return {
      success: false,
      error: result.error,
    };
  }

  async createEnvironment(
    project: string,
    name: string,
    slug: string,
  ): Promise<{ success: boolean; data?: DopplerEnvironment; error?: string }> {
    return this.request<DopplerEnvironment>('/environments', {
      method: 'POST',
      body: JSON.stringify({ project, name, slug }),
    });
  }

  async renameEnvironment(
    project: string,
    environment: string,
    name: string,
    slug: string,
  ): Promise<{ success: boolean; data?: DopplerEnvironment; error?: string }> {
    return this.request<DopplerEnvironment>('/environments/environment', {
      method: 'PUT',
      body: JSON.stringify({ project, environment, name, slug }),
    });
  }

  async deleteEnvironment(
    project: string,
    environment: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.request(`/environments/environment?project=${project}&environment=${environment}`, {
      method: 'DELETE',
    });
  }

  // ============ CONFIG OPERATIONS ============

  async listConfigs(
    project: string,
    environment?: string,
  ): Promise<{ success: boolean; data?: DopplerConfigItem[]; error?: string }> {
    const params = new URLSearchParams({ project });
    if (environment) params.append('environment', environment);

    const result = await this.request<{ configs: DopplerConfigItem[] }>(`/configs?${params}`);
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.configs,
      };
    }
    return {
      success: false,
      error: result.error,
    };
  }

  async getConfig(
    project: string,
    config: string,
  ): Promise<{ success: boolean; data?: DopplerConfigItem; error?: string }> {
    return this.request<DopplerConfigItem>(`/configs/config?project=${project}&config=${config}`);
  }

  async createConfig(
    project: string,
    environment: string,
    name: string,
  ): Promise<{ success: boolean; data?: DopplerConfigItem; error?: string }> {
    return this.request<DopplerConfigItem>('/configs', {
      method: 'POST',
      body: JSON.stringify({ project, environment, name }),
    });
  }

  async cloneConfig(
    project: string,
    config: string,
    name: string,
  ): Promise<{ success: boolean; data?: DopplerConfigItem; error?: string }> {
    return this.request<DopplerConfigItem>('/configs/config/clone', {
      method: 'POST',
      body: JSON.stringify({ project, config, name }),
    });
  }

  async lockConfig(
    project: string,
    config: string,
  ): Promise<{ success: boolean; data?: DopplerConfigItem; error?: string }> {
    return this.request<DopplerConfigItem>('/configs/config/lock', {
      method: 'POST',
      body: JSON.stringify({ project, config }),
    });
  }

  async unlockConfig(
    project: string,
    config: string,
  ): Promise<{ success: boolean; data?: DopplerConfigItem; error?: string }> {
    return this.request<DopplerConfigItem>('/configs/config/unlock', {
      method: 'POST',
      body: JSON.stringify({ project, config }),
    });
  }

  async deleteConfig(
    project: string,
    config: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.request(`/configs/config?project=${project}&config=${config}`, {
      method: 'DELETE',
    });
  }

  // ============ SECRETS OPERATIONS ============

  async listSecrets(
    project: string,
    config: string,
    includeValues = true,
  ): Promise<{ success: boolean; data?: Record<string, DopplerSecret>; error?: string }> {
    const params = new URLSearchParams({
      project,
      config,
      include_dynamic_secrets: 'true',
      dynamic_secrets_ttl_sec: '1800',
    });

    if (!includeValues) {
      params.append('secrets', 'names');
    }

    const result = await this.request<{ secrets: Record<string, DopplerSecret> }>(`/configs/config/secrets?${params}`);
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.secrets,
      };
    }
    return {
      success: false,
      error: result.error,
    };
  }

  async getSecret(
    project: string,
    config: string,
    name: string,
  ): Promise<{ success: boolean; data?: DopplerSecret; error?: string }> {
    return this.request<DopplerSecret>(
      `/configs/config/secret?project=${project}&config=${config}&name=${name}`,
    );
  }

  async updateSecrets(
    project: string,
    config: string,
    secrets: DopplerSecretUpdate[],
  ): Promise<{ success: boolean; error?: string }> {
    return this.request('/configs/config/secrets', {
      method: 'POST',
      body: JSON.stringify({
        project,
        config,
        secrets: secrets.reduce(
          (acc, secret) => {
            acc[secret.name] = secret.value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      }),
    });
  }

  async updateSecret(
    project: string,
    config: string,
    name: string,
    value: string,
    visibility?: 'masked' | 'unmasked' | 'restricted',
  ): Promise<{ success: boolean; error?: string }> {
    return this.request('/configs/config/secret', {
      method: 'POST',
      body: JSON.stringify({
        project,
        config,
        secret: name,
        value,
        ...(visibility && { visibility }),
      }),
    });
  }

  async deleteSecret(
    project: string,
    config: string,
    name: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.request(`/configs/config/secret?project=${project}&config=${config}&name=${name}`, {
      method: 'DELETE',
    });
  }

  async downloadSecrets(
    project: string,
    config: string,
    format: 'json' | 'env' | 'yaml' = 'json',
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const response = await fetch(
        `${DOPPLER_API_BASE}/configs/config/secrets/download?project=${project}&config=${config}&format=${format}`,
        {
          headers: this.headers,
        },
      );

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: data.messages?.join(', ') || 'Download failed',
        };
      }

      const text = await response.text();
      return {
        success: true,
        data: text,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // ============ AUDIT LOG OPERATIONS ============

  async getAuditLog(
    page = 1,
    perPage = 20,
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const result = await this.request<{ audit: any[] }>(`/logs?page=${page}&per_page=${perPage}`);
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.audit,
      };
    }
    return {
      success: false,
      error: result.error,
    };
  }

  // ============ WORKSPACE OPERATIONS ============

  async getWorkspace(): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/workplace');
  }

  async updateWorkspace(
    name?: string,
    billingEmail?: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/workplace', {
      method: 'PUT',
      body: JSON.stringify({
        ...(name && { name }),
        ...(billingEmail && { billing_email: billingEmail }),
      }),
    });
  }
}

// Export singleton instance
let dopplerClient: DopplerClient | null = null;

export function getDopplerClient(): DopplerClient {
  if (!dopplerClient) {
    const token = env.DOPPLER_TOKEN || process.env.DOPPLER_TOKEN;
    if (!token) {
      throw new Error('DOPPLER_TOKEN environment variable is not set');
    }
    dopplerClient = new DopplerClient({ token });
  }
  return dopplerClient;
}

export type {
  DopplerConfigItem as DopplerConfig,
  DopplerEnvironment,
  DopplerProject,
  DopplerSecret,
  DopplerSecretUpdate,
};
