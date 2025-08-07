import type { AppInfo } from '$lib/domain/entities/appInfo';
import { getVersion } from '@tauri-apps/api/app';

const APP_NAME = 'Kotonoha';
const APP_COPYRIGHT = 'Copyright (C) 2025  Keigo Nakatani (https://github.com/k5n)';
const APP_LICENSE = 'GNU General Public License v3.0';
const APP_HOMEPAGE = 'https://github.com/k5n/kotonoha';

export const appInfoRepository = {
  async getAppInfo(): Promise<AppInfo> {
    const version = await getVersion();
    return {
      name: APP_NAME,
      version: version,
      copyright: APP_COPYRIGHT,
      license: APP_LICENSE,
      homepage: APP_HOMEPAGE,
    };
  },
};
