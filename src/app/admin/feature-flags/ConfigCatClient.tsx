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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Edit,
  Flag,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Product {
  productId: string;
  name: string;
  description?: string;
}

interface Config {
  configId: string;
  name: string;
  description?: string;
}

interface Environment {
  environmentId: string;
  name: string;
  color?: string;
  description?: string;
}

interface Setting {
  settingId: number;
  key: string;
  name: string;
  hint: string;
  settingType: 'boolean' | 'string' | 'int' | 'double';
}

interface SettingWithValue extends Setting {
  value?: boolean | string | number;
  loading?: boolean;
}

export default function ConfigCatClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [settings, setSettings] = useState<SettingWithValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSetting, setDeletingSetting] = useState<SettingWithValue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SettingWithValue | null>(null);
  const [editValue, setEditValue] = useState<boolean | string | number>('');
  const [isSaving, setIsSaving] = useState(false);

  // Create dialog state
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagKey, setNewFlagKey] = useState('');
  const [newFlagHint, setNewFlagHint] = useState('');
  const [newFlagType, setNewFlagType] = useState<'boolean' | 'string' | 'int' | 'double'>(
    'boolean',
  );

  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/configcat/products');
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products || []);

      if (data.products?.length > 0 && !selectedProduct) {
        setSelectedProduct(data.products[0]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products. Please check your API key configuration.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, toast]);

  const fetchConfigs = useCallback(
    async (productId: string) => {
      try {
        const response = await fetch(`/api/admin/configcat/configs?productId=${productId}`);
        if (!response.ok) throw new Error('Failed to fetch configs');

        const data = await response.json();
        setConfigs(data.configs || []);

        if (data.configs?.length > 0 && !selectedConfig) {
          setSelectedConfig(data.configs[0]);
        }
      } catch (error) {
        console.error('Error fetching configs:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch configs.',
          variant: 'destructive',
        });
      }
    },
    [selectedConfig, toast],
  );

  const fetchEnvironments = useCallback(
    async (productId: string) => {
      try {
        const response = await fetch(`/api/admin/configcat/environments?productId=${productId}`);
        if (!response.ok) throw new Error('Failed to fetch environments');

        const data = await response.json();
        setEnvironments(data.environments || []);

        if (data.environments?.length > 0 && !selectedEnvironment) {
          // Try to select Production first, or default to first environment
          const prodEnv = data.environments.find(
            (env: Environment) => env.name.toLowerCase() === 'production',
          );
          setSelectedEnvironment(prodEnv || data.environments[0]);
        }
      } catch (error) {
        console.error('Error fetching environments:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch environments.',
          variant: 'destructive',
        });
      }
    },
    [selectedEnvironment, toast],
  );

  const fetchSettingValue = useCallback(
    async (settingId: number, environmentId: string) => {
      try {
        const response = await fetch(
          `/api/admin/configcat/settings/${settingId}?environmentId=${environmentId}`,
        );

        if (!response.ok) {
          // If the API returns an error (e.g., 404 when no value is set), use default value
          const setting = settings.find((s) => s.settingId === settingId);
          let defaultValue: boolean | string | number | undefined;

          if (setting) {
            switch (setting.settingType) {
              case 'boolean':
                defaultValue = false;
                break;
              case 'int':
                defaultValue = 0;
                break;
              case 'double':
                defaultValue = 0.0;
                break;
              case 'string':
                defaultValue = '';
                break;
              default:
                defaultValue = undefined;
            }
          }

          setSettings((prev) =>
            prev.map((s) =>
              s.settingId === settingId
                ? {
                    ...s,
                    value: defaultValue,
                    loading: false,
                  }
                : s,
            ),
          );
          return;
        }

        const data = await response.json();

        // Handle different possible response structures
        let rawValue;
        if (data.value !== undefined) {
          // Response structure: { value: actualValue, ... }
          rawValue = data.value;
        } else {
          // Fallback
          rawValue = data;
        }

        // Parse the value based on setting type
        let parsedValue: boolean | string | number | undefined = rawValue;

        // Find the setting to get its type
        const setting = settings.find((s) => s.settingId === settingId);
        if (setting) {
          switch (setting.settingType) {
            case 'boolean':
              parsedValue = rawValue === 'true' || rawValue === true;
              break;
            case 'int':
              parsedValue = parseInt(String(rawValue));
              if (isNaN(parsedValue)) parsedValue = 0;
              break;
            case 'double':
              parsedValue = parseFloat(String(rawValue));
              if (isNaN(parsedValue)) parsedValue = 0.0;
              break;
            case 'string':
              parsedValue = String(rawValue || '');
              break;
            default:
              parsedValue = rawValue;
          }
        }

        setSettings((prev) =>
          prev.map((s) =>
            s.settingId === settingId
              ? {
                  ...s,
                  value: parsedValue,
                  loading: false,
                }
              : s,
          ),
        );
      } catch (error) {
        console.error(`Error fetching value for setting ${settingId}:`, error);

        // On error, also use default value
        const setting = settings.find((s) => s.settingId === settingId);
        let defaultValue: boolean | string | number | undefined;

        if (setting) {
          switch (setting.settingType) {
            case 'boolean':
              defaultValue = false;
              break;
            case 'int':
              defaultValue = 0;
              break;
            case 'double':
              defaultValue = 0.0;
              break;
            case 'string':
              defaultValue = '';
              break;
            default:
              defaultValue = undefined;
          }
        }

        setSettings((prev) =>
          prev.map((s) =>
            s.settingId === settingId ? { ...s, value: defaultValue, loading: false } : s,
          ),
        );
      }
    },
    [settings],
  );

  const fetchSettings = useCallback(
    async (configId: string, environmentId: string) => {
      try {
        setSettingsLoading(true);
        const response = await fetch(`/api/admin/configcat/settings?configId=${configId}`);
        if (!response.ok) throw new Error('Failed to fetch settings');

        const data = await response.json();
        const settingsData: SettingWithValue[] = data.settings || [];

        setSettings(
          settingsData.map((s) => ({
            ...s,
            loading: true,
          })),
        );

        // Fetch values for each setting
        for (const setting of settingsData) {
          fetchSettingValue(setting.settingId, environmentId);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch feature flags.',
          variant: 'destructive',
        });
      } finally {
        setSettingsLoading(false);
      }
    },
    [toast, fetchSettingValue],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedProduct) {
      fetchConfigs(selectedProduct.productId);
      fetchEnvironments(selectedProduct.productId);
    }
  }, [selectedProduct, fetchConfigs, fetchEnvironments]);

  useEffect(() => {
    if (selectedConfig && selectedEnvironment) {
      fetchSettings(selectedConfig.configId, selectedEnvironment.environmentId);
    }
  }, [selectedConfig, selectedEnvironment, fetchSettings]);

  const handleToggleFlag = async (setting: SettingWithValue) => {
    if (!selectedEnvironment || setting.settingType !== 'boolean') return;

    const newValue = !setting.value;

    try {
      setSettings((prev) =>
        prev.map((s) => (s.settingId === setting.settingId ? { ...s, loading: true } : s)),
      );

      const response = await fetch(`/api/admin/configcat/settings/${setting.settingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environmentId: selectedEnvironment.environmentId,
          value: newValue,
          reason: `Toggled via admin panel by user`,
        }),
      });

      if (!response.ok) throw new Error('Failed to update flag');

      setSettings((prev) =>
        prev.map((s) =>
          s.settingId === setting.settingId
            ? {
                ...s,
                value: newValue,
                loading: false,
              }
            : s,
        ),
      );

      toast({
        title: 'Success',
        description: `Feature flag "${setting.name}" ${newValue ? 'enabled' : 'disabled'} successfully.`,
        variant: newValue ? 'default' : 'default',
      });
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feature flag.',
        variant: 'destructive',
      });
      setSettings((prev) =>
        prev.map((s) =>
          s.settingId === setting.settingId
            ? {
                ...s,
                loading: false,
              }
            : s,
        ),
      );
    }
  };

  const handleEditFlag = (setting: SettingWithValue) => {
    setEditingSetting(setting);
    // Properly initialize edit value based on type
    if (setting.settingType === 'boolean') {
      setEditValue(!!setting.value);
    } else if (setting.settingType === 'int') {
      setEditValue(setting.value ? parseInt(String(setting.value)) : 0);
    } else if (setting.settingType === 'double') {
      setEditValue(setting.value ? parseFloat(String(setting.value)) : 0.0);
    } else {
      setEditValue(setting.value ?? '');
    }
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSetting || !selectedEnvironment) return;

    try {
      setIsSaving(true);

      // Validate and coerce value based on type
      let valueToSave: boolean | string | number = editValue;

      if (editingSetting.settingType === 'int') {
        valueToSave = parseInt(String(editValue));
        if (isNaN(valueToSave)) {
          toast({
            title: 'Validation Error',
            description: 'Please enter a valid integer value.',
            variant: 'destructive',
          });
          return;
        }
      } else if (editingSetting.settingType === 'double') {
        valueToSave = parseFloat(String(editValue));
        if (isNaN(valueToSave)) {
          toast({
            title: 'Validation Error',
            description: 'Please enter a valid decimal value.',
            variant: 'destructive',
          });
          return;
        }
      } else if (editingSetting.settingType === 'string') {
        valueToSave = String(editValue);
      } else if (editingSetting.settingType === 'boolean') {
        valueToSave = Boolean(editValue);
      }

      const response = await fetch(`/api/admin/configcat/settings/${editingSetting.settingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environmentId: selectedEnvironment.environmentId,
          value: valueToSave,
          reason: `Updated via admin panel - ${editingSetting.settingType} value changed`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update flag');
      }

      setSettings((prev) =>
        prev.map((s) =>
          s.settingId === editingSetting.settingId
            ? {
                ...s,
                value: valueToSave,
              }
            : s,
        ),
      );

      toast({
        title: 'Success',
        description: `Feature flag "${editingSetting.name}" updated successfully to: ${valueToSave}`,
      });

      setShowEditDialog(false);
      setEditingSetting(null);
    } catch (error) {
      console.error('Error updating flag:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update feature flag.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFlag = (setting: SettingWithValue) => {
    setDeletingSetting(setting);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSetting) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/admin/configcat/settings/${deletingSetting.settingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete flag');
      }

      setSettings((prev) => prev.filter((s) => s.settingId !== deletingSetting.settingId));

      toast({
        title: 'Success',
        description: `Feature flag "${deletingSetting.name}" deleted successfully.`,
      });

      setShowDeleteDialog(false);
      setDeletingSetting(null);
    } catch (error) {
      console.error('Error deleting flag:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete feature flag.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFlag = async () => {
    if (!selectedConfig || !newFlagName || !newFlagKey) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/configcat/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: selectedConfig.configId,
          name: newFlagName,
          key: newFlagKey,
          hint: newFlagHint,
          settingType: newFlagType,
        }),
      });

      if (!response.ok) throw new Error('Failed to create flag');

      toast({
        title: 'Success',
        description: `Feature flag "${newFlagName}" created successfully.`,
      });

      setShowCreateDialog(false);
      setNewFlagName('');
      setNewFlagKey('');
      setNewFlagHint('');
      setNewFlagType('boolean');

      // Refresh settings
      if (selectedConfig && selectedEnvironment) {
        fetchSettings(selectedConfig.configId, selectedEnvironment.environmentId);
      }
    } catch (error) {
      console.error('Error creating flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create feature flag.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied',
      description: 'Feature flag key copied to clipboard.',
    });
  };

  const handleRefresh = () => {
    if (selectedConfig && selectedEnvironment) {
      fetchSettings(selectedConfig.configId, selectedEnvironment.environmentId);
    }
  };

  const filteredSettings = settings.filter(
    (setting) =>
      setting.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.hint.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getValueBadge = (setting: SettingWithValue) => {
    if (setting.loading) {
      return <Skeleton className="h-6 w-20" />;
    }

    if (setting.settingType === 'boolean') {
      const isEnabled = !!setting.value;
      return (
        <Badge variant={isEnabled ? 'default' : 'secondary'} className="gap-1">
          {isEnabled ? (
            <>
              <CheckCircle2 className="h-3 w-3" /> Enabled
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" /> Disabled
            </>
          )}
        </Badge>
      );
    }

    // Handle string, int, and double types
    const displayValue =
      setting.value === null || setting.value === undefined || setting.value === ''
        ? 'Not set'
        : String(setting.value);

    const isNotSet = displayValue === 'Not set';

    return (
      <Badge
        variant={isNotSet ? 'outline' : 'default'}
        className={`max-w-xs truncate font-mono ${isNotSet ? 'text-muted-foreground' : ''}`}
        title={displayValue} // Show full value on hover
      >
        {displayValue}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
          <h3 className="mb-2 text-lg font-semibold">No Products Found</h3>
          <p className="text-center text-sm text-muted-foreground">
            Please check your ConfigCat Management API key configuration.
            <br />
            Make sure CONFIGCAT_MANAGEMENT_AUTH_HEADER is set in your environment variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Select product, config, and environment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={selectedProduct?.productId}
                onValueChange={(value) => {
                  const product = products.find((p) => p.productId === value);
                  setSelectedProduct(product || null);
                  setSelectedConfig(null);
                  setSelectedEnvironment(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.productId} value={product.productId}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Config</Label>
              <Select
                value={selectedConfig?.configId}
                onValueChange={(value) => {
                  const config = configs.find((c) => c.configId === value);
                  setSelectedConfig(config || null);
                }}
                disabled={!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select config" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.configId} value={config.configId}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Environment</Label>
              <Select
                value={selectedEnvironment?.environmentId}
                onValueChange={(value) => {
                  const env = environments.find((e) => e.environmentId === value);
                  setSelectedEnvironment(env || null);
                }}
                disabled={!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.environmentId} value={env.environmentId}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags List */}
      {selectedConfig && selectedEnvironment && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription className="mt-1">
                  {settings.length} feature flag{settings.length !== 1 ? 's' : ''} in{' '}
                  <Badge
                    variant={
                      selectedEnvironment.name.toLowerCase() === 'production'
                        ? 'destructive'
                        : 'default'
                    }
                    className="ml-1"
                  >
                    {selectedEnvironment.name}
                  </Badge>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Flag
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search feature flags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {settingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredSettings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Flag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Feature Flags Found</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No flags match your search query.'
                    : 'Create your first feature flag to get started.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Feature Flag
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSettings.map((setting) => (
                  <Card key={setting.settingId} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold">{setting.name}</h4>
                            {getValueBadge(setting)}
                            <Badge variant="outline" className="text-xs">
                              {setting.settingType}
                            </Badge>
                          </div>

                          {setting.hint && (
                            <p className="mb-3 text-sm text-muted-foreground">{setting.hint}</p>
                          )}

                          {/* Current Value Display */}
                          {setting.settingType !== 'boolean' && !setting.loading && (
                            <div className="mb-3 rounded-md bg-muted/50 p-3">
                              <div className="mb-1 text-xs font-medium text-muted-foreground">
                                Current Value:
                              </div>
                              <div className="break-all font-mono text-sm">
                                {setting.value === null ||
                                setting.value === undefined ||
                                setting.value === '' ? (
                                  <span className="italic text-muted-foreground">Not set</span>
                                ) : (
                                  <span className="text-foreground">{String(setting.value)}</span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {setting.key}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyKey(setting.key)}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-start gap-2">
                          {setting.settingType === 'boolean' && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!setting.value}
                                onCheckedChange={() => handleToggleFlag(setting)}
                                disabled={setting.loading}
                              />
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFlag(setting)}
                            disabled={setting.loading}
                            title="Edit value"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFlag(setting)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={setting.loading}
                            title="Delete flag"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Feature Flag
            </DialogTitle>
            <DialogDescription>
              Add a new feature flag to{' '}
              <span className="font-semibold">{selectedConfig?.name}</span> in{' '}
              {selectedEnvironment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flag-name" className="text-base">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flag-name"
                placeholder="e.g., Enable New Dashboard"
                value={newFlagName}
                onChange={(e) => setNewFlagName(e.target.value)}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                A human-readable name for this feature flag
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-key" className="text-base">
                Key (Identifier) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flag-key"
                placeholder="e.g., enableNewDashboard"
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="font-mono text-base"
              />
              <p className="text-xs text-muted-foreground">
                This is how you&apos;ll reference it in your code. Use camelCase, no spaces.
              </p>
              {newFlagKey && (
                <div className="rounded-md bg-muted p-2">
                  <code className="text-xs">
                    configCatClient.getValue(&apos;{newFlagKey}&apos;, defaultValue)
                  </code>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-hint" className="text-base">
                Description
              </Label>
              <Textarea
                id="flag-hint"
                placeholder="Describe what this flag controls and when it should be enabled..."
                value={newFlagHint}
                onChange={(e) => setNewFlagHint(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Help your team understand the purpose of this flag
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-type" className="text-base">
                Value Type
              </Label>
              <Select value={newFlagType} onValueChange={(value: any) => setNewFlagType(value)}>
                <SelectTrigger className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Boolean (True/False)</span>
                      <span className="text-xs text-muted-foreground">
                        On/Off toggle for features
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="string">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">String (Text)</span>
                      <span className="text-xs text-muted-foreground">
                        Text values, URLs, JSON, etc.
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="int">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Integer (Whole Number)</span>
                      <span className="text-xs text-muted-foreground">
                        Numeric limits, counts, IDs
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="double">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Double (Decimal Number)</span>
                      <span className="text-xs text-muted-foreground">
                        Percentages, rates, precise values
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Note about default values
                  </p>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                    After creation, you&apos;ll need to set the initial value for each environment.
                    The flag will be created but not yet configured.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFlag}
              disabled={!newFlagName || !newFlagKey}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag Value</DialogTitle>
            <DialogDescription>
              Update the value for <span className="font-semibold">{editingSetting?.name}</span> in{' '}
              {selectedEnvironment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Flag Information */}
            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Key:</span>
                <code className="rounded bg-background px-2 py-1 text-sm">
                  {editingSetting?.key}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editingSetting && handleCopyKey(editingSetting.key)}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Type:</span>
                <Badge variant="outline" className="text-xs">
                  {editingSetting?.settingType}
                </Badge>
              </div>

              {editingSetting?.hint && (
                <div className="border-t pt-2">
                  <span className="text-xs font-medium text-muted-foreground">Description:</span>
                  <p className="mt-1 text-sm text-foreground">{editingSetting.hint}</p>
                </div>
              )}
            </div>

            {/* Current Value Display */}
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">Current Value:</div>
              <div className="font-mono text-base">
                {editingSetting?.value === null ||
                editingSetting?.value === undefined ||
                editingSetting?.value === '' ? (
                  <span className="italic text-muted-foreground">Not set</span>
                ) : editingSetting?.settingType === 'boolean' ? (
                  <span
                    className={
                      editingSetting.value ? 'font-semibold text-green-600' : 'text-gray-600'
                    }
                  >
                    {editingSetting.value ? 'true (Enabled)' : 'false (Disabled)'}
                  </span>
                ) : (
                  <span className="break-all text-foreground">{String(editingSetting?.value)}</span>
                )}
              </div>
            </div>

            {/* Value Editor */}
            <div className="space-y-2">
              <Label htmlFor="edit-value" className="text-base font-semibold">
                New Value <span className="text-red-500">*</span>
              </Label>
              {editingSetting?.settingType === 'boolean' ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                  <Switch
                    id="edit-value"
                    checked={!!editValue}
                    onCheckedChange={(checked) => setEditValue(checked)}
                  />
                  <div>
                    <span className="text-base font-semibold">
                      {editValue ? 'Enabled' : 'Disabled'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {editValue ? 'Feature flag is turned ON' : 'Feature flag is turned OFF'}
                    </p>
                  </div>
                </div>
              ) : editingSetting?.settingType === 'int' ? (
                <div>
                  <Input
                    id="edit-value"
                    type="number"
                    step="1"
                    value={String(editValue)}
                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                    placeholder="Enter an integer value"
                    className="font-mono text-base"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter a whole number (e.g., 42, -10, 0)
                  </p>
                </div>
              ) : editingSetting?.settingType === 'double' ? (
                <div>
                  <Input
                    id="edit-value"
                    type="number"
                    step="0.01"
                    value={String(editValue)}
                    onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                    placeholder="Enter a decimal value"
                    className="font-mono text-base"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter a decimal number (e.g., 3.14, 0.5, -2.75)
                  </p>
                </div>
              ) : (
                <div>
                  <Textarea
                    id="edit-value"
                    value={String(editValue)}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={5}
                    placeholder="Enter a string value"
                    className="font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter any text value. This can include JSON, URLs, or plain text.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="gap-2" disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Feature Flag
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the feature flag and remove
              it from all environments.
            </DialogDescription>
          </DialogHeader>

          {deletingSetting && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Flag Name:</span>
                  <span className="text-sm font-semibold">{deletingSetting.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Key:</span>
                  <code className="rounded bg-background px-2 py-1 text-sm">
                    {deletingSetting.key}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {deletingSetting.settingType}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Flag
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
