import { environmentRepository } from './repositories/environmentRepository';

let cachedPrefix: string | null = null;

/**
 * Get the prefix according to your environment.
 * - Release environment: no prefix
 * - Development environment (PUBLIC_APP_ENV=dev): 'dev_'
 * - E2E test environment (PUBLIC_APP_ENV=e2e): 'e2e_'
 */
async function getEnvPrefix(): Promise<string> {
  if (cachedPrefix !== null) {
    return cachedPrefix;
  }
  cachedPrefix = await environmentRepository.getEnvPrefix();
  return cachedPrefix;
}

export async function getDatabasePath(): Promise<string> {
  const prefix = await getEnvPrefix();
  const dbName = `${prefix}app.db`;
  return 'sqlite:' + dbName;
}

export async function getMediaDir(): Promise<string> {
  const prefix = await getEnvPrefix();
  return `${prefix}media`;
}

export async function getSettingsFilename(): Promise<string> {
  const prefix = await getEnvPrefix();
  return `${prefix}settings.json`;
}

export async function getModelsDir(): Promise<string> {
  const prefix = await getEnvPrefix();
  return `${prefix}models`;
}
