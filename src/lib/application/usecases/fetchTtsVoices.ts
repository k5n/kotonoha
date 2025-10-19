import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import type { Voice } from '$lib/domain/entities/voice';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';
import { error, info } from '@tauri-apps/plugin-log';
import { detectScriptLanguage } from './detectScriptLanguage';

async function getAvailableVoices(): Promise<readonly Voice[]> {
  if (fileEpisodeAddStore.detectedLanguage === null) {
    const [_, voices] = await Promise.all([
      detectScriptLanguage(),
      ttsRepository.getAvailableVoices(),
    ]);
    return voices;
  } else {
    const voices = await ttsRepository.getAvailableVoices();
    return voices;
  }
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

    const voices = await getAvailableVoices();
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
      detectedLanguage: fileEpisodeAddStore.detectedLanguage,
      defaultVoices,
    });
    info(
      `Fetched ${filteredVoices.length} TTS voices, ${learningTargetVoices.length} match voices for learning target languages.`
    );
  } catch (err) {
    error(`Failed to fetch TTS voices: ${err}`);
    fileEpisodeAddStore.tts.failedVoicesFetching('components.ttsConfigSection.failedToLoad');
  }
  console.timeEnd('fetchTtsVoices');
}
