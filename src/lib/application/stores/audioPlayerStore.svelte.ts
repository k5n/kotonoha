import {
  listenPlaybackPosition,
  pauseAudio,
  playAudio,
  resumeAudio,
  seekAudio,
  stopAudio,
} from '../usecases/controlAudio';

function createAudioPlayerStore() {
  let unlisten: (() => void) | undefined;

  const store = $state({
    isPlaying: false,
    hasStarted: false,
    currentTime: 0,
  });

  async function init() {
    unlisten = await listenPlaybackPosition((positionMs) => {
      store.currentTime = positionMs;
    });
  }

  function destroy() {
    if (unlisten) {
      unlisten();
    }
    stop();
  }

  async function play() {
    await playAudio();
    store.isPlaying = true;
    store.hasStarted = true;
  }

  async function pause() {
    await pauseAudio();
    store.isPlaying = false;
  }

  async function resume() {
    await resumeAudio();
    store.isPlaying = true;
  }

  function stop() {
    stopAudio();
    store.currentTime = 0;
    store.isPlaying = false;
    store.hasStarted = false;
  }

  function seek(time: number) {
    seekAudio(time);
  }

  return {
    get isPlaying() {
      return store.isPlaying;
    },
    get hasStarted() {
      return store.hasStarted;
    },
    get currentTime() {
      return store.currentTime;
    },
    init,
    destroy,
    play,
    pause,
    resume,
    stop,
    seek,
  };
}

export const audioPlayerStore = createAudioPlayerStore();
