import type { DownloadProgress, TtsProgress } from '$lib/domain/entities/ttsEvent';
import type { DefaultVoices, FileInfo, Speaker, Voice } from '$lib/domain/entities/voice';
import { assertNotUndefined } from '$lib/utils/assertion';
import { normalizeBcp47 } from '$lib/utils/language';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import * as fs from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { getModelsDir } from '../config';

/**
 * The result of a TTS operation.
 */
type TtsResult = {
  readonly audioPath: string;
  readonly scriptPath: string;
};

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

function mapPiperVoicesToVoices(piperVoices: PiperVoices): readonly Voice[] {
  const baseUrl = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/';
  const voices: Voice[] = Object.values(piperVoices).map((piperVoice) => {
    const files: FileInfo[] = Object.entries(piperVoice.files)
      .filter(([filePath, _fileInfo]) => filePath.endsWith('.onnx') || filePath.endsWith('.json'))
      .map(([filePath, fileInfo]) => ({
        // keep the original url for possible network operations, but also store
        // the relative path (path is required): remove the baseUrl prefix
        url: baseUrl + filePath,
        path: filePath,
        bytes: fileInfo.size_bytes,
        md5: fileInfo.md5_digest,
      }));

    const voiceBaseUrl = baseUrl + Object.keys(piperVoice.files)[0]?.replace(/\/[^/]+$/, '/');
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
  return voices;
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
 * Repository for calling Tauri's TTS commands.
 */
export const ttsRepository = {
  /**
   * Starts the Text-to-Speech (TTS) generation process.
   * @param transcript - The text to be synthesized.
   * @param voice - The voice to use for TTS.
   * @param speakerId - The speaker ID to use for TTS.
   * @returns The paths to the generated audio and script files.
   */
  async start(transcript: string, voice: Voice, speakerId: number): Promise<TtsResult> {
    // Find the config file (.json) from the voice files
    const configFile = voice.files.find((file) => file.url.endsWith('.json'));
    assertNotUndefined(configFile, 'No config file (.json) found in voice files');

    // Use the required `path` field to construct the configPath under models/
    const relativePath = configFile.path;
    const configPath = `${await getModelsDir()}/${relativePath}`;

    return await invoke('start_tts', { transcript, configPath, speakerId });
  },

  /**
   * Listens for TTS progress updates.
   * @param callback - A function to be called when a progress event is received.
   * @returns A function to stop listening.
   */
  async listenTtsProgress(callback: (payload: TtsProgress) => void): Promise<UnlistenFn> {
    return await listen<TtsProgress>('tts-progress', (event) => {
      callback(event.payload);
    });
  },

  /**
   * Cancels the ongoing TTS process.
   */
  async cancel(): Promise<void> {
    await invoke('cancel_tts');
  },

  /**
   * Fetches the available Piper voices from the remote server.
   * @returns Available voices.
   */
  async getAvailableVoices(): Promise<readonly Voice[]> {
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

  async isModelDownloaded(fileInfo: FileInfo): Promise<boolean> {
    const checkPath = `${await getModelsDir()}/${fileInfo.path}`;
    return await fs.exists(checkPath, { baseDir: fs.BaseDirectory.AppLocalData });
  },

  /**
   * Downloads a single model file with progress tracking.
   * Downloads to a temporary file first, then renames on success.
   * @param fileInfo - The file information to download.
   * @param baseUrl - The base URL to calculate the relative path.
   * @param downloadId - The download ID for cancellation.
   */
  async downloadModel(fileInfo: FileInfo, downloadId: string): Promise<void> {
    const modelsDir = await getModelsDir();
    const tempPath = `${modelsDir}/${fileInfo.path}.tmp`;
    const finalPath = `${modelsDir}/${fileInfo.path}`;

    try {
      // invoke download with the original URL (we kept url on FileInfo)
      await invoke('download_file_with_progress', {
        url: fileInfo.url,
        filePath: tempPath,
        downloadId,
      });
      await fs.rename(tempPath, finalPath, {
        oldPathBaseDir: fs.BaseDirectory.AppLocalData,
        newPathBaseDir: fs.BaseDirectory.AppLocalData,
      });
    } catch (err) {
      console.error(`Error downloading model file (${fileInfo.url}): ${err}`);
      // Clean up temporary file on failure
      try {
        await fs.remove(tempPath, { baseDir: fs.BaseDirectory.AppLocalData });
      } catch (_removeError) {
        console.error(`Failed to remove temp file: ${tempPath}`);
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
  async listenDownloadProgress(callback: (payload: DownloadProgress) => void): Promise<UnlistenFn> {
    return await listen<DownloadProgress>('download_progress', (event) => {
      callback(event.payload);
    });
  },

  /**
   * Cancels the ongoing download process.
   */
  async cancelDownload(id: string): Promise<void> {
    await invoke('cancel_download', { downloadId: id });
  },
};
