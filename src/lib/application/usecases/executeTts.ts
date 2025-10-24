import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
import { ttsExecutionStore } from '$lib/application/stores/episodeAddStore/ttsExecutionStore.svelte';
import { extractScriptText } from '$lib/domain/services/extractScriptText';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { tsvConfigStore } from '../stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte';

/**
 * Execute TTS generation with progress tracking
 * Gets script content from episodeAddStore and generates audio
 */
export async function executeTts(): Promise<void> {
  let progressUnlisten: UnlistenFn | null = null;

  try {
    // Read script content from file
    const scriptFilePath = fileEpisodeAddStore.scriptFilePath;
    if (!scriptFilePath) {
      throw new Error('Script file path is not set (this must not happen)');
    }
    const fullText = await fileRepository.readTextFileByAbsolutePath(scriptFilePath);
    const extension = scriptFilePath.split('.').pop()?.toLowerCase() ?? '';
    const scriptContent = extractScriptText(fullText, extension, tsvConfigStore.tsvConfig);

    // Get voice and speaker information from the store
    const selectedVoice = ttsConfigStore.selectedVoice;
    const selectedSpeakerId = parseInt(ttsConfigStore.selectedSpeakerId);

    if (!selectedVoice) {
      throw new Error('No voice selected for TTS');
    }

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
    fileEpisodeAddStore.audioFilePath = ttsResult.audioPath;
    fileEpisodeAddStore.scriptFilePath = ttsResult.scriptPath;
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
