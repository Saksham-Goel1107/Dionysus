'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Folder,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface DopplerProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

interface DopplerEnvironment {
  id: string;
  name: string;
  slug: string;
  project: string;
  created_at: string;
}

interface DopplerConfig {
  name: string;
  environment: string;
  project: string;
  locked: boolean;
  root: boolean;
  created_at: string;
}

interface DopplerSecret {
  raw: string;
  computed: string;
}

export default function DopplerManagementPage() {
  const [projects, setProjects] = useState<DopplerProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [environments, setEnvironments] = useState<DopplerEnvironment[]>([]);
  const [configs, setConfigs] = useState<DopplerConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [secrets, setSecrets] = useState<Record<string, DopplerSecret>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateEnvironment, setShowCreateEnvironment] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [maskedSecrets, setMaskedSecrets] = useState<Set<string>>(new Set());
  const [editingSecret, setEditingSecret] = useState<{ name: string; value: string } | null>(null);
  const { toast } = useToast();

  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newEnvironment, setNewEnvironment] = useState({ name: '', slug: '' });
  const [newSecret, setNewSecret] = useState({ name: '', value: '', visibility: 'masked' });

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/doppler/projects');

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchEnvironments = useCallback(
    async (project: string) => {
      try {
        const response = await fetch(`/api/admin/doppler/environments?project=${project}`);

        if (!response.ok) {
          throw new Error('Failed to fetch environments');
        }

        const data = await response.json();
        setEnvironments(data.environments || []);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch environments',
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  const fetchConfigs = useCallback(
    async (project: string, environment?: string) => {
      try {
        const url = environment
          ? `/api/admin/doppler/configs?project=${project}&environment=${environment}`
          : `/api/admin/doppler/configs?project=${project}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch configs');
        }

        const data = await response.json();
        setConfigs(data.configs || []);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch configs',
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  const fetchSecrets = useCallback(
    async (project: string, config: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/doppler/secrets?project=${project}&config=${config}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch secrets');
        }

        const data = await response.json();
        setSecrets(data.secrets || {});
        // Mask all secrets by default
        setMaskedSecrets(new Set(Object.keys(data.secrets || {})));
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch secrets',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // Fetch environments when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchEnvironments(selectedProject);
      fetchConfigs(selectedProject);
    }
  }, [selectedProject, fetchConfigs, fetchEnvironments]);

  // Fetch secrets when config changes
  useEffect(() => {
    if (selectedProject && selectedConfig) {
      fetchSecrets(selectedProject, selectedConfig);
    }
  }, [selectedProject, selectedConfig, fetchSecrets]);

  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/admin/doppler/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      setShowCreateProject(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const handleCreateEnvironment = async () => {
    try {
      const response = await fetch('/api/admin/doppler/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          ...newEnvironment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create environment');
      }

      toast({
        title: 'Success',
        description: 'Environment created successfully',
      });

      setShowCreateEnvironment(false);
      setNewEnvironment({ name: '', slug: '' });
      fetchEnvironments(selectedProject);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create environment',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSecret = async () => {
    if (!editingSecret) return;

    try {
      const response = await fetch('/api/admin/doppler/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          config: selectedConfig,
          name: editingSecret.name,
          value: editingSecret.value,
          visibility: newSecret.visibility,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update secret');
      }

      toast({
        title: 'Success',
        description: 'Secret updated successfully',
      });

      setShowSecretDialog(false);
      setEditingSecret(null);
      fetchSecrets(selectedProject, selectedConfig);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update secret',
        variant: 'destructive',
      });
    }
  };

  const handleCreateSecret = async () => {
    try {
      const response = await fetch('/api/admin/doppler/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          config: selectedConfig,
          ...newSecret,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create secret');
      }

      toast({
        title: 'Success',
        description: 'Secret created successfully',
      });

      setShowSecretDialog(false);
      setNewSecret({ name: '', value: '', visibility: 'masked' });
      fetchSecrets(selectedProject, selectedConfig);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create secret',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSecret = async (name: string) => {
    if (!confirm(`Are you sure you want to delete the secret "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/doppler/secrets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          config: selectedConfig,
          name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete secret');
      }

      toast({
        title: 'Success',
        description: 'Secret deleted successfully',
      });

      fetchSecrets(selectedProject, selectedConfig);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete secret',
        variant: 'destructive',
      });
    }
  };

  const toggleSecretVisibility = (name: string) => {
    setMaskedSecrets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Value copied to clipboard',
    });
  };

  const maskValue = (value: string): string => {
    if (!value || value.length <= 8) {
      return '•'.repeat(value.length || 1);
    }
    return value.substring(0, 4) + '•'.repeat(value.length - 8) + value.substring(value.length - 4);
  };

  return (
    <div className="min-h-screen space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doppler Management</h1>
            <p className="text-muted-foreground">
              Manage environment variables across all environments
            </p>
          </div>
        </div>
        <Button onClick={() => fetchProjects()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Select a Doppler project to manage</CardDescription>
            </div>
            <Button onClick={() => setShowCreateProject(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedProject === project.slug ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedProject(project.slug)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{project.name}</h3>
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{project.slug}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedProject && (
        <Tabs defaultValue="secrets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="secrets">Secrets</TabsTrigger>
            <TabsTrigger value="environments">Environments</TabsTrigger>
            <TabsTrigger value="configs">Configs</TabsTrigger>
          </TabsList>

          {/* Secrets Tab */}
          <TabsContent value="secrets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Environment Variables</CardTitle>
                    <CardDescription>Manage secrets for {selectedProject}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select config" />
                      </SelectTrigger>
                      <SelectContent>
                        {configs.map((config) => (
                          <SelectItem key={config.name} value={config.name}>
                            {config.name} ({config.environment})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        setEditingSecret(null);
                        setNewSecret({ name: '', value: '', visibility: 'masked' });
                        setShowSecretDialog(true);
                      }}
                      disabled={!selectedConfig}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Secret
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedConfig ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Name</TableHead>
                          <TableHead className="w-[50%]">Value</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(secrets).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              No secrets found
                            </TableCell>
                          </TableRow>
                        ) : (
                          Object.entries(secrets).map(([name, secret]) => (
                            <TableRow key={name}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Key className="h-4 w-4 text-muted-foreground" />
                                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                                    {name}
                                  </code>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                                  {maskedSecrets.has(name)
                                    ? maskValue(secret.computed || 'N/A')
                                    : secret.computed || 'N/A'}
                                </code>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleSecretVisibility(name)}
                                    title={maskedSecrets.has(name) ? 'Show value' : 'Hide value'}
                                  >
                                    {maskedSecrets.has(name) ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(secret.computed || '')}
                                    title="Copy value"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingSecret({ name, value: secret.computed || '' });
                                      setShowSecretDialog(true);
                                    }}
                                    title="Edit secret"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSecret(name)}
                                    title="Delete secret"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                    <div className="text-center">
                      <Settings className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Select a config to view secrets
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environments Tab */}
          <TabsContent value="environments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Environments</CardTitle>
                    <CardDescription>Manage environments for {selectedProject}</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateEnvironment(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Environment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {environments.map((env) => (
                    <div
                      key={env.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <h4 className="font-semibold">{env.name}</h4>
                        <p className="text-sm text-muted-foreground">{env.slug}</p>
                      </div>
                      <Badge>{env.slug}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configs Tab */}
          <TabsContent value="configs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configs</CardTitle>
                <CardDescription>View configurations for {selectedProject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {configs.map((config) => (
                    <div
                      key={config.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <h4 className="font-semibold">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Environment: {config.environment}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        {config.root && <Badge variant="outline">Root</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Create a new Doppler project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                placeholder="my-project"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Project description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProject(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProject.name}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Environment Dialog */}
      <Dialog open={showCreateEnvironment} onOpenChange={setShowCreateEnvironment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Environment</DialogTitle>
            <DialogDescription>Create a new environment for {selectedProject}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="env-name">Environment Name *</Label>
              <Input
                id="env-name"
                placeholder="Production"
                value={newEnvironment.name}
                onChange={(e) => setNewEnvironment({ ...newEnvironment, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-slug">Slug *</Label>
              <Input
                id="env-slug"
                placeholder="prd"
                value={newEnvironment.slug}
                onChange={(e) => setNewEnvironment({ ...newEnvironment, slug: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateEnvironment(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateEnvironment}
              disabled={!newEnvironment.name || !newEnvironment.slug}
            >
              Create Environment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Dialog (Create/Edit) */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSecret ? 'Edit Secret' : 'Create New Secret'}</DialogTitle>
            <DialogDescription>
              {editingSecret ? `Update the value for ${editingSecret.name}` : 'Add a new secret'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingSecret && (
              <div className="space-y-2">
                <Label htmlFor="secret-name">Secret Name *</Label>
                <Input
                  id="secret-name"
                  placeholder="API_KEY"
                  value={newSecret.name}
                  onChange={(e) => setNewSecret({ ...newSecret, name: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="secret-value">Value *</Label>
              <Textarea
                id="secret-value"
                placeholder="Secret value"
                value={editingSecret?.value || newSecret.value}
                onChange={(e) => {
                  if (editingSecret) {
                    setEditingSecret({ ...editingSecret, value: e.target.value });
                  } else {
                    setNewSecret({ ...newSecret, value: e.target.value });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-visibility">Visibility</Label>
              <Select
                value={newSecret.visibility}
                onValueChange={(value) => setNewSecret({ ...newSecret, visibility: value })}
              >
                <SelectTrigger id="secret-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masked">Masked</SelectItem>
                  <SelectItem value="unmasked">Unmasked</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecretDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingSecret ? handleUpdateSecret : handleCreateSecret}
              disabled={editingSecret ? !editingSecret.value : !newSecret.name || !newSecret.value}
            >
              <Save className="mr-2 h-4 w-4" />
              {editingSecret ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
