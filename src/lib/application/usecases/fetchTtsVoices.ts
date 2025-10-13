import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import type { Voice } from '$lib/domain/entities/voice';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { languageDetectionRepository } from '$lib/infrastructure/repositories/languageDetectionRepository';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';
import { info } from '@tauri-apps/plugin-log';

const MAX_TEXT_LENGTH = 1000;

async function detectLanguage(filePath: string): Promise<string | null> {
  const fullText = await fileRepository.readTextFileByAbsolutePath(filePath);
  // TODO: タイムスタンプ付きフォーマットにも対応する。テキスト部分だけ利用。
  const text = fullText.substring(0, MAX_TEXT_LENGTH);
  return languageDetectionRepository.detectLanguage(text);
}

/**
 * Fetches available TTS voices filtered by Gemini-supported languages
 * and updates the episode add store with the results.
 */
export async function fetchTtsVoices(): Promise<void> {
  info('Fetching TTS voices...');
  console.time('fetchTtsVoices');
  const scriptFilePath = fileEpisodeAddStore.scriptFilePath;
  if (!scriptFilePath) {
    console.error('Script file path is not set. This must not happen.');
    return;
  }
  if (fileEpisodeAddStore.tts.isFetchingVoices) {
    console.warn('TTS voices are already being fetched. Skipping duplicate request.');
    return;
  }
  if (fileEpisodeAddStore.tts.learningTargetVoices) {
    console.log('TTS voices are already fetched. Skipping.');
    return;
  }

  try {
    fileEpisodeAddStore.tts.startVoicesFetching();

    // FIXME: detectLanguage と getAvailableVoices を並列化
    const detectedLanguage = await detectLanguage(scriptFilePath);

    const voices = await ttsRepository.getAvailableVoices();
    const supportedLanguageCodes = getSupportedLanguages().map((lang) => lang.code);
    const filteredVoices: Voice[] = voices.voices.filter((voice) => {
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
      allVoices: {
        baseUrl: voices.baseUrl,
        voices: filteredVoices,
      },
      learningTargetVoices: {
        baseUrl: voices.baseUrl,
        voices: learningTargetVoices,
      },
      detectedLanguage,
      defaultVoices,
    });
    info(
      `Fetched ${filteredVoices.length} TTS voices, ${learningTargetVoices.length} match voices for learning target languages and detected language is ${detectedLanguage}.`
    );
  } catch (error) {
    // FIXME: i18n
    fileEpisodeAddStore.tts.failedVoicesFetching(
      error instanceof Error ? error.message : 'Failed to fetch TTS voices'
    );
  }
  console.timeEnd('fetchTtsVoices');
}
