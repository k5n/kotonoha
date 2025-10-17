import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
import { ttsExecutionStore } from '$lib/application/stores/episodeAddStore/ttsExecutionStore.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { parseScriptToDialogues } from '$lib/domain/services/parseScriptToDialogues';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { error, info } from '@tauri-apps/plugin-log';
import { tsvConfigStore } from '../stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte';

function parseScript(fullText: string, extension: string, tsvConfig: TsvConfig): string {
  const { dialogues } = parseScriptToDialogues(fullText, extension, 0, tsvConfig);
  return dialogues.map((d) => d.originalText).join('\n');
}

async function readText(filePath: string, tsvConfig: TsvConfig): Promise<string> {
  const fullText = await fileRepository.readTextFileByAbsolutePath(filePath);
  return parseScript(fullText, filePath.split('.').pop() || '', tsvConfig);
}

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
    const scriptContent = await readText(scriptFilePath, tsvConfigStore.tsvConfig);

    // Get voice and speaker information from the store
    const selectedVoice = ttsConfigStore.selectedVoice;
    const selectedSpeakerId = parseInt(ttsConfigStore.selectedSpeakerId);

    if (!selectedVoice) {
      throw new Error('No voice selected for TTS');
    }

    // Open the modal and start execution
    ttsExecutionStore.openModal();
    info(`Starting TTS execution with voice: ${selectedVoice.name}, speaker: ${selectedSpeakerId}`);

    // Set up progress event listener
    progressUnlisten = await ttsRepository.listenTtsProgress((payload) => {
      info(`TTS progress: ${payload.progress}% - ${payload.text}`);
      ttsExecutionStore.updateProgress(payload);
    });

    // Start the TTS process and wait for completion
    const ttsResult = await ttsRepository.start(scriptContent, selectedVoice, selectedSpeakerId);
    info(
      `TTS completed successfully. Audio: ${ttsResult.audioPath}, Script: ${ttsResult.scriptPath}`
    );
    fileEpisodeAddStore.audioFilePath = ttsResult.audioPath;
    fileEpisodeAddStore.scriptFilePath = ttsResult.scriptPath;
    ttsExecutionStore.completeExecution();
  } catch (err) {
    error(`Failed to execute TTS: ${err}`);
    if (ttsExecutionStore.isCancelled) {
      ttsExecutionStore.failedExecution('components.ttsExecutionModal.error.cancelled');
    } else {
      ttsExecutionStore.failedExecution('components.ttsExecutionModal.error.failedToExecute');
    }
  } finally {
    // Clean up event listeners
    if (progressUnlisten) progressUnlisten();
  }
}

export async function cancelTtsExecution(): Promise<void> {
  info('TTS execution cancelled by user.');
  ttsExecutionStore.cancelExecution();
  await ttsRepository.cancel();
}
