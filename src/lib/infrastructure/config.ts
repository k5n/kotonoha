import { env } from '$env/dynamic/public';

const DEFAULT_APP_DB_NAME = 'app.db';
const DEFAULT_MEDIA_DIR = 'media';

export function getDatabasePath(): string {
  return 'sqlite:' + (env.PUBLIC_APP_DB_NAME || DEFAULT_APP_DB_NAME);
}

export function getMediaDir(): string {
  return env.PUBLIC_APP_MEDIA_DIR || DEFAULT_MEDIA_DIR;
}
