import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import type { TtsProgress } from '$lib/domain/entities/ttsEvent';
import type { TtsResult } from '$lib/domain/entities/ttsResult';
import type { Voice } from '$lib/domain/entities/voice';
import { extractScriptText } from '$lib/domain/services/extractScriptText';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';
import type { UnlistenFn } from '@tauri-apps/api/event';

export type TtsTargetStore = {
  scriptFilePath: string | null;
  audioFilePath: string | null;
};

/**
 * Execute TTS generation with progress tracking
 */
export async function executeTts(
  scriptFilePath: string,
  selectedVoice: Voice,
  selectedSpeakerId: number,
  tsvConfig: TsvConfig,
  updateProgress: (progress: TtsProgress) => void
): Promise<TtsResult> {
  let progressUnlisten: UnlistenFn | null = null;

  try {
    const fullText = await fileRepository.readTextFileByAbsolutePath(scriptFilePath);
    const extension = scriptFilePath.split('.').pop()?.toLowerCase() ?? '';
    const scriptContent = extractScriptText(fullText, extension, tsvConfig);
    console.info(
      `Starting TTS execution with voice: ${selectedVoice.name}, speaker: ${selectedSpeakerId}`
    );

    progressUnlisten = await ttsRepository.listenTtsProgress(updateProgress);

    const ttsResult = await ttsRepository.start(scriptContent, selectedVoice, selectedSpeakerId);
    console.info(
      `TTS completed successfully. Audio: ${ttsResult.audioPath}, Script: ${ttsResult.scriptPath}`
    );
    return ttsResult;
  } finally {
    if (progressUnlisten) progressUnlisten();
  }
}

export async function cancelTtsExecution(): Promise<void> {
  console.info('TTS execution cancelled by user.');
  await ttsRepository.cancel();
}
