import * as configcat from 'configcat-node';

let configCatClient: configcat.IConfigCatClient | null = null;

export function getConfigCatClient(): configcat.IConfigCatClient {
  if (!configCatClient) {
    const sdkKey = process.env.CONFIGCAT_SDK_KEY;
    if (!sdkKey) {
      throw new Error('CONFIGCAT_SDK_KEY environment variable is not set');
    }

    configCatClient = configcat.getClient(sdkKey, configcat.PollingMode.AutoPoll, {
      // pollIntervalSeconds: 900,
      requestTimeoutMs: 10000,
    });
  }

  return configCatClient;
}

export async function getFeatureFlagValue<T extends string | number | boolean | null | undefined>(
  key: string,
  defaultValue: T,
  userObject?: configcat.User,
): Promise<T> {
  try {
    const client = getConfigCatClient();
    return (await client.getValueAsync(key, defaultValue, userObject)) as T;
  } catch (error) {
    console.error(`Failed to get feature flag '${key}' from ConfigCat:`, error);
    return defaultValue;
  }
}

export function disposeConfigCatClient(): void {
  if (configCatClient) {
    configCatClient.dispose();
    configCatClient = null;
  }
}

if (typeof process !== 'undefined') {
  process.on('exit', disposeConfigCatClient);
  process.on('SIGINT', disposeConfigCatClient);
  process.on('SIGTERM', disposeConfigCatClient);
}
