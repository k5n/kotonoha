import type { AudioInfo } from '$lib/domain/entities/audioInfo';

const cache = $state<Record<string, AudioInfo>>({});

/**
 * A store to cache audio information objects by their path.
 * This prevents re-fetching and re-analyzing audio files when navigating
 * or when data is invalidated on the episode detail page.
 */
export const audioInfoCacheStore = {
  /**
   * Retrieves an audio info object from the cache.
   * @param audioPath The path of the audio file.
   * @returns The AudioInfo object, or undefined if not in cache.
   */
  get(audioPath: string): AudioInfo | undefined {
    return cache[audioPath];
  },

  /**
   * Adds an audio info object to the cache.
   * @param audioPath The path of the audio file.
   * @param audioInfo The AudioInfo object to cache.
   */
  set(audioPath: string, audioInfo: AudioInfo) {
    cache[audioPath] = audioInfo;
  },

  /**
   * Checks if an audio info object for a given path is in the cache.
   * @param audioPath The path of the audio file.
   * @returns True if the audio info is in the cache, false otherwise.
   */
  has(audioPath: string): boolean {
    return audioPath in cache;
  },

  /**
   * Clears a specific entry from the cache.
   * @param audioPath The path of the audio file to remove from the cache.
   */
  remove(audioPath: string) {
    if (this.has(audioPath)) {
      delete cache[audioPath];
    }
  },

  /**
   * Clears the entire cache.
   */
  clear() {
    for (const key in cache) {
      delete cache[key];
    }
  },
};
