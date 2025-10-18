import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { tsvConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import type { Voice } from '$lib/domain/entities/voice';
import { parseScriptToDialogues } from '$lib/domain/services/parseScriptToDialogues';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { languageDetectionRepository } from '$lib/infrastructure/repositories/languageDetectionRepository';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';
import { error, info } from '@tauri-apps/plugin-log';

const MAX_TEXT_LENGTH = 1000;

function parseScript(fullText: string, extension: string, tsvConfig: TsvConfig): string {
  const { dialogues } = parseScriptToDialogues(fullText, extension, 0, tsvConfig);
  return dialogues.map((d) => d.originalText).join('\n');
}

async function detectLanguage(filePath: string, tsvConfig: TsvConfig): Promise<string | null> {
  const extension = filePath.split('.').pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  const fullText = await fileRepository.readTextFileByAbsolutePath(filePath);

  const text = extension === 'txt' ? fullText : parseScript(fullText, extension, tsvConfig);

  const truncatedText = text.substring(0, MAX_TEXT_LENGTH);
  return languageDetectionRepository.detectLanguage(truncatedText);
}

/**
 * Fetches available TTS voices filtered by Gemini-supported languages
 * and updates the episode add store with the results.
 */
export async function fetchTtsVoices(): Promise<void> {
  info('Fetching TTS voices...');
  if (fileEpisodeAddStore.tts.isFetchingVoices) {
    console.warn('TTS voices are already being fetched. Skipping duplicate request.');
    return;
  }
  if (fileEpisodeAddStore.tts.learningTargetVoices) {
    console.log('TTS voices are already fetched. Skipping.');
    return;
  }
  const scriptFilePath = fileEpisodeAddStore.scriptFilePath;
  if (!scriptFilePath) {
    console.error('Script file path is not set. This must not happen.');
    return;
  }

  console.time('fetchTtsVoices');

  try {
    fileEpisodeAddStore.tts.startVoicesFetching();

    const [detectedLanguage, voices] = await Promise.all([
      detectLanguage(scriptFilePath, tsvConfigStore.tsvConfig),
      ttsRepository.getAvailableVoices(),
    ]);
    const supportedLanguageCodes = getSupportedLanguages().map((lang) => lang.code);
    const filteredVoices: Voice[] = voices.filter((voice) => {
      return supportedLanguageCodes.includes(voice.language.family);
    });

    const defaultVoices = ttsRepository.getDefaultVoices();

    const settings = await settingsRepository.getSettings();
    const learningTargetVoices: Voice[] =
      settings.learningTargetLanguages.length > 0
        ? filteredVoices.filter((voice) =>
            settings.learningTargetLanguages.includes(voice.language.family)
          )
        : filteredVoices;

    fileEpisodeAddStore.tts.completeVoicesFetching({
      allVoices: filteredVoices,
      learningTargetVoices: learningTargetVoices,
      detectedLanguage,
      defaultVoices,
    });
    info(
      `Fetched ${filteredVoices.length} TTS voices, ${learningTargetVoices.length} match voices for learning target languages and detected language is ${detectedLanguage}.`
    );
  } catch (err) {
    error(`Failed to fetch TTS voices: ${err}`);
    fileEpisodeAddStore.tts.failedVoicesFetching('components.ttsConfigSection.failedToLoad');
  }
  console.timeEnd('fetchTtsVoices');
}
