import { cancelTtsExecution, executeTts } from '$lib/application/usecases/executeTts';
import type { TtsProgress } from '$lib/domain/entities/ttsEvent';
import type { Voice } from '$lib/domain/entities/voice';

export type TtsContextLine = {
  readonly text: string;
  readonly isCurrentLine: boolean;
};

export type TtsExecutionResult = { audioPath: string; scriptPath: string };

export type TtsExecutionController = {
  readonly open: boolean;
  readonly progress: number;
  readonly contextLines: readonly TtsContextLine[];
  readonly isExecuting: boolean;
  readonly isCancelled: boolean;
  readonly errorMessageKey: string;
  start: (scriptFilePath: string, voice: Voice, speakerId: number) => Promise<TtsExecutionResult>;
  cancel: () => Promise<void>;
  close: () => void;
  reset: () => void;
};

const MAX_CONTEXT_LINES = 3;
const MAX_TEXT_LENGTH = 80;

export function createTtsExecutionController(): TtsExecutionController {
  let open = $state(false);
  let progress = $state(0);
  let contextLines = $state<readonly TtsContextLine[]>([]);
  let lineHistory = $state<string[]>([]);
  let isExecuting = $state(false);
  let errorMessageKey = $state('');
  let isCancelled = $state(false);

  function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  function openModal() {
    open = true;
    isExecuting = true;
    progress = 0;
    contextLines = [];
    lineHistory = [];
    errorMessageKey = '';
    isCancelled = false;
  }

  function closeModal() {
    open = false;
    isExecuting = false;
    progress = 0;
    contextLines = [];
    lineHistory = [];
    errorMessageKey = '';
  }

  function updateProgress(payload: TtsProgress) {
    progress = payload.progress;

    const truncatedText = truncate(payload.text, MAX_TEXT_LENGTH);
    if (lineHistory.length === 0 || lineHistory[lineHistory.length - 1] !== truncatedText) {
      lineHistory = [...lineHistory, truncatedText];
    }

    const recentLines = lineHistory.slice(-MAX_CONTEXT_LINES);
    contextLines = recentLines.map((line, index) => ({
      text: line,
      isCurrentLine: index === recentLines.length - 1,
    }));
  }

  function complete() {
    isExecuting = false;
    open = false;
    progress = 100;
  }

  function fail(messageKey: string) {
    errorMessageKey = messageKey;
    isExecuting = false;
  }

  async function start(
    scriptFilePath: string,
    voice: Voice,
    speakerId: number
  ): Promise<TtsExecutionResult> {
    openModal();
    try {
      const result = await executeTts(scriptFilePath, voice, speakerId, updateProgress);
      complete();
      return result;
    } catch (error) {
      console.error('Failed to execute TTS:', error);
      if (!isCancelled) {
        fail('components.ttsExecutionModal.error.failedToExecute');
      }
      throw error;
    }
  }

  async function cancel(): Promise<void> {
    await cancelTtsExecution();
    isCancelled = true;
    isExecuting = false;
    open = false;
  }

  function reset() {
    closeModal();
    isCancelled = false;
  }

  return {
    get open() {
      return open;
    },
    get progress() {
      return progress;
    },
    get contextLines() {
      return contextLines;
    },
    get isExecuting() {
      return isExecuting;
    },
    get isCancelled() {
      return isCancelled;
    },
    get errorMessageKey() {
      return errorMessageKey;
    },
    start,
    cancel,
    close: closeModal,
    reset,
  };
}
