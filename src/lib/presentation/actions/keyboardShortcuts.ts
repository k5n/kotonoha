import type { MediaPlayer } from '$lib/application/usecases/mediaPlayer/mediaPlayer';
import type { Dialogue } from '$lib/domain/entities/dialogue';

interface KeyboardShortcutsParams {
  mediaPlayer?: MediaPlayer;
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
  let { mediaPlayer, dialogues } = params;

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      mediaPlayer === undefined
    ) {
      return;
    }

    if (dialogues.length === 0) return;

    const currentDialogueIndex = findCurrentDialogueIndex(mediaPlayer.currentTime, dialogues);

    switch (event.key) {
      case 'a': {
        if (currentDialogueIndex > 0) {
          const prevDialogue = dialogues[currentDialogueIndex - 1];
          mediaPlayer.seek(prevDialogue.startTimeMs);
        } else {
          mediaPlayer.seek(0);
        }
        break;
      }
      case 's': {
        if (currentDialogueIndex !== -1) {
          const currentDialogue = dialogues[currentDialogueIndex];
          mediaPlayer.seek(currentDialogue.startTimeMs);
        }
        break;
      }
      case 'd': {
        if (currentDialogueIndex < dialogues.length - 1) {
          const nextDialogue = dialogues[currentDialogueIndex + 1];
          mediaPlayer.seek(nextDialogue.startTimeMs);
        }
        break;
      }
      case ' ': {
        event.preventDefault();
        if (mediaPlayer.isPlaying) {
          mediaPlayer.pause();
        } else {
          if (mediaPlayer.hasStarted) {
            mediaPlayer.resume();
          } else {
            mediaPlayer.play();
          }
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        mediaPlayer.pause();
        if (currentDialogueIndex > 0) {
          const prevDialogue = dialogues[currentDialogueIndex - 1];
          mediaPlayer.seek(prevDialogue.startTimeMs);
        } else {
          mediaPlayer.seek(0);
        }
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        mediaPlayer.pause();
        if (currentDialogueIndex < dialogues.length - 1) {
          const nextDialogue = dialogues[currentDialogueIndex + 1];
          mediaPlayer.seek(nextDialogue.startTimeMs);
        }
        break;
      }
    }
  }

  window.addEventListener('keydown', handleKeydown);

  return {
    update(newParams: KeyboardShortcutsParams) {
      mediaPlayer = newParams.mediaPlayer;
      dialogues = newParams.dialogues;
    },
    destroy() {
      window.removeEventListener('keydown', handleKeydown);
    },
  };
}
