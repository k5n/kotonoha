import type { Dialogue } from '$lib/domain/entities/dialogue';

interface KeyboardShortcutsParams {
  isPlaying: boolean;
  hasStarted: boolean;
  currentTime: number;
  onPause: () => void;
  onPlay: () => void;
  onResume: () => void;
  onSeek: (time: number) => void;
  dialogues: readonly Dialogue[];
}

function findCurrentDialogueIndex(time: number, dialogues: readonly Dialogue[]): number {
  if (dialogues.length === 0) {
    return -1;
  }

  let dialogueIndex = -1;
  for (let i = 0; i < dialogues.length; i++) {
    if (dialogues[i].startTimeMs <= time) {
      dialogueIndex = i;
    } else {
      break;
    }
  }
  return dialogueIndex;
}

export function keyboardShortcuts(node: HTMLElement, params: KeyboardShortcutsParams) {
  let { isPlaying, hasStarted, currentTime, onPause, onPlay, onResume, onSeek, dialogues } = params;

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return;
    }

    if (dialogues.length === 0) return;

    const currentDialogueIndex = findCurrentDialogueIndex(currentTime, dialogues);

    switch (event.key) {
      case 'a': {
        if (currentDialogueIndex > 0) {
          const prevDialogue = dialogues[currentDialogueIndex - 1];
          onSeek(prevDialogue.startTimeMs);
        } else {
          onSeek(0);
        }
        break;
      }
      case 's': {
        if (currentDialogueIndex !== -1) {
          const currentDialogue = dialogues[currentDialogueIndex];
          onSeek(currentDialogue.startTimeMs);
        }
        break;
      }
      case 'd': {
        if (currentDialogueIndex < dialogues.length - 1) {
          const nextDialogue = dialogues[currentDialogueIndex + 1];
          onSeek(nextDialogue.startTimeMs);
        }
        break;
      }
      case ' ': {
        event.preventDefault();
        if (isPlaying) {
          onPause();
        } else {
          if (hasStarted) {
            onResume();
          } else {
            onPlay();
          }
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        onPause();
        if (currentDialogueIndex > 0) {
          const prevDialogue = dialogues[currentDialogueIndex - 1];
          onSeek(prevDialogue.startTimeMs);
        } else {
          onSeek(0);
        }
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        onPause();
        if (currentDialogueIndex < dialogues.length - 1) {
          const nextDialogue = dialogues[currentDialogueIndex + 1];
          onSeek(nextDialogue.startTimeMs);
        }
        break;
      }
    }
  }

  window.addEventListener('keydown', handleKeydown);

  return {
    update(newParams: KeyboardShortcutsParams) {
      isPlaying = newParams.isPlaying;
      hasStarted = newParams.hasStarted;
      currentTime = newParams.currentTime;
      onPause = newParams.onPause;
      onPlay = newParams.onPlay;
      onResume = newParams.onResume;
      onSeek = newParams.onSeek;
      dialogues = newParams.dialogues;
    },
    destroy() {
      window.removeEventListener('keydown', handleKeydown);
    },
  };
}
