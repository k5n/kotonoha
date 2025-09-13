import type { audioPlayerStore } from '$lib/application/stores/audioPlayerStore.svelte';
import type { Dialogue } from '$lib/domain/entities/dialogue';

interface KeyboardShortcutsParams {
  store: typeof audioPlayerStore;
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
  let { store, dialogues } = params;

  function handleKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (dialogues.length === 0) return;

    const currentDialogueIndex = findCurrentDialogueIndex(store.currentTime, dialogues);

    switch (event.key) {
      case 'a': {
        if (currentDialogueIndex > 0) {
          const prevDialogue = dialogues[currentDialogueIndex - 1];
          store.seek(prevDialogue.startTimeMs);
        } else {
          store.seek(0);
        }
        break;
      }
      case 's': {
        if (currentDialogueIndex !== -1) {
          const currentDialogue = dialogues[currentDialogueIndex];
          store.seek(currentDialogue.startTimeMs);
        }
        break;
      }
      case 'd': {
        if (currentDialogueIndex < dialogues.length - 1) {
          const nextDialogue = dialogues[currentDialogueIndex + 1];
          store.seek(nextDialogue.startTimeMs);
        }
        break;
      }
      case ' ': {
        event.preventDefault();
        if (store.isPlaying) {
          store.pause();
        } else {
          if (store.hasStarted) {
            store.resume();
          } else {
            store.play();
          }
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        store.pause();
        if (currentDialogueIndex > 0) {
          const prevDialogue = dialogues[currentDialogueIndex - 1];
          store.seek(prevDialogue.startTimeMs);
        } else {
          store.seek(0);
        }
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        store.pause();
        if (currentDialogueIndex < dialogues.length - 1) {
          const nextDialogue = dialogues[currentDialogueIndex + 1];
          store.seek(nextDialogue.startTimeMs);
        }
        break;
      }
    }
  }

  window.addEventListener('keydown', handleKeydown);

  return {
    update(newParams: KeyboardShortcutsParams) {
      store = newParams.store;
      dialogues = newParams.dialogues;
    },
    destroy() {
      window.removeEventListener('keydown', handleKeydown);
    },
  };
}
