import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
import { ttsEpisodeAddStore } from '$lib/application/stores/episodeAddStore/ttsEpisodeAddStore/ttsEpisodeAddStore.svelte';
import type { Voice } from '$lib/domain/entities/voice';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';
import { detectScriptLanguage, type LanguageDetectionStore } from './detectScriptLanguage';

type TtsVoiceStore = LanguageDetectionStore & {
  readonly detectedLanguage: string | null;
  readonly selectedStudyLanguage: string | null;
};

async function getAvailableVoices(store: TtsVoiceStore): Promise<readonly Voice[]> {
  if (store.detectedLanguage === null) {
    const [_, voices] = await Promise.all([
      detectScriptLanguage(store),
      ttsRepository.getAvailableVoices(),
    ]);
    return voices;
  }

  return ttsRepository.getAvailableVoices();
}

/**
 * Fetches available TTS voices filtered by Gemini-supported languages
 * and updates the episode add store with the results.
 */
export async function fetchTtsVoices(store: TtsVoiceStore = ttsEpisodeAddStore): Promise<void> {
  console.info('Fetching TTS voices...');
  if (ttsConfigStore.isFetchingVoices) {
    console.warn('TTS voices are already being fetched. Skipping duplicate request.');
    return;
  }
  if (ttsConfigStore.allVoices) {
    console.log('TTS voices are already fetched. Skipping.');
    return;
  }
  const scriptFilePath = store.scriptFilePath;
  if (!scriptFilePath) {
    console.error('Script file path is not set. This must not happen.');
    return;
  }

  console.time('fetchTtsVoices');

  try {
    ttsConfigStore.startVoicesFetching();

    const voices = await getAvailableVoices(store);
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
    ttsConfigStore.setLanguage(store.selectedStudyLanguage);

    console.info(
      `Fetched ${filteredVoices.length} TTS voices, ${learningTargetVoices.length} match voices for learning target languages.`
    );
  } catch (err) {
    console.error(`Failed to fetch TTS voices: ${err}`);
    ttsConfigStore.setError('components.ttsConfigSection.failedToLoad');
  }
  console.timeEnd('fetchTtsVoices');
}
