let isReady = $state(false);
let isPlaying = $state(false);
let hasStarted = $state(false);
let currentTime = $state(0);

export const mediaPlayerStore = {
  get isReady() {
    return isReady;
  },
  set isReady(ready: boolean) {
    isReady = ready;
  },

  get isPlaying() {
    return isPlaying;
  },

  get hasStarted() {
    return hasStarted;
  },

  get currentTime() {
    return currentTime;
  },
  set currentTime(time: number) {
    currentTime = time;
  },

  async play() {
    isPlaying = true;
    hasStarted = true;
  },

  async pause() {
    isPlaying = false;
  },

  async resume() {
    isPlaying = true;
  },

  stop() {
    currentTime = 0;
    isPlaying = false;
    hasStarted = false;
  },
};
