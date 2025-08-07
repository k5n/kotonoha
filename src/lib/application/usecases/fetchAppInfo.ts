import type { AppInfo } from '$lib/domain/entities/appInfo';
import { appInfoRepository } from '$lib/infrastructure/repositories/appInfoRepository';

export async function fetchAppInfo(): Promise<AppInfo> {
  return appInfoRepository.getAppInfo();
}
