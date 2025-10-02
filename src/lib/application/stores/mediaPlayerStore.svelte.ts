const store = $state({
  isReady: false,
  isPlaying: false,
  hasStarted: false,
  currentTime: 0,
});

export const mediaPlayerStore = {
  get isReady() {
    return store.isReady;
  },
  set isReady(ready: boolean) {
    store.isReady = ready;
  },
  get isPlaying() {
    return store.isPlaying;
  },
  get hasStarted() {
    return store.hasStarted;
  },
  get currentTime() {
    return store.currentTime;
  },
  set currentTime(time: number) {
    store.currentTime = time;
  },
  async play() {
    store.isPlaying = true;
    store.hasStarted = true;
  },
  async pause() {
    store.isPlaying = false;
  },
  async resume() {
    store.isPlaying = true;
  },
  stop() {
    store.currentTime = 0;
    store.isPlaying = false;
    store.hasStarted = false;
  },
};
