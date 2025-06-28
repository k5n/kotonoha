import { PUBLIC_APP_DB_NAME } from '$env/static/public';

const DEFAULT_APP_DB_NAME = 'app.db';

export function getDatabasePath(): string {
  return 'sqlite:' + (PUBLIC_APP_DB_NAME || DEFAULT_APP_DB_NAME);
}
