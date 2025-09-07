'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Check,
  Code2,
  Copy,
  Eye,
  Globe,
  Key,
  Plus,
  RefreshCw,
  RotateCw,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface FormProject {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
  apiKeys: ApiKey[];
}

interface ApiKey {
  id: string;
  keyId: string;
  name: string;
  isActive: boolean;
  lastUsedAt?: string;
  requestCount: number;
  createdAt: string;
}

interface FormSubmission {
  id: string;
  data: Record<string, any>;
  metadata: {
    userAgent?: string;
    ip?: string;
    referer?: string;
    timestamp: number;
  };
}

export default function FormsPage() {
  const [projects, setProjects] = useState<FormProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FormProject | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [regenerateKeyId, setRegenerateKeyId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingDomains, setEditingDomains] = useState<string[]>([]);
  const [isEditingDomains, setIsEditingDomains] = useState(false);
  const { toast } = useToast();

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    domains: [''] as string[],
  });

  const fetchProjects = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/forms/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');

      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch form projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const validDomains = newProject.domains.filter((d) => d.trim().length > 0);
      const response = await fetch('/api/forms/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          domain: validDomains.length > 0 ? validDomains.join(',') : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create project');

      const data = await response.json();
      setProjects([data.project, ...projects]);
      setNewApiKey(data.apiKey);
      setNewProject({ name: '', description: '', domains: [''] });
      setShowNewProject(false);

      toast({
        title: 'Success',
        description: 'Form project created successfully!',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const fetchSubmissions = async (projectId: string) => {
    try {
      const response = await fetch(`/api/forms/projects/${projectId}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');

      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch submissions',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));

      if (label === 'API Key') {
        toast({
          title: 'API Key Copied!',
          description: 'Remember to add this to your .env file as FORM_API_KEY',
        });
      } else {
        toast({
          title: 'Copied!',
          description: `${label} copied to clipboard`,
        });
      }

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const toggleProjectStatus = async (projectId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/forms/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to update project status');

      const data = await response.json();
      setProjects((prev) => prev.map((p) => (p.id === projectId ? data.project : p)));

      if (selectedProject?.id === projectId) {
        setSelectedProject(data.project);
      }

      toast({
        title: 'Success',
        description: `Project ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project status',
        variant: 'destructive',
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/forms/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete project');

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setDeleteProjectId(null);

      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const regenerateApiKey = async (keyId: string) => {
    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/forms/keys/${keyId}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to regenerate API key');

      const data = await response.json();
      setNewApiKey(data.apiKey);
      setRegenerateKeyId(null);

      // Refresh the selected project to get updated key info
      if (selectedProject) {
        const projectResponse = await fetch(`/api/forms/projects/${selectedProject.id}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setSelectedProject(projectData.project);

          // Update projects list too
          setProjects((prev) =>
            prev.map((p) => (p.id === selectedProject.id ? projectData.project : p)),
          );
        }
      }

      toast({
        title: 'Success',
        description: 'API key regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate API key',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const startEditingDomains = () => {
    const currentDomains = selectedProject?.domain
      ? selectedProject.domain.split(',').map((d) => d.trim())
      : [''];
    setEditingDomains(currentDomains.length > 0 ? currentDomains : ['']);
    setIsEditingDomains(true);
  };

  const saveDomains = async () => {
    if (!selectedProject) return;

    try {
      const validDomains = editingDomains.filter((d) => d.trim().length > 0);
      const domainString = validDomains.length > 0 ? validDomains.join(',') : null;

      const response = await fetch(`/api/forms/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainString }),
      });

      if (!response.ok) throw new Error('Failed to update domains');

      const data = await response.json();
      setSelectedProject(data.project);
      setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? data.project : p)));
      setIsEditingDomains(false);

      toast({
        title: 'Success',
        description: 'Domains updated successfully',
      });
    } catch (error) {
      console.error('Error updating domains:', error);
      toast({
        title: 'Error',
        description: 'Failed to update domains',
        variant: 'destructive',
      });
    }
  };

  const addEditingDomain = () => {
    setEditingDomains((prev) => [...prev, '']);
  };

  const removeEditingDomain = (index: number) => {
    setEditingDomains((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEditingDomain = (index: number, value: string) => {
    setEditingDomains((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  const addDomainField = () => {
    setNewProject((prev) => ({
      ...prev,
      domains: [...prev.domains, ''],
    }));
  };

  const removeDomainField = (index: number) => {
    setNewProject((prev) => ({
      ...prev,
      domains: prev.domains.filter((_, i) => i !== index),
    }));
  };

  const updateDomain = (index: number, value: string) => {
    setNewProject((prev) => ({
      ...prev,
      domains: prev.domains.map((d, i) => (i === index ? value : d)),
    }));
  };

  const getEndpointUrl = () => {
    return `${window.location.origin}/api/forms/submit`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-gray-500">Loading form projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Collection</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Collect form submissions from your websites securely
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchProjects} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Form Project</DialogTitle>
                <DialogDescription>
                  Create a new project to start collecting form submissions
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My Website Forms"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Contact forms for my website"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Allowed Domains (Optional)</Label>
                  <p className="mb-2 text-sm text-gray-500">
                    Leave empty to allow submissions from any domain
                  </p>
                  {newProject.domains.map((domain, index) => (
                    <div key={index} className="mb-2 flex items-center gap-2">
                      <Input
                        placeholder="localhost:3000, mywebsite.com"
                        value={domain}
                        onChange={(e) => updateDomain(index, e.target.value)}
                      />
                      {newProject.domains.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDomainField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDomainField}
                    className="mt-1"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Domain
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewProject(false)}>
                  Cancel
                </Button>
                <Button onClick={createProject} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* New API Key Alert */}
      {newApiKey && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">API Key Generated</CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Save this API key securely. You won&apos;t be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white p-2 font-mono text-sm dark:bg-gray-900">
                {newApiKey}
              </code>
              <Button
                size="sm"
                onClick={() => copyToClipboard(newApiKey, 'API Key', `api-key-${newApiKey}`)}
              >
                {copiedStates[`api-key-${newApiKey}`] ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                💡 Remember to add this to your .env file:
              </p>
              <code className="mt-1 block text-xs text-blue-700 dark:text-blue-300">
                FORM_API_KEY={newApiKey}
              </code>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setNewApiKey(null)}>
                I&apos;ve saved the key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code2 className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold">No form projects yet</h3>
            <p className="mb-4 text-center text-gray-600 dark:text-gray-400">
              Create your first project to start collecting form submissions
            </p>
            <Button onClick={() => setShowNewProject(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1">{project.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant={project.isActive ? 'default' : 'secondary'}>
                    {project.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Key className="h-4 w-4" />
                    {project.apiKeys.length} keys
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    {project.apiKeys.reduce((sum, key) => sum + key.requestCount, 0)} requests
                  </div>
                  {project.domain && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {project.domain}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedProject(project);
                          fetchSubmissions(project.id);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{project.name}</DialogTitle>
                        <DialogDescription>Project details and form submissions</DialogDescription>
                      </DialogHeader>

                      {selectedProject && (
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="setup">Setup</TabsTrigger>
                            <TabsTrigger value="submissions">Submissions</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                          </TabsList>

                          <TabsContent value="overview" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">API Keys</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">
                                    {selectedProject.apiKeys.length}
                                  </div>
                                  <p className="text-sm text-gray-600">Active keys</p>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">Total Requests</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">
                                    {selectedProject.apiKeys.reduce(
                                      (sum, key) => sum + key.requestCount,
                                      0,
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">All time</p>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">Submissions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{submissions.length}</div>
                                  <p className="text-sm text-gray-600">Recent</p>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>

                          <TabsContent value="setup" className="space-y-4">
                            <div className="space-y-6">
                              <div>
                                <h3 className="mb-3 text-lg font-semibold">Endpoint URL</h3>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 rounded bg-gray-100 p-3 text-sm dark:bg-gray-800">
                                    {getEndpointUrl()}
                                  </code>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      copyToClipboard(
                                        getEndpointUrl(),
                                        'Endpoint URL',
                                        `endpoint-${selectedProject.id}`,
                                      )
                                    }
                                  >
                                    {copiedStates[`endpoint-${selectedProject.id}`] ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <h3 className="mb-3 text-lg font-semibold">API Keys</h3>
                                <div className="space-y-3">
                                  {selectedProject.apiKeys.map((key) => (
                                    <div
                                      key={key.id}
                                      className="flex items-center justify-between rounded border p-3"
                                    >
                                      <div>
                                        <div className="font-medium">{key.name}</div>
                                        <div className="text-sm text-gray-600">
                                          Key ID: {key.keyId} • {key.requestCount} requests
                                        </div>
                                      </div>
                                      <Badge variant={key.isActive ? 'default' : 'secondary'}>
                                        {key.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h3 className="mb-3 text-lg font-semibold">JavaScript Example</h3>
                                <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm dark:bg-gray-800">
                                  {`fetch('${getEndpointUrl()}', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello world!'
  })
}).then(response => response.json())`}
                                </pre>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="submissions" className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Form Submissions</h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchSubmissions(selectedProject.id)}
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Refresh
                              </Button>
                            </div>
                            <div className="space-y-4">
                              {submissions.length === 0 ? (
                                <div className="py-8 text-center text-gray-500">
                                  No submissions yet
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {submissions.map((submission) => (
                                    <Card key={submission.id}>
                                      <CardContent className="p-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>
                                              {new Date(
                                                submission.metadata.timestamp,
                                              ).toLocaleString()}
                                            </span>
                                            {submission.metadata.ip && (
                                              <span>IP: {submission.metadata.ip}</span>
                                            )}
                                          </div>
                                          <div className="space-y-1">
                                            {Object.entries(submission.data).map(([key, value]) => (
                                              <div key={key} className="flex gap-2">
                                                <span className="min-w-24 font-medium">{key}:</span>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                  {String(value)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="settings" className="space-y-4">
                            <div className="space-y-6">
                              <div>
                                <h3 className="mb-3 text-lg font-semibold">Project Settings</h3>
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">Active</div>
                                      <div className="text-sm text-gray-600">
                                        Enable or disable this project
                                      </div>
                                    </div>
                                    <Switch
                                      checked={selectedProject.isActive}
                                      onCheckedChange={(checked) =>
                                        toggleProjectStatus(selectedProject.id, checked)
                                      }
                                    />
                                  </div>

                                  <div>
                                    <div className="mb-2 flex items-center justify-between">
                                      <Label>Allowed Domains</Label>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={startEditingDomains}
                                        disabled={isEditingDomains}
                                      >
                                        <Settings className="mr-1 h-3 w-3" />
                                        Edit
                                      </Button>
                                    </div>

                                    {isEditingDomains ? (
                                      <div className="space-y-2">
                                        {editingDomains.map((domain, index) => (
                                          <div key={index} className="flex items-center gap-2">
                                            <Input
                                              value={domain}
                                              onChange={(e) =>
                                                updateEditingDomain(index, e.target.value)
                                              }
                                              placeholder="localhost:3000, example.com"
                                            />
                                            {editingDomains.length > 1 && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => removeEditingDomain(index)}
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={addEditingDomain}
                                          >
                                            <Plus className="mr-1 h-3 w-3" />
                                            Add Domain
                                          </Button>
                                          <Button size="sm" onClick={saveDomains}>
                                            Save
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsEditingDomains(false)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <Input
                                          value={selectedProject.domain || 'All domains allowed'}
                                          placeholder="localhost:3000, example.com"
                                          className="mt-1"
                                          readOnly
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                          Comma-separated list of domains that can submit forms.
                                          Leave empty to allow all domains.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="mb-3 text-lg font-semibold">API Keys</h3>
                                <div className="space-y-3">
                                  {selectedProject.apiKeys.map((key) => (
                                    <div
                                      key={key.id}
                                      className="flex items-center justify-between rounded border p-3"
                                    >
                                      <div>
                                        <div className="font-medium">{key.name}</div>
                                        <div className="text-sm text-gray-600">
                                          Key ID: {key.keyId} • {key.requestCount} requests
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={key.isActive ? 'default' : 'secondary'}>
                                          {key.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <AlertDialog
                                          open={regenerateKeyId === key.keyId}
                                          onOpenChange={(open) =>
                                            setRegenerateKeyId(open ? key.keyId : null)
                                          }
                                        >
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setRegenerateKeyId(key.keyId)}
                                          >
                                            <RotateCw className="mr-1 h-3 w-3" />
                                            Regenerate
                                          </Button>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Regenerate API Key
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will generate a new API key and invalidate the
                                                current one. Make sure to update your applications
                                                with the new key. This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => regenerateApiKey(key.keyId)}
                                                disabled={isRegenerating}
                                              >
                                                {isRegenerating
                                                  ? 'Regenerating...'
                                                  : 'Regenerate Key'}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t pt-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold text-red-600">
                                      Danger Zone
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      Permanently delete this project and all its data
                                    </p>
                                  </div>
                                  <AlertDialog
                                    open={deleteProjectId === selectedProject.id}
                                    onOpenChange={(open) =>
                                      setDeleteProjectId(open ? selectedProject.id : null)
                                    }
                                  >
                                    <Button
                                      variant="destructive"
                                      onClick={() => setDeleteProjectId(selectedProject.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Project
                                    </Button>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete &quot;
                                          {selectedProject.name}&quot;? This will permanently delete
                                          the project, all API keys, and all form submissions. This
                                          action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteProject(selectedProject.id)}
                                          disabled={isDeleting}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          {isDeleting ? 'Deleting...' : 'Delete Project'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
