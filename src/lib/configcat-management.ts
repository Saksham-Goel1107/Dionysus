/**
 * ConfigCat Management API Client
 * Handles all interactions with ConfigCat Public Management API
 * Docs: https://api.configcat.com/docs/
 */

interface ConfigCatSetting {
  settingId: number;
  key: string;
  name: string;
  hint: string;
  settingType: 'boolean' | 'string' | 'int' | 'double';
  value?: boolean | string | number;
}

interface ConfigCatConfig {
  configId: string;
  name: string;
  description?: string;
}

interface ConfigCatEnvironment {
  environmentId: string;
  name: string;
  color?: string;
  description?: string;
}

interface SettingValue {
  rolloutRules: any[];
  rolloutPercentageItems: any[];
  value: boolean | string | number;
  setting: {
    key: string;
    name: string;
    hint: string;
    settingType: 'boolean' | 'string' | 'int' | 'double';
  };
}

export class ConfigCatManagementClient {
  private readonly baseUrl = 'https://api.configcat.com';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ConfigCat Management API key is required');
    }
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Basic ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all products (projects)
   */
  async getProducts(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/v1/products`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all configs for a product
   */
  async getConfigs(productId: string): Promise<ConfigCatConfig[]> {
    const response = await fetch(`${this.baseUrl}/v1/products/${productId}/configs`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch configs: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all environments for a product
   */
  async getEnvironments(productId: string): Promise<ConfigCatEnvironment[]> {
    const response = await fetch(`${this.baseUrl}/v1/products/${productId}/environments`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch environments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all settings (feature flags) for a config
   */
  async getSettings(configId: string): Promise<ConfigCatSetting[]> {
    const response = await fetch(`${this.baseUrl}/v1/configs/${configId}/settings`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get setting value for a specific environment
   */
  async getSettingValue(environmentId: string, settingId: number): Promise<SettingValue> {
    const response = await fetch(
      `${this.baseUrl}/v1/environments/${environmentId}/settings/${settingId}/value`,
      {
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch setting value: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update setting value for a specific environment
   */
  async updateSettingValue(
    environmentId: string,
    settingId: number,
    value: boolean | string | number,
    reason?: string,
  ): Promise<SettingValue> {
    const response = await fetch(
      `${this.baseUrl}/v1/environments/${environmentId}/settings/${settingId}/value`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          rolloutRules: [],
          rolloutPercentageItems: [],
          value: value,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to update setting value: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new feature flag
   */
  async createSetting(
    configId: string,
    name: string,
    key: string,
    hint: string,
    settingType: 'boolean' | 'string' | 'int' | 'double',
  ): Promise<ConfigCatSetting> {
    const response = await fetch(`${this.baseUrl}/v1/configs/${configId}/settings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        key,
        hint,
        settingType,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to create setting: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a feature flag
   */
  async deleteSetting(settingId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/settings/${settingId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete setting: ${response.statusText}`);
    }
  }

  /**
   * Get all setting values for an environment (batch)
   */
  async getAllSettingValues(
    environmentId: string,
    settingIds: number[],
  ): Promise<Map<number, SettingValue>> {
    const values = new Map<number, SettingValue>();

    // Fetch in parallel but with some rate limiting
    const batchSize = 5;
    for (let i = 0; i < settingIds.length; i += batchSize) {
      const batch = settingIds.slice(i, i + batchSize);
      const promises = batch.map((id) =>
        this.getSettingValue(environmentId, id)
          .then((value) => ({ id, value }))
          .catch((error) => {
            console.error(`Failed to fetch setting ${id}:`, error);
            return null;
          }),
      );

      const results = await Promise.all(promises);
      results.forEach((result) => {
        if (result) {
          values.set(result.id, result.value);
        }
      });
    }

    return values;
  }
}

export const createConfigCatClient = (apiKey: string) => {
  return new ConfigCatManagementClient(apiKey);
};
