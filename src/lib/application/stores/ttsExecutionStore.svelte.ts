import type { TtsProgress } from '$lib/domain/entities/ttsEvent';

type ContextLine = {
  readonly text: string;
  readonly isCurrentLine: boolean;
};

let showModal = $state(false);
let progress = $state(0);
let currentLineText = $state('');
let contextLines = $state<readonly ContextLine[]>([]);
let lineHistory = $state<string[]>([]);
let isExecuting = $state(false);
let errorMessageKey = $state('');
let isCancelled = $state(false);

function openModal() {
  showModal = true;
  isExecuting = true;
  progress = 0;
  currentLineText = '';
  contextLines = [];
  lineHistory = [];
  errorMessageKey = '';
  isCancelled = false;
}

function closeModal() {
  showModal = false;
  isExecuting = false;
  progress = 0;
  currentLineText = '';
  contextLines = [];
  lineHistory = [];
  errorMessageKey = '';
}

function updateProgress(progressPayload: TtsProgress) {
  progress = progressPayload.progress;
  currentLineText = progressPayload.text;

  // Add current line to history if it's different from the last one
  const truncatedText = truncateText(progressPayload.text, 80);
  if (lineHistory.length === 0 || lineHistory[lineHistory.length - 1] !== truncatedText) {
    lineHistory = [...lineHistory, truncatedText];
  }

  // Keep only the last 3 lines for context
  const recentLines = lineHistory.slice(-3);

  // Build context lines (show up to 3 lines, with the last one being current)
  const newContextLines: ContextLine[] = recentLines.map((line, index) => ({
    text: line,
    isCurrentLine: index === recentLines.length - 1,
  }));

  contextLines = newContextLines;
}

function completeExecution() {
  isExecuting = false;
  showModal = false;
  progress = 100;
}

function failedExecution(key: string) {
  errorMessageKey = key;
  isExecuting = false;
}

function cancelExecution() {
  isCancelled = true;
  showModal = false;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

function reset() {
  showModal = false;
  isExecuting = false;
  progress = 0;
  currentLineText = '';
  contextLines = [];
  lineHistory = [];
  errorMessageKey = '';
  isCancelled = false;
}

export const ttsExecutionStore = {
  get showModal() {
    return showModal;
  },
  get progress() {
    return progress;
  },
  get currentLineText() {
    return currentLineText;
  },
  get contextLines() {
    return contextLines;
  },
  get isExecuting() {
    return isExecuting;
  },
  get errorMessageKey() {
    return errorMessageKey;
  },
  get isCancelled() {
    return isCancelled;
  },
  openModal,
  closeModal,
  updateProgress,
  completeExecution,
  failedExecution,
  cancelExecution,
  reset,
};
