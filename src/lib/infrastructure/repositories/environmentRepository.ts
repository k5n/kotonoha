import { invoke } from '@tauri-apps/api/core';

export const environmentRepository = {
  async getEnvPrefix(): Promise<string> {
    return await invoke<string>('get_env_prefix_command');
  },
};
