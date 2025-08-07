import type { AppInfo } from '$lib/domain/entities/appInfo';
import { getVersion } from '@tauri-apps/api/app';

export const appInfoRepository = {
  async getAppInfo(): Promise<AppInfo> {
    const appVersion = await getVersion();
    return {
      appVersion,
    };
  },
};
