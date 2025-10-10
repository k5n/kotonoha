import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import type { Voice } from '$lib/domain/entities/voice';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';

/**
 * Fetches available TTS voices filtered by Gemini-supported languages
 * and updates the episode add store with the results.
 */
export async function fetchTtsVoices(): Promise<void> {
  console.time('fetchTtsVoices');
  try {
    fileEpisodeAddStore.tts.startVoicesFetching();
    const voices = await ttsRepository.getAvailableVoices();
    const supportedLanguageCodes = getSupportedLanguages().map((lang) => lang.code);
    const filteredVoices: Voice[] = voices.voices.filter((voice) => {
      return supportedLanguageCodes.includes(voice.language.family);
    });

    const settings = await settingsRepository.getSettings();
    const learningTargetVoices: Voice[] =
      settings.learningTargetLanguages.length > 0
        ? filteredVoices.filter((voice) =>
            settings.learningTargetLanguages.includes(voice.language.family)
          )
        : filteredVoices;

    fileEpisodeAddStore.tts.completeVoicesFetching(
      {
        baseUrl: voices.baseUrl,
        voices: filteredVoices,
      },
      {
        baseUrl: voices.baseUrl,
        voices: learningTargetVoices,
      }
    );
  } catch (error) {
    // FIXME: i18n
    fileEpisodeAddStore.tts.failedVoicesFetching(
      error instanceof Error ? error.message : 'Failed to fetch TTS voices'
    );
  }
  console.timeEnd('fetchTtsVoices');
}
