import { ttsConfigStore } from '$lib/application/stores/ttsConfigStore.svelte';
import type { Voice } from '$lib/domain/entities/voice';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';
import { fileBasedEpisodeAddStore } from '../stores/FileBasedEpisodeAddStore.svelte';

/**
 * Fetches available TTS voices filtered by Gemini-supported languages
 * and updates the episode add store with the results.
 */
export async function fetchTtsVoices(): Promise<void> {
  console.info('Fetching TTS voices...');
  if (ttsConfigStore.isFetchingVoices) {
    console.warn('TTS voices are already being fetched. Skipping duplicate request.');
    return;
  }
  if (ttsConfigStore.allVoices) {
    console.log('TTS voices are already fetched. Skipping.');
    return;
  }
  console.time('fetchTtsVoices');

  try {
    ttsConfigStore.startVoicesFetching();

    const voices = await ttsRepository.getAvailableVoices();
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

    ttsConfigStore.setVoiceData({
      allVoices: filteredVoices,
      learningTargetVoices: learningTargetVoices,
      defaultVoices,
    });

    // Trigger validation for the currently selected language
    ttsConfigStore.setLanguage(fileBasedEpisodeAddStore.selectedStudyLanguage);

    console.info(
      `Fetched ${filteredVoices.length} TTS voices, ${learningTargetVoices.length} match voices for learning target languages.`
    );
  } catch (err) {
    console.error(`Failed to fetch TTS voices: ${err}`);
    ttsConfigStore.setError('components.ttsConfigSection.failedToLoad');
  }
  console.timeEnd('fetchTtsVoices');
}
