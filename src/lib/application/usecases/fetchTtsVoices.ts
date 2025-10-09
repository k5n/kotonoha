import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore.svelte';
import type { Voice } from '$lib/domain/entities/voice';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';

/**
 * Fetches available TTS voices filtered by Gemini-supported languages
 * and updates the episode add store with the results.
 */
export async function fetchTtsVoices(): Promise<void> {
  try {
    fileEpisodeAddStore.startTtsVoicesFetching();
    const voices = await ttsRepository.getAvailableVoices();
    const supportedLanguageCodes = getSupportedLanguages().map((lang) => lang.code);
    const filteredVoices: Voice[] = voices.voices.filter((voice) => {
      return supportedLanguageCodes.includes(voice.language.family);
    });

    fileEpisodeAddStore.completeTtsVoicesFetching({
      baseUrl: voices.baseUrl,
      voices: filteredVoices,
    });
  } catch (error) {
    // FIXME: i18n
    fileEpisodeAddStore.failedTtsVoicesFetching(
      error instanceof Error ? error.message : 'Failed to fetch TTS voices'
    );
  }
}
