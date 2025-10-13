/**
 * Vercel API Type Definitions
 * Based on Vercel REST API v2/v6/v9/v13
 */

export type DeploymentState =
  | 'BUILDING'
  | 'ERROR'
  | 'INITIALIZING'
  | 'QUEUED'
  | 'READY'
  | 'CANCELED';

export type DeploymentTarget = 'production' | 'staging' | 'preview' | null;

export type ChecksState = 'registered' | 'running' | 'completed';
export type ChecksConclusion = 'succeeded' | 'failed' | 'skipped' | 'canceled';

export type BuildReadyState = 'BUILDING' | 'ERROR' | 'READY';
export type LogType = 'stdout' | 'stderr' | 'command';

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: DeploymentState;
  type: 'LAMBDAS';
  creator: {
    uid: string;
    email?: string;
    username?: string;
  };
  target?: DeploymentTarget;
  aliasAssigned?: boolean | null;
  aliasError?: {
    code: string;
    message: string;
  } | null;
  buildingAt?: number;
  ready?: number;
  checksState?: ChecksState;
  checksConclusion?: ChecksConclusion;
  readyState?: DeploymentState;
  meta?: Record<string, string>;
}

export interface VercelDeploymentBuild {
  id: string;
  use: string;
  createdIn: string;
  deployedTo: { url: string }[];
  readyState: BuildReadyState;
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
  type: LogType;
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
  env?: VercelEnvironmentVariable[];
}

export interface VercelEnvironmentVariable {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  type?: 'encrypted' | 'secret' | 'plain';
  id?: string;
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

export interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string;
  redirectStatusCode?: number;
  gitBranch?: string;
  updatedAt: number;
  createdAt: number;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

export interface DeploymentsResponse {
  deployments: VercelDeployment[];
  pagination?: {
    count: number;
    next?: number;
    prev?: number;
  };
}

export interface DeploymentBuildsResponse {
  builds: VercelDeploymentBuild[];
}

export interface DeploymentLogsResponse {
  logs: VercelBuildLog[];
}

export interface ProjectDomainsResponse {
  domains: VercelDomain[];
  pagination?: {
    count: number;
    next?: number;
    prev?: number;
  };
}

export interface DeploymentActionResponse {
  state: string;
  uid?: string;
}

export interface VercelErrorResponse {
  error: {
    code: string;
    message: string;
    action?: string;
    link?: string;
  };
}

// Client-side deployment card props
export interface DeploymentCardProps {
  deployment: VercelDeployment;
  onRedeploy: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPromote: (id: string) => Promise<void>;
  onViewLogs: (deployment: VercelDeployment) => void;
  isLoading?: boolean;
}

// Filter options for deployment list
export interface DeploymentFilters {
  state?: DeploymentState | 'all';
  target?: DeploymentTarget | 'all';
  search?: string;
  since?: number;
  until?: number;
  limit?: number;
}

// Deployment statistics
export interface DeploymentStats {
  total: number;
  ready: number;
  building: number;
  error: number;
  queued: number;
  canceled: number;
  productionDeployments: number;
  previewDeployments: number;
}
