import { invoke } from '@tauri-apps/api/core';
import { error, info } from '@tauri-apps/plugin-log';

const maxLogTextLength = 50;

export const languageDetectionRepository = {
  async detectLanguage(text: string): Promise<string | null> {
    try {
      info(`Detecting language for text: ${text.substring(0, maxLogTextLength)}...`);
      const result = await invoke<string | null>('detect_language_from_text', { text });
      info(`Language detection result: ${result}`);
      return result;
    } catch (err) {
      error(`Language detection failed: ${err}`);
      return null;
    }
  },
};
