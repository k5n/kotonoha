import type { AudioInfo } from '$lib/domain/entities/audioInfo';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { error } from '@tauri-apps/plugin-log';

/**
 * Tauriのaudioコマンドを呼び出すためのリポジトリ
 */
export const audioRepository = {
  /**
   * 指定されたパスのオーディオを再生します。
   * @param path - 再生するオーディオファイルのフルパス。
   * @return 再生するオーディオの情報。
   */
  async open(path: string): Promise<AudioInfo> {
    const maxPeaks = 1000;
    const audioInfo = await invoke<AudioInfo>('open_audio', { path, maxPeaks });
    return audioInfo;
  },

  /**
   * オーディオを再生します。
   */
  async play(): Promise<void> {
    await invoke('play_audio');
  },

  /**
   * 現在再生中のオーディオを一時停止します。
   */
  async pause(): Promise<void> {
    await invoke('pause_audio');
  },

  /**
   * 一時停止中のオーディオを再開します。
   */
  async resume(): Promise<void> {
    await invoke('resume_audio');
  },

  /**
   * オーディオの再生を停止します。
   */
  async stop(): Promise<void> {
    await invoke('stop_audio');
  },

  /**
   * 指定された時間（ミリ秒）にシークします。
   * @param positionMs - シーク先の時間（ミリ秒）。
   */
  async seek(positionMs: number): Promise<void> {
    // Convert to integer for Tauri backend (u32 expected)
    const positionMsInt = Math.round(positionMs);

    if (isNaN(positionMsInt)) {
      error('audioRepository.seek: positionMs is NaN');
      return;
    }

    await invoke('seek_audio', { positionMs: positionMsInt });
  },

  /**
   * 再生位置の変更を監視します。
   * @param callback - 再生位置が変更されたときに呼び出されるコールバック関数。引数として現在の再生位置（ミリ秒）を受け取ります。
   * @return 監視を停止するための関数。
   */
  async listenPlaybackPosition(callback: (positionMs: number) => void): Promise<UnlistenFn> {
    const unlisten = await listen<number>('playback-position', (event) => {
      callback(event.payload);
    });
    return unlisten;
  },
};
