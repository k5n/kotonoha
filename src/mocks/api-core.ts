// Mock implementation of @tauri-apps/api/core for browser mode

import { type DownloadProgress } from '$lib/domain/entities/ttsEvent';
import { BaseDirectory, writeFile } from './plugin-fs';

interface AudioState {
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  timerId: number | null;
  listeners: ((event: { payload: { position: number } }) => void)[];
}

const audioState: AudioState = {
  isPlaying: false,
  currentPosition: 0,
  duration: 60000, // 仮の60秒
  timerId: null,
  listeners: [],
};

const downloadProgressListeners: ((event: { payload: DownloadProgress }) => void)[] = [];

const downloadStates: Map<string, { timerId: number | null; cancelled: boolean }> = new Map();

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
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
            listener({ payload: { position: audioState.currentPosition } })
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
            listener({ payload: { position: audioState.currentPosition } })
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
      const position = (args as { position_ms: number }).position_ms;
      audioState.currentPosition = position;
      return Promise.resolve(null as T);
    }
    case 'copy_audio_file':
      // ブラウザモードでは音声ファイルのコピーは行わない
      // エラーにせず成功として扱う（実際の音声再生はサポート外）
      console.warn('copy_audio_file: not supported in browser mode');
      return Promise.resolve(null as T);
    case 'read_text_file': {
      // plugin-dialog で選択された File オブジェクトから内容を読み取る
      const { getSelectedScriptFile } = await import('./plugin-dialog');
      const file = getSelectedScriptFile();

      if (!file) {
        throw new Error('No script file selected');
      }

      // File オブジェクトをテキストとして読み込む
      const text = await file.text();
      return text as T;
    }
    case 'detect_language_from_text':
      // Mock: always return null for language detection in browser mode
      return Promise.resolve(null as T);
    case 'download_file_with_progress': {
      return new Promise<T>((resolve, reject) => {
        const {
          url: _url,
          filePath,
          downloadId,
        } = args as { url: string; filePath: string; downloadId: string };
        if (downloadProgressListeners.length === 0) {
          reject(new Error('No listeners for download_progress'));
          return;
        }
        const totalBytes = 10 * 1024 * 1024; // 10MB
        let progress = 0;
        const interval = 200; // 200ms
        const steps = 25; // 5秒 / 200ms = 25
        let step = 0;
        const timerId = window.setInterval(() => {
          const state = downloadStates.get(downloadId);
          if (state?.cancelled) {
            reject('Download cancelled');
            clearInterval(timerId);
            downloadStates.delete(downloadId);
            return;
          }
          step++;
          progress = Math.min(100, (step / steps) * 100);
          const downloaded = Math.floor((progress / 100) * totalBytes);
          downloadProgressListeners.forEach((listener) =>
            listener({
              payload: { downloadId, fileName: filePath, progress, downloaded, total: totalBytes },
            })
          );
          if (step >= steps) {
            clearInterval(timerId);
            downloadStates.delete(downloadId);
            // Mark file as existing in virtual FS
            writeFile(filePath, new Uint8Array(), { baseDir: BaseDirectory.AppLocalData });
            resolve(null as T);
          }
        }, interval);
        downloadStates.set(downloadId, { timerId, cancelled: false });
      });
    }
    case 'cancel_download': {
      const { downloadId } = args as { downloadId: string };
      const state = downloadStates.get(downloadId);
      if (state) {
        state.cancelled = true;
        if (state.timerId !== null) {
          clearInterval(state.timerId);
        }
        // Note: reject is handled in the timer callback
      }
      return Promise.resolve(null as T);
    }
    default:
      throw new Error(`Command '${cmd}' not implemented in browser mode`);
  }
}

export type UnlistenFn = () => void;

export async function listen<T>(
  event: string,
  handler: (event: { payload: T }) => void
): Promise<UnlistenFn> {
  if (event === 'playback-position') {
    const positionHandler = handler as (event: { payload: { position: number } }) => void;
    audioState.listeners.push(positionHandler);
    return () => {
      const index = audioState.listeners.indexOf(positionHandler);
      if (index > -1) audioState.listeners.splice(index, 1);
    };
  }
  if (event === 'download_progress') {
    const progressHandler = handler as (event: { payload: DownloadProgress }) => void;
    downloadProgressListeners.push(progressHandler);
    return () => {
      const index = downloadProgressListeners.indexOf(progressHandler);
      if (index > -1) downloadProgressListeners.splice(index, 1);
    };
  }
  throw new Error(`Event '${event}' not implemented in browser mode`);
}
