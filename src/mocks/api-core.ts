// Mock implementation of @tauri-apps/api/core for browser mode

import type { SentenceAnalysisResult } from '$lib/domain/entities/sentenceAnalysisResult';
import { type DownloadProgress, type TtsProgress } from '$lib/domain/entities/ttsEvent';
import { BaseDirectory, writeFile } from './plugin-fs';

const mockSentenceMiningResult: SentenceAnalysisResult = {
  sentence: "I had to pull an all-nighter to get it done, but it's almost there.",
  translation: 'それを終わらせるために徹夜しなければなりませんでしたが、もうほとんど出来ています。',
  explanation:
    "この文は、2つの節が接続詞 'but' で繋がれた構造をしています。前半の 'I had to pull an all-nighter to get it done' は、「～するために徹夜しなければならなかった」という意味です。'had to' は義務を表し、'to get it done' は目的を表す不定詞句です。'pull an all-nighter' が「徹夜する」という重要なイディオムです。後半の 'it's almost there' は「もうすぐだ」「ゴールは近い」という意味の口語表現で、ここではレポートの完成が間近であることを示しています。これらを組み合わせることで、全体の意味が形成されます。",
  items: [
    {
      id: 1,
      expression: 'pull an all-nighter',
      partOfSpeech: '慣用句',
      contextualDefinition: '徹夜する',
      coreMeaning:
        '一晩中、特に勉強や仕事のために起きていること。睡眠をとらずに夜を明かすという行為そのものを指す表現。',
      exampleSentence: "I had to <b>pull an all-nighter</b> to get it done, but it's almost there.",
      status: 'active',
    },
    {
      id: 2,
      expression: 'get something done',
      partOfSpeech: '表現',
      contextualDefinition: '～を終わらせる、完成させる',
      coreMeaning:
        'あるタスクや仕事を完了させる、または誰かに完了させることを示す使役的な表現。ここでは自分自身で終わらせることを指す。',
      exampleSentence: "I had to pull an all-nighter to <b>get it done</b>, but it's almost there.",
      status: 'active',
    },
    {
      id: 3,
      expression: 'almost there',
      partOfSpeech: '表現',
      contextualDefinition: 'もうほとんど出来ている、完成間近である',
      coreMeaning:
        '物理的な目的地や、目標達成まであと少しのところまで来ている状態を指す口語的な表現。',
      exampleSentence: "I had to pull an all-nighter to get it done, but it's <b>almost there</b>.",
      status: 'active',
    },
  ],
};

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

const ttsProgressListeners: ((event: { payload: TtsProgress }) => void)[] = [];

const ttsStates: Map<string, { timerId: number | null; cancelled: boolean }> = new Map();

async function handlePlayAudio<T>(): Promise<T> {
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
}

async function handlePauseAudio<T>(): Promise<T> {
  audioState.isPlaying = false;
  if (audioState.timerId) {
    clearInterval(audioState.timerId);
    audioState.timerId = null;
  }
  return Promise.resolve(null as T);
}

async function handleResumeAudio<T>(): Promise<T> {
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
}

async function handleStopAudio<T>(): Promise<T> {
  audioState.isPlaying = false;
  audioState.currentPosition = 0;
  if (audioState.timerId) {
    clearInterval(audioState.timerId);
    audioState.timerId = null;
  }
  return Promise.resolve(null as T);
}

async function handleSeekAudio<T>(args: Record<string, unknown>): Promise<T> {
  const position = (args as { position_ms: number }).position_ms;
  audioState.currentPosition = position;
  return Promise.resolve(null as T);
}

async function handleReadTextFile<T>(): Promise<T> {
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

async function handleDownloadFileWithProgress<T>(args: Record<string, unknown>): Promise<T> {
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

async function handleCancelDownload<T>(args: Record<string, unknown>): Promise<T> {
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

async function handleStartTts<T>(args: Record<string, unknown>): Promise<T> {
  const {
    transcript,
    configPath: _configPath,
    speakerId: _speakerId,
  } = args as { transcript: string; configPath: string; speakerId: number };
  const ttsId = 'tts';
  if (ttsStates.has(ttsId)) {
    throw new Error('TTS already in progress');
  }
  return new Promise<T>((resolve, reject) => {
    const lines = transcript
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const totalLines = lines.length;
    if (totalLines === 0) {
      resolve({ audioPath: '/tmp/kotonoha_tts.ogg', scriptPath: '/tmp/kotonoha_tts.sswt' } as T);
      return;
    }
    let currentMs = 0;
    let lineIndex = 0;
    const interval = 100; // ms per step
    const timerId = window.setInterval(() => {
      const state = ttsStates.get(ttsId);
      if (state?.cancelled) {
        reject('TTS cancelled');
        clearInterval(timerId);
        ttsStates.delete(ttsId);
        return;
      }
      if (lineIndex >= totalLines) {
        clearInterval(timerId);
        ttsStates.delete(ttsId);
        resolve({ audioPath: '/tmp/kotonoha_tts.ogg', scriptPath: '/tmp/kotonoha_tts.sswt' } as T);
        return;
      }
      const line = lines[lineIndex];
      const startMs = currentMs;
      const durationMs = 2000; // 2 seconds per line
      currentMs += durationMs;
      const endMs = currentMs;
      const progress = Math.floor(((lineIndex + 1) / totalLines) * 100);
      ttsProgressListeners.forEach((listener) =>
        listener({
          payload: { progress, startMs, endMs, text: line },
        })
      );
      lineIndex++;
    }, interval);
    ttsStates.set(ttsId, { timerId, cancelled: false });
  });
}

async function handleCancelTts<T>(): Promise<T> {
  const ttsId = 'tts';
  const state = ttsStates.get(ttsId);
  if (state) {
    state.cancelled = true;
    if (state.timerId !== null) {
      clearInterval(state.timerId);
    }
    ttsStates.delete(ttsId);
  }
  return Promise.resolve(null as T);
}

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  switch (cmd) {
    case 'get_stronghold_password':
      return 'mock_password' as T;
    case 'open_audio':
      // Dummy: No need to actually open the file
      return Promise.resolve(null as T);
    case 'analyze_audio':
      // Return dummy AudioInfo
      return Promise.resolve({
        duration: audioState.duration,
        peaks: new Array(100).fill(0.5),
      } as T);
    case 'play_audio':
      return handlePlayAudio<T>();
    case 'pause_audio':
      return handlePauseAudio<T>();
    case 'resume_audio':
      return handleResumeAudio<T>();
    case 'stop_audio':
      return handleStopAudio<T>();
    case 'seek_audio':
      return handleSeekAudio<T>(args!);
    case 'copy_audio_file':
      // Do not copy audio files in browser mode
      // Treat as success instead of error (actual audio playback is not supported)
      console.warn('copy_audio_file: not supported in browser mode');
      return Promise.resolve(null as T);
    case 'read_text_file':
      return handleReadTextFile<T>();
    case 'detect_language_from_text':
      // Mock: always return null for language detection in browser mode
      return Promise.resolve(null as T);
    case 'download_file_with_progress':
      return handleDownloadFileWithProgress<T>(args!);
    case 'cancel_download':
      return handleCancelDownload<T>(args!);
    case 'start_tts':
      return handleStartTts<T>(args!);
    case 'cancel_tts':
      return handleCancelTts<T>();
    case 'analyze_sentence_with_llm':
      return new Promise<T>((resolve) => {
        setTimeout(() => {
          resolve(mockSentenceMiningResult as T);
        }, 2000);
      });
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
  if (event === 'tts-progress') {
    const progressHandler = handler as (event: { payload: TtsProgress }) => void;
    ttsProgressListeners.push(progressHandler);
    return () => {
      const index = ttsProgressListeners.indexOf(progressHandler);
      if (index > -1) ttsProgressListeners.splice(index, 1);
    };
  }
  throw new Error(`Event '${event}' not implemented in browser mode`);
}
