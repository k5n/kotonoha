import type {
  TtsErrorPayload,
  TtsFinishedPayload,
  TtsProgressPayload,
} from '$lib/domain/entities/ttsEvent';
import type { DefaultVoices, FileInfo, Speaker, Voice, Voices } from '$lib/domain/entities/voice';
import { normalizeBcp47 } from '$lib/utils/language';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import * as fs from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { error } from '@tauri-apps/plugin-log';

/**
 * Contains information about a model file.
 */
type PiperFileInfo = {
  readonly size_bytes: number;
  readonly md5_digest: string;
};

/**
 * Describes the language of a voice model.
 */
type PiperLanguage = {
  readonly code: string;
  readonly family: string;
  readonly region: string;
  readonly name_native: string;
  readonly name_english: string;
  readonly country_english: string;
};

/**
 * Represents a single Piper voice model.
 */
type PiperVoice = {
  readonly key: string;
  readonly name: string;
  readonly language: PiperLanguage;
  readonly quality: 'low' | 'medium' | 'high' | 'x_low';
  readonly num_speakers: number;
  readonly speaker_id_map: Readonly<Record<string, number>>;
  readonly files: Readonly<Record<string, PiperFileInfo>>;
  readonly aliases: readonly string[];
};

/**
 * Represents the entire collection of Piper voices, indexed by a unique key.
 */
type PiperVoices = Readonly<Record<string, PiperVoice>>;

async function getAvailablePiperVoices(): Promise<PiperVoices> {
  const response = await fetch(
    'https://huggingface.co/rhasspy/piper-voices/resolve/main/voices.json'
  );
  const data = await response.json();
  return data as PiperVoices;
}

function mapPiperVoicesToVoices(piperVoices: PiperVoices): Voices {
  const baseUrl = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/';
  const voices: Voice[] = Object.values(piperVoices).map((piperVoice) => {
    const files: FileInfo[] = Object.entries(piperVoice.files).map(([filePath, fileInfo]) => ({
      url: baseUrl + filePath,
      bytes: fileInfo.size_bytes,
      md5: fileInfo.md5_digest,
    }));
    const voiceBaseUrl = files[0]?.url.replace(/\/[^/]+$/, '/');
    const speakers: Speaker[] = Object.entries(piperVoice.speaker_id_map).map(([name, id]) => ({
      name,
      id,
      sampleUrl: `${voiceBaseUrl}samples/speaker_${id}.mp3`,
    }));
    return {
      name: piperVoice.name,
      language: {
        family: normalizeBcp47(piperVoice.language.family),
        region: piperVoice.language.region,
      },
      quality: piperVoice.quality,
      files,
      speakers:
        speakers.length > 0
          ? speakers
          : [{ id: 0, name: piperVoice.name, sampleUrl: `${voiceBaseUrl}samples/speaker_0.mp3` }],
    };
  });
  return { baseUrl, voices };
}

// cSpell:ignore gwryw_gogleddol thorsten siwis chitwan
const defaultVoices: DefaultVoices = {
  ar: { quality: 'medium' },
  ca: { quality: 'medium' },
  cs: { quality: 'medium' },
  cy: { quality: 'medium', name: 'gwryw_gogleddol' },
  de: { quality: 'medium', name: 'thorsten' },
  en: { quality: 'medium', name: 'ryan' },
  es: { quality: 'medium' },
  fa: { quality: 'medium' },
  fi: { quality: 'medium' },
  fr: { quality: 'medium', name: 'siwis' },
  it: { quality: 'medium' },
  kk: { quality: 'high' },
  ne: { quality: 'medium', name: 'chitwan' },
  nl: { quality: 'medium' },
};

/**
 * Payload for download progress events.
 */
type DownloadProgressPayload = {
  readonly fileName: string;
  readonly progress: number;
  readonly downloaded: number;
  readonly total: number;
};

/**
 * Repository for calling Tauri's TTS commands.
 */
export const ttsRepository = {
  /**
   * Starts the Text-to-Speech (TTS) generation process.
   * This command runs in the background and communicates progress via events.
   * @param transcript - The text to be synthesized.
   * @param configPath - The path to the TTS model config file.
   * @param outputPath - The path where the output audio file will be saved.
   */
  async start(transcript: string, configPath: string, outputPath: string): Promise<void> {
    await invoke('start_tts', { transcript, configPath, outputPath });
  },

  /**
   * Listens for TTS progress updates.
   * @param callback - A function to be called when a progress event is received.
   * @returns A function to stop listening.
   */
  async listenTtsProgress(callback: (payload: TtsProgressPayload) => void): Promise<UnlistenFn> {
    return await listen<TtsProgressPayload>('tts-progress', (event) => {
      callback(event.payload);
    });
  },

  /**
   * Listens for the TTS finished event.
   * @param callback - A function to be called when the TTS process is successfully completed.
   * @returns A function to stop listening.
   */
  async listenTtsFinished(callback: (payload: TtsFinishedPayload) => void): Promise<UnlistenFn> {
    return await listen<TtsFinishedPayload>('tts-finished', (event) => {
      callback(event.payload);
    });
  },

  /**
   * Listens for TTS error events.
   * @param callback - A function to be called when an error occurs during the TTS process.
   * @returns A function to stop listening.
   */
  async listenTtsError(callback: (payload: TtsErrorPayload) => void): Promise<UnlistenFn> {
    return await listen<TtsErrorPayload>('tts-error', (event) => {
      callback(event.payload);
    });
  },

  /**
   * Fetches the available Piper voices from the remote server.
   * @returns Available voices.
   */
  async getAvailableVoices(): Promise<Voices> {
    const piperVoices = await getAvailablePiperVoices();
    return mapPiperVoicesToVoices(piperVoices);
  },

  /**
   * Gets the default voices configuration.
   * @returns Default voices mapping.
   */
  getDefaultVoices(): DefaultVoices {
    return defaultVoices;
  },

  async isModelDownloaded(fileInfo: FileInfo, baseUrl: string): Promise<boolean> {
    if (!fileInfo.url.startsWith(baseUrl)) {
      throw new Error('Invalid fileInfo.url: does not start with baseUrl');
    }
    const relativePath = fileInfo.url.replace(baseUrl, '');
    const checkPath = `models/${relativePath}`;
    return await fs.exists(checkPath, { baseDir: fs.BaseDirectory.AppLocalData });
  },

  /**
   * Downloads a single model file with progress tracking.
   * Downloads to a temporary file first, then renames on success.
   * @param fileInfo - The file information to download.
   * @param baseUrl - The base URL to calculate the relative path.
   */
  async downloadModel(fileInfo: FileInfo, baseUrl: string): Promise<void> {
    if (!fileInfo.url.startsWith(baseUrl)) {
      throw new Error('Invalid fileInfo.url: does not start with baseUrl');
    }
    const relativePath = fileInfo.url.replace(baseUrl, '');
    const tempPath = `models/${relativePath}.tmp`;
    const finalPath = `models/${relativePath}`;

    try {
      await invoke('download_file_with_progress', { url: fileInfo.url, filePath: tempPath });
      await fs.rename(tempPath, finalPath, {
        oldPathBaseDir: fs.BaseDirectory.AppLocalData,
        newPathBaseDir: fs.BaseDirectory.AppLocalData,
      });
    } catch (err) {
      error(`Error downloading model file (${fileInfo.url}): ${err}`);
      // Clean up temporary file on failure
      try {
        await fs.remove(tempPath, { baseDir: fs.BaseDirectory.AppLocalData });
      } catch (_removeError) {
        error(`Failed to remove temp file: ${tempPath}`);
        // Ignore cleanup errors
      }
      throw err;
    }
  },

  /**
   * Listens for download progress updates.
   * @param callback - A function to be called when a progress event is received.
   * @returns A function to stop listening.
   */
  async listenDownloadProgress(
    callback: (payload: DownloadProgressPayload) => void
  ): Promise<UnlistenFn> {
    return await listen<DownloadProgressPayload>('download_progress', (event) => {
      callback(event.payload);
    });
  },
};
