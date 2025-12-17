import { goto, invalidateAll } from '$app/navigation';
import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import { audioInfoCacheStore } from '$lib/application/stores/audioInfoCacheStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import { mediaPlayerStore } from '$lib/application/stores/mediaPlayerStore.svelte';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { listen, type Event, type UnlistenFn } from '@tauri-apps/api/event';
import Database from '@tauri-apps/plugin-sql';
import { load as storeLoad } from '@tauri-apps/plugin-store';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/episode/[id]/$types';
import { load } from '../routes/episode/[id]/+page';
import {
  clearDatabase,
  insertEpisode,
  insertEpisodeGroup,
  insertSentenceCard,
  insertSubtitleLine,
} from './lib/database';
import Component from './lib/EpisodePageWrapper.svelte';
import { createMockStore } from './lib/mockFactories';
import { outputCoverage } from './lib/outputCoverage';

import '$src/app.css';

vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('@tauri-apps/plugin-store');
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));

async function defaultInvokeMock(command: string, _args?: unknown): Promise<unknown> {
  if (command === 'get_env_prefix_command') {
    return '';
  }
  if (command === 'open_audio') {
    return;
  }
  if (command === 'analyze_audio') {
    return {
      duration: 120000,
      peaks: Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 0.2 : 0.6)),
    };
  }
  if (command === 'stop_audio') {
    return null;
  }
  throw new Error(`Unhandled Tauri command: ${command as string}`);
}

async function loadPageData(id: string): Promise<PageData> {
  return (await load({ params: { id } } as never)) as PageData;
}

type RouteParams = { id: string };

function createRouteParams(id: string): RouteParams {
  return { id };
}

async function setupPage(id: string) {
  const params = createRouteParams(id);
  const data = await loadPageData(id);
  const renderResult = render(Component, { data, params });

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.id);
    await renderResult.rerender({ data: refreshed, params });
  });

  return { data, params, renderResult };
}

beforeEach(async () => {
  vi.clearAllMocks();

  apiKeyStore.gemini.reset();
  apiKeyStore.youtube.reset();
  apiKeyStore.gemini.set('test-gemini');
  apiKeyStore.youtube.set('test-youtube');
  i18nStore.init('en');
  audioInfoCacheStore.clear();
  mediaPlayerStore.stop();
  mediaPlayerStore.isReady = false;
  mediaPlayerStore.currentTime = 0;

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockReset();
  invokeMock.mockImplementation(defaultInvokeMock);

  const listenMock = vi.mocked(listen);
  listenMock.mockReset();
  listenMock.mockImplementation(
    async (_event: string, _callback: (event: Event<number>) => void) => vi.fn() as UnlistenFn
  );

  const mockStore = createMockStore({
    language: 'en',
    learningTargetLanguages: ['ja'],
    explanationLanguages: ['en'],
  });
  vi.mocked(storeLoad).mockResolvedValue(mockStore as never);

  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue(undefined);
  vi.mocked(goto).mockReset();
  vi.mocked(goto).mockResolvedValue();

  await clearDatabase();

  page.viewport(1280, 800);
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('success: episode detail renders audio, transcript, cards, and mine button', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Story Album' });
  const episodeId = await insertEpisode({
    episodeGroupId: groupId,
    title: 'Episode Story',
    mediaPath: 'media/story.mp3',
  });

  const subtitleLineId = await insertSubtitleLine({
    episodeId,
    startTimeMs: 0,
    endTimeMs: 5000,
    originalText: 'Hello world from Kotonoha.',
    correctedText: 'Hello world from Kotonoha!',
    translation: 'こんにちは、ことのは。',
    explanation: 'A friendly greeting to start the episode.',
    sentence: 'Hello world from Kotonoha!',
  });

  await insertSubtitleLine({
    episodeId,
    startTimeMs: 6000,
    endTimeMs: 11000,
    originalText: 'Second line follows shortly after.',
  });

  await insertSentenceCard({
    subtitleLineId,
    expression: 'Kotonoha Card Expression',
    sentence: 'Hello world from Kotonoha!',
    contextualDefinition: 'Name of the app in the greeting.',
    coreMeaning: 'Kotonoha proper noun',
    partOfSpeech: 'noun',
    status: 'active',
  });

  const { data } = await setupPage(String(episodeId));

  expect(data.errorKey).toBeNull();
  expect(data.episode?.title).toBe('Episode Story');
  await page.screenshot();

  await expect.element(page.getByRole('heading', { name: 'Episode Story' })).toBeInTheDocument();
  await expect.element(page.getByText('Transcript')).toBeInTheDocument();
  await expect.element(page.getByText('Sentence Cards')).toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Back' })).toBeEnabled();

  const audioPlayer = page.getByTestId('audio-player');
  await expect.element(audioPlayer.getByLabelText('Play')).toBeEnabled();
  await expect.element(audioPlayer.getByLabelText('Stop')).toBeEnabled();
  await expect.element(audioPlayer.getByText('00:00 / 02:00')).toBeInTheDocument();
  await expect.element(page.getByTestId('youtube-player')).not.toBeInTheDocument();

  const transcriptViewer = page.getByTestId('transcript-viewer');
  await expect
    .element(transcriptViewer.getByText('Hello world from Kotonoha!'))
    .toBeInTheDocument();
  await expect
    .element(transcriptViewer.getByText('Second line follows shortly after.'))
    .toBeInTheDocument();

  const sentenceCardsSection = page.getByTestId('sentence-cards-section');
  await expect
    .element(sentenceCardsSection.getByText('Kotonoha Card Expression'))
    .toBeInTheDocument();

  await expect.element(page.getByRole('button', { name: 'Mine' })).toBeEnabled();

  await page.screenshot();
});

test('success: renders YouTube player when episode is from YouTube', async () => {
  const originalYT = (globalThis as { YT?: unknown }).YT;

  const mockPlayerState = { PLAYING: 1, PAUSED: 2, ENDED: 0 };
  let lastPlayerOptions:
    | {
        height?: string;
        width?: string;
        videoId?: string;
        playerVars?: Record<string, unknown>;
        events?: {
          onReady?: (event: unknown) => void;
          onStateChange?: (event: { data: number }) => void;
        };
      }
    | undefined;

  class MockYTPlayer {
    private options: {
      events?: {
        onReady?: (event: unknown) => void;
        onStateChange?: (event: { data: number }) => void;
      };
    };

    constructor(_elementId: string, options: MockYTPlayer['options']) {
      this.options = options;
      lastPlayerOptions = options;
      this.options?.events?.onReady?.({});
    }

    playVideo() {
      this.options?.events?.onStateChange?.({ data: mockPlayerState.PLAYING });
    }

    pauseVideo() {
      this.options?.events?.onStateChange?.({ data: mockPlayerState.PAUSED });
    }

    stopVideo() {
      this.options?.events?.onStateChange?.({ data: mockPlayerState.ENDED });
    }

    seekTo(_time: number, _allowSeekAhead: boolean) {}

    destroy() {}

    getCurrentTime() {
      return 0;
    }
  }

  (globalThis as { YT: unknown }).YT = {
    Player: MockYTPlayer,
    PlayerState: mockPlayerState,
  };

  try {
    const groupId = await insertEpisodeGroup({ name: 'YouTube Album' });
    const episodeId = await insertEpisode({
      episodeGroupId: groupId,
      title: 'YouTube Episode',
      mediaPath: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

    await insertSubtitleLine({
      episodeId,
      startTimeMs: 0,
      endTimeMs: 4000,
      originalText: 'First line from YouTube video.',
    });

    const { data } = await setupPage(String(episodeId));

    expect(data.audioInfo).toBeNull();
    expect(lastPlayerOptions?.height).toBe('100%');
    expect(lastPlayerOptions?.width).toBe('100%');
    expect(lastPlayerOptions?.videoId).toBe('dQw4w9WgXcQ');
    // cSpell:words playsinline disablekb
    expect(lastPlayerOptions?.playerVars).toEqual(
      expect.objectContaining({
        playsinline: 1,
        cc_load_policy: 1,
        disablekb: 1,
        iv_load_policy: 3,
        rel: 0,
      })
    );
    expect(lastPlayerOptions?.events?.onReady).toBeTypeOf('function');
    expect(lastPlayerOptions?.events?.onStateChange).toBeTypeOf('function');

    await page.screenshot();

    await expect.element(page.getByTestId('youtube-player')).toBeInTheDocument();
    await expect.element(page.getByTestId('audio-player')).not.toBeInTheDocument();

    const transcriptViewer = page.getByTestId('transcript-viewer');
    await expect
      .element(transcriptViewer.getByText('First line from YouTube video.'))
      .toBeInTheDocument();

    const sentenceCardsSection = page.getByTestId('sentence-cards-section');
    await expect
      .element(sentenceCardsSection.getByText('There are no sentence Cards in this episode.'))
      .toBeInTheDocument();

    await expect.element(page.getByRole('button', { name: 'Mine' })).toBeEnabled();
  } finally {
    (globalThis as { YT?: unknown }).YT = originalYT;
  }
});

test('error: shows not found message when episode does not exist', async () => {
  const missingEpisodeId = 9999;

  const { data } = await setupPage(String(missingEpisodeId));
  await page.screenshot();

  expect(data.errorKey).toBe('episodeDetailPage.errors.episodeNotFound');
  expect(data.episode).toBeUndefined();

  await expect.element(page.getByText('Episode not found.')).toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Back' })).toBeEnabled();
});

test('error: shows fetch detail message when episode repository throws', async () => {
  const selectSpy = vi
    .spyOn(Database.prototype, 'select')
    .mockRejectedValueOnce(new Error('Database select failed'));

  try {
    const { data } = await setupPage('1');
    await page.screenshot();

    expect(data.errorKey).toBe('episodeDetailPage.errors.fetchDetail');
    expect(data.episode).toBeUndefined();

    await expect.element(page.getByText('Failed to fetch episode details.')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Back' })).toBeEnabled();
  } finally {
    selectSpy.mockRestore();
  }
});
