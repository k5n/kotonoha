import { fileBasedEpisodeAddStore } from '$lib/application/stores/FileBasedEpisodeAddStore.svelte';
import { ttsConfigStore } from '$lib/application/stores/ttsConfigStore.svelte';
import { ttsExecutionStore } from '$lib/application/stores/ttsExecutionStore.svelte';
import { extractScriptText } from '$lib/domain/services/extractScriptText';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import { assertNotNull } from '$lib/utils/assertion';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { tsvConfigStore } from '../stores/tsvConfigStore.svelte';

export type TtsTargetStore = {
  scriptFilePath: string | null;
  audioFilePath: string | null;
};

/**
 * Execute TTS generation with progress tracking
 * Gets script content from episodeAddStore and generates audio
 */
export async function executeTts(store: TtsTargetStore = fileBasedEpisodeAddStore): Promise<void> {
  let progressUnlisten: UnlistenFn | null = null;

  try {
    // Read script content from file
    const scriptFilePath = store.scriptFilePath;
    assertNotNull(scriptFilePath, 'Script file path must not be null');
    const fullText = await fileRepository.readTextFileByAbsolutePath(scriptFilePath);
    const extension = scriptFilePath.split('.').pop()?.toLowerCase() ?? '';
    const scriptContent = extractScriptText(fullText, extension, tsvConfigStore.tsvConfig);

    const selectedVoice = ttsConfigStore.selectedVoice;
    assertNotNull(selectedVoice, 'No voice selected for TTS');
    const selectedSpeakerId = parseInt(ttsConfigStore.selectedSpeakerId);

    // Open the modal and start execution
    ttsExecutionStore.openModal();
    console.info(
      `Starting TTS execution with voice: ${selectedVoice.name}, speaker: ${selectedSpeakerId}`
    );

    // Set up progress event listener
    progressUnlisten = await ttsRepository.listenTtsProgress((payload) => {
      ttsExecutionStore.updateProgress(payload);
    });

    // Start the TTS process and wait for completion
    const ttsResult = await ttsRepository.start(scriptContent, selectedVoice, selectedSpeakerId);
    console.info(
      `TTS completed successfully. Audio: ${ttsResult.audioPath}, Script: ${ttsResult.scriptPath}`
    );
    // NOTE: scriptFilePath setter clears audioFilePath, so assign script first then audio.
    store.scriptFilePath = ttsResult.scriptPath;
    store.audioFilePath = ttsResult.audioPath;
    ttsExecutionStore.completeExecution();
  } catch (err) {
    console.error(`Failed to execute TTS: ${err}`);
    if (!ttsExecutionStore.isCancelled) {
      ttsExecutionStore.failedExecution('components.ttsExecutionModal.error.failedToExecute');
    }
    throw err;
  } finally {
    // Clean up event listeners
    if (progressUnlisten) progressUnlisten();
  }
}

export async function cancelTtsExecution(): Promise<void> {
  console.info('TTS execution cancelled by user.');
  await ttsRepository.cancel();
  ttsExecutionStore.cancelExecution();
}
