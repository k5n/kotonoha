import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { tsvConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { parseScriptToDialogues } from '$lib/domain/services/parseScriptToDialogues';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { languageDetectionRepository } from '$lib/infrastructure/repositories/languageDetectionRepository';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { getSupportedLanguages } from '$lib/utils/language';
import { error, info } from '@tauri-apps/plugin-log';

const MAX_TEXT_LENGTH = 1000;

function extractTextFromScript(fullText: string, extension: string, tsvConfig: TsvConfig): string {
  if (extension === 'txt') return fullText;
  const { dialogues } = parseScriptToDialogues(fullText, extension, 0, tsvConfig);
  return dialogues.map((d) => d.originalText).join('\n');
}

async function populateLearningTargetLanguages(): Promise<readonly string[]> {
  try {
    const settings = await settingsRepository.getSettings();
    if (settings.learningTargetLanguages && settings.learningTargetLanguages.length > 0) {
      return settings.learningTargetLanguages;
    } else {
      return getSupportedLanguages().map((l) => l.code);
    }
  } catch (e) {
    error(`Failed to load settings for learning target languages: ${e}`);
    return getSupportedLanguages().map((l) => l.code);
  }
}

/**
 * Detects the language of the currently selected script file and stores
 * the result into `fileEpisodeAddStore.detectedLanguage` and populates
 * `fileEpisodeAddStore.learningTargetLanguages` from settings (or fallback).
 */
export async function detectScriptLanguage(): Promise<void> {
  info('Detecting script language...');
  // Even if the detection fails, we want to set the learning target language list, so get it first
  const supportedLanguages = await populateLearningTargetLanguages();

  const scriptFilePath = fileEpisodeAddStore.scriptFilePath;
  if (!scriptFilePath) {
    fileEpisodeAddStore.failedLanguageDetection(
      'components.fileEpisodeForm.errorScriptFileRequired',
      supportedLanguages
    );
    return;
  }

  try {
    const extension = scriptFilePath.split('.').pop()?.toLowerCase() ?? '';
    const fullText = await fileRepository.readTextFileByAbsolutePath(scriptFilePath);
    const text = extractTextFromScript(fullText, extension, tsvConfigStore.tsvConfig);
    const truncated = text.substring(0, MAX_TEXT_LENGTH);

    const detected = await languageDetectionRepository.detectLanguage(truncated);
    info(`Detected language: ${detected}`);
    fileEpisodeAddStore.completeLanguageDetection(detected, supportedLanguages);
  } catch (err) {
    error(`Language detection failed: ${err}`);
    fileEpisodeAddStore.failedLanguageDetection(
      'components.fileEpisodeForm.errorDetectLanguage',
      supportedLanguages
    );
  }
}
