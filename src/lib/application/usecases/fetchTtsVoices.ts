import type { DefaultVoices, Voice } from '$lib/domain/entities/voice';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { getSupportedLanguages } from '$lib/utils/language';

export type FetchTtsVoicesResult = {
  readonly allVoices: readonly Voice[];
  readonly learningTargetVoices: readonly Voice[];
  readonly defaultVoices: DefaultVoices;
};

/**
 * Fetches available TTS voices filtered by Gemini-supported languages
 * and returns both all voices and learning-target voices.
 */
export async function fetchTtsVoices(): Promise<FetchTtsVoicesResult> {
  console.info('Fetching TTS voices...');
  console.time('fetchTtsVoices');

  try {
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

    console.info(
      `Fetched ${filteredVoices.length} TTS voices, ${learningTargetVoices.length} match voices for learning target languages.`
    );

    return {
      allVoices: filteredVoices,
      learningTargetVoices,
      defaultVoices,
    };
  } catch (err) {
    console.error(`Failed to fetch TTS voices: ${err}`);
    throw err;
  } finally {
    console.timeEnd('fetchTtsVoices');
  }
}
