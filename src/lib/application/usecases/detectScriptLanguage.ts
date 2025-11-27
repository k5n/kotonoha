import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { extractScriptText } from '$lib/domain/services/extractScriptText';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { languageDetectionRepository } from '$lib/infrastructure/repositories/languageDetectionRepository';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { getSupportedLanguages } from '$lib/utils/language';

const MAX_TEXT_LENGTH = 1000;

export async function populateLearningTargetLanguages(): Promise<readonly string[]> {
  try {
    const settings = await settingsRepository.getSettings();
    if (settings.learningTargetLanguages && settings.learningTargetLanguages.length > 0) {
      return settings.learningTargetLanguages;
    } else {
      return getSupportedLanguages().map((l) => l.code);
    }
  } catch (e) {
    console.error(`Failed to load settings for learning target languages: ${e}`);
    return getSupportedLanguages().map((l) => l.code);
  }
}

export async function detectScriptLanguage(
  scriptFilePath: string,
  tsvConfig?: TsvConfig
): Promise<string | null> {
  console.info('Detecting script language...');

  const extension = scriptFilePath.split('.').pop()?.toLowerCase() ?? '';
  const fullText = await fileRepository.readTextFileByAbsolutePath(scriptFilePath);
  const text = extractScriptText(fullText, extension, tsvConfig);
  const truncated = text.substring(0, MAX_TEXT_LENGTH);

  const detected = await languageDetectionRepository.detectLanguage(truncated);
  console.info(`Detected language: ${detected}`);
  return detected;
}
