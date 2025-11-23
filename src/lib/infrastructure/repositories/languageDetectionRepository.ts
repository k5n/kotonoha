import { invoke } from '@tauri-apps/api/core';

const maxLogTextLength = 50;

export const languageDetectionRepository = {
  async detectLanguage(text: string): Promise<string | null> {
    console.info(`Detecting language for text: ${text.substring(0, maxLogTextLength)}...`);
    const result = await invoke<string | null>('detect_language_from_text', { text });
    console.info(`Language detection result: ${result}`);
    return result;
  },
};
