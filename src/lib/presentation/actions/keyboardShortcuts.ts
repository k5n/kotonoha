import type { MediaPlayer } from '$lib/application/usecases/mediaPlayer/mediaPlayer';
import type { SubtitleLine } from '$lib/domain/entities/subtitleLine';

interface KeyboardShortcutsParams {
  mediaPlayer?: MediaPlayer;
  subtitleLines: readonly SubtitleLine[];
}

function findCurrentSubtitleLineIndex(
  time: number,
  subtitleLines: readonly SubtitleLine[]
): number {
  if (subtitleLines.length === 0) {
    return -1;
  }

  let subtitleLineIndex = -1;
  for (let i = 0; i < subtitleLines.length; i++) {
    if (subtitleLines[i].startTimeMs <= time) {
      subtitleLineIndex = i;
    } else {
      break;
    }
  }
  return subtitleLineIndex;
}

export function keyboardShortcuts(node: HTMLElement, params: KeyboardShortcutsParams) {
  let { mediaPlayer, subtitleLines } = params;

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      mediaPlayer === undefined
    ) {
      return;
    }

    if (subtitleLines.length === 0) return;

    const currentSubtitleLineIndex = findCurrentSubtitleLineIndex(
      mediaPlayer.currentTime,
      subtitleLines
    );

    switch (event.key) {
      case 'a': {
        if (currentSubtitleLineIndex > 0) {
          const prevDialogue = subtitleLines[currentSubtitleLineIndex - 1];
          mediaPlayer.seek(prevDialogue.startTimeMs);
        } else {
          mediaPlayer.seek(0);
        }
        break;
      }
      case 's': {
        if (currentSubtitleLineIndex !== -1) {
          const currentDialogue = subtitleLines[currentSubtitleLineIndex];
          mediaPlayer.seek(currentDialogue.startTimeMs);
        }
        break;
      }
      case 'd': {
        if (currentSubtitleLineIndex < subtitleLines.length - 1) {
          const nextDialogue = subtitleLines[currentSubtitleLineIndex + 1];
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
        if (currentSubtitleLineIndex > 0) {
          const prevDialogue = subtitleLines[currentSubtitleLineIndex - 1];
          mediaPlayer.seek(prevDialogue.startTimeMs);
        } else {
          mediaPlayer.seek(0);
        }
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        mediaPlayer.pause();
        if (currentSubtitleLineIndex < subtitleLines.length - 1) {
          const nextDialogue = subtitleLines[currentSubtitleLineIndex + 1];
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
      subtitleLines = newParams.subtitleLines;
    },
    destroy() {
      window.removeEventListener('keydown', handleKeydown);
    },
  };
}
