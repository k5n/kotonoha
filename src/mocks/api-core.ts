// Mock implementation of @tauri-apps/api/core for browser mode

// Mock implementation of @tauri-apps/api/core for browser mode

interface AudioState {
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  timerId: number | null;
  listeners: ((payload: { position: number }) => void)[];
}

const audioState: AudioState = {
  isPlaying: false,
  currentPosition: 0,
  duration: 60000, // 仮の60秒
  timerId: null,
  listeners: [],
};

export async function invoke<T>(cmd: string, _args?: Record<string, unknown>): Promise<T> {
  switch (cmd) {
    case 'get_stronghold_password':
      return 'mock_password' as T;
    case 'open_audio':
      // ダミー: 実際のファイルオープン不要
      return Promise.resolve(null as T);
    case 'analyze_audio':
      // ダミーの AudioInfo を返す
      return Promise.resolve({
        duration: audioState.duration,
        peaks: new Array(100).fill(0.5),
      } as T);
    case 'play_audio':
      if (!audioState.isPlaying) {
        audioState.isPlaying = true;
        audioState.timerId = window.setInterval(() => {
          audioState.currentPosition += 200;
          if (audioState.currentPosition >= audioState.duration) {
            audioState.currentPosition = audioState.duration;
            audioState.isPlaying = false;
            clearInterval(audioState.timerId!);
            audioState.timerId = null;
          }
          audioState.listeners.forEach((listener) =>
            listener({ position: audioState.currentPosition })
          );
        }, 200);
      }
      return Promise.resolve(null as T);
    case 'pause_audio':
      audioState.isPlaying = false;
      if (audioState.timerId) {
        clearInterval(audioState.timerId);
        audioState.timerId = null;
      }
      return Promise.resolve(null as T);
    case 'resume_audio':
      if (!audioState.isPlaying) {
        audioState.isPlaying = true;
        audioState.timerId = window.setInterval(() => {
          audioState.currentPosition += 200;
          if (audioState.currentPosition >= audioState.duration) {
            audioState.currentPosition = audioState.duration;
            audioState.isPlaying = false;
            clearInterval(audioState.timerId!);
            audioState.timerId = null;
          }
          audioState.listeners.forEach((listener) =>
            listener({ position: audioState.currentPosition })
          );
        }, 200);
      }
      return Promise.resolve(null as T);
    case 'stop_audio':
      audioState.isPlaying = false;
      audioState.currentPosition = 0;
      if (audioState.timerId) {
        clearInterval(audioState.timerId);
        audioState.timerId = null;
      }
      return Promise.resolve(null as T);
    case 'seek_audio': {
      const position = (_args as { position_ms: number }).position_ms;
      audioState.currentPosition = position;
      return Promise.resolve(null as T);
    }
    case 'copy_audio_file':
      // ダミー: 成功を返す
      return Promise.resolve(null as T);
    default:
      throw new Error(`Command '${cmd}' not implemented in browser mode`);
  }
}

type UnlistenFn = () => void;

export async function listen<T>(
  event: string,
  handler: (event: { payload: T }) => void
): Promise<UnlistenFn> {
  if (event === 'playback-position') {
    const wrappedHandler = (payload: { position: number }) => handler({ payload: payload as T });
    audioState.listeners.push(wrappedHandler);
    return () => {
      const index = audioState.listeners.indexOf(wrappedHandler);
      if (index > -1) {
        audioState.listeners.splice(index, 1);
      }
    };
  }
  throw new Error(`Event '${event}' not implemented in browser mode`);
}
