import { invalidateAll } from '$app/navigation';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { listen, type Event, type UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { fetch as httpFetch } from '@tauri-apps/plugin-http';
import Database from '@tauri-apps/plugin-sql';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/episode-list/[groupId]/$types';
import { load } from '../routes/episode-list/[groupId]/+page';
import Component from '../routes/episode-list/[groupId]/+page.svelte';
import { outputCoverage } from './lib/outputCoverage';
import { waitFor, waitForFadeTransition } from './lib/utils';

import '$src/app.css';

// Mock configurations
vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockImplementation(async (key: string) => {
      if (key === 'learningTargetLanguages') return ['en', 'es'];
      if (key === 'explanationLanguages') return ['ja', 'en'];
      return null;
    }),
    set: vi.fn(),
    save: vi.fn(),
  }),
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppLocalData: 'appData' },
  exists: vi.fn().mockResolvedValue(false),
  remove: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({
      'en_US-test-medium': {
        key: 'en_US-test-medium',
        name: 'test',
        language: {
          code: 'en_US',
          family: 'en',
          region: 'US',
          name_native: 'English',
          name_english: 'English',
          country_english: 'United States',
        },
        quality: 'medium',
        num_speakers: 2,
        speaker_id_map: {
          '3922': 0,
          '8699': 1,
        },
        files: {
          'en/en_US/test/medium/en_US-test-medium.onnx': {
            size_bytes: 63201294,
            md5_digest: '8f06d3aff8ded5a7f13f907e6bec32ac',
          },
          'en/en_US/test/medium/en_US-test-medium.onnx.json': {
            size_bytes: 4883,
            md5_digest: 'f173a2b5202b3e4128ccc3ed8195306c',
          },
          'en/en_US/test/medium/MODEL_CARD': {
            size_bytes: 306,
            md5_digest: '79d9200481a9dcabfa1803cb9e31c28a',
          },
        },
        aliases: ['en-us-test-medium'],
      },
    }),
  }),
}));
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn().mockResolvedValue(undefined),
}));

// Constants
const DATABASE_URL = 'dummy';
const DOWNLOAD_WAIT_TIME_MS = 200;
const TTS_WAIT_TIME_MS = 400;

// Database utilities
async function clearDatabase(): Promise<void> {
  const db = new Database(DATABASE_URL);
  await db.execute('DELETE FROM sentence_cards');
  await db.execute('DELETE FROM dialogues');
  await db.execute('DELETE FROM episodes');
  await db.execute('DELETE FROM episode_groups');
  await db.execute(
    "DELETE FROM sqlite_sequence WHERE name IN ('episode_groups','episodes','dialogues','sentence_cards')"
  );
}

async function insertEpisodeGroup(params: {
  name: string;
  groupType?: 'album' | 'folder';
  displayOrder?: number;
  parentId?: number | null;
}): Promise<number> {
  const { name, groupType = 'album', displayOrder = 1, parentId = null } = params;
  const db = new Database(DATABASE_URL);
  await db.execute(
    'INSERT INTO episode_groups (name, parent_group_id, group_type, display_order) VALUES (?, ?, ?, ?)',
    [name, parentId, groupType, displayOrder]
  );
  const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() AS id');
  return rows[0]?.id ?? 0;
}

// Page setup utilities
async function loadPageData(groupId: string): Promise<PageData> {
  return (await load({ params: { groupId } } as never)) as PageData;
}

type RouteParams = { groupId: string };

function createRouteParams(groupId: string): RouteParams {
  return { groupId };
}

async function setupPage(groupId: string) {
  const params = createRouteParams(groupId);
  const data = await loadPageData(groupId);
  const renderResult = render(Component, { data, params });

  await tick();

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.groupId);
    await renderResult.rerender({ data: refreshed, params });
    await tick();
  });

  return { data, params, renderResult };
}

// Default invoke mock
async function defaultInvokeMock(command: string): Promise<unknown> {
  if (command === 'get_env_prefix_command') {
    return '';
  }
  if (command === 'detect_language_from_text') {
    return 'en';
  }
  if (command === 'copy_audio_file') {
    return '/path/to/copied/audio.mp3';
  }
  if (command === 'read_text_file') {
    return '1\n00:00:00,000 --> 00:00:05,000\nHello world\n';
  }
  if (command === 'execute_tts') {
    return '/path/to/generated/audio.mp3';
  }
  if (command === 'download_file_with_progress') {
    // Simulate download completion
    await waitFor(DOWNLOAD_WAIT_TIME_MS);
    return Promise.resolve();
  }
  if (command === 'start_tts') {
    await waitFor(TTS_WAIT_TIME_MS);
    return { audioPath: '/path/to/audio.mp3', scriptPath: '/path/to/script.sswt' };
  }
  if (command === 'cancel_tts') {
    return;
  }
  throw new Error(`Unhandled Tauri command: ${command as string}`);
}

async function defaultListenMock(
  event: string,
  callback: (event: Event<unknown>) => void
): Promise<UnlistenFn> {
  if (event === 'download_progress') {
    // Simulate download completion
    setTimeout(() => {
      callback({
        event: 'download_progress',
        id: 1,
        payload: {
          downloadId: 'test',
          fileName: 'model.onnx',
          progress: 100,
          downloaded: 100,
          total: 100,
        },
      });
    }, DOWNLOAD_WAIT_TIME_MS);
  }
  if (event === 'tts-progress') {
    // Simulate TTS progress
    setTimeout(() => {
      callback({
        event: 'tts-progress',
        id: 1,
        payload: { progress: 50, startMs: 500, endMs: 5000, text: 'Hello world' },
      });
    }, TTS_WAIT_TIME_MS / 2);
  }
  return vi.fn() as UnlistenFn;
}

async function openTtsEpisodeModal() {
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();

  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  await page.getByRole('button', { name: 'Open the script + TTS workflow' }).click();
  await waitForFadeTransition();

  await tick();
}

beforeEach(async () => {
  vi.clearAllMocks();

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockReset();
  invokeMock.mockImplementation(defaultInvokeMock);

  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue(undefined);

  const listenMock = vi.mocked(listen);
  listenMock.mockReset();
  listenMock.mockImplementation(defaultListenMock);

  groupPathStore.reset();
  i18nStore.init('en');

  vi.mocked(open).mockReset();
  vi.mocked(open).mockResolvedValue('/path/to/selected/file');

  await clearDatabase();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('success: handles TTS submit request with valid payload', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openTtsEpisodeModal();
  await waitForFadeTransition();
  await page.screenshot();

  // Ensure TTS configuration section is displayed before file selection
  await expect.element(page.getByText('Text-to-Speech Configuration')).not.toBeInTheDocument();

  // Fill in the form via UI
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('TTS Test Episode');

  // Mock file selection to return SRT file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');

  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);

  // TTS configuration section should now be visible
  await expect.element(page.getByText('Text-to-Speech Configuration')).toBeInTheDocument();

  // Language should be auto-selected after detection
  const languageSelect = page.getByLabelText('Learning Target Language');
  await expect.element(languageSelect).toHaveValue('en');

  // TTS voices should be loaded and default selected
  const qualitySelect = page.getByLabelText('Quality');
  await expect.element(qualitySelect).toHaveValue('medium');

  const voiceSelect = page.getByLabelText('Voice');
  await expect.element(voiceSelect).toHaveValue('test');

  const speakerSelect = page.getByLabelText('Speaker');
  await expect.element(speakerSelect).toHaveValue('0');
  await page.screenshot();

  // Click submit
  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();

  // Check that the modal is closed (successful submission)
  await expect
    .element(page.getByRole('heading', { name: 'Downloading TTS Model' }))
    .toBeInTheDocument();
  await page.screenshot();

  // Wait for download completion
  await waitFor(DOWNLOAD_WAIT_TIME_MS);

  // Check that download modal is closed
  await expect
    .element(page.getByRole('heading', { name: 'Downloading TTS Model' }))
    .not.toBeInTheDocument();

  // Check that TTS execution modal is displayed
  await expect.element(page.getByRole('heading', { name: 'Generating Audio' })).toBeInTheDocument();
  await page.screenshot();

  await waitFor(TTS_WAIT_TIME_MS);
  await waitForFadeTransition();
  await page.screenshot();
});

test('success: allows cancelling TTS model download', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  const invokeMock = vi.mocked(invoke);
  const pendingDownloads = new Map<string, () => void>();
  invokeMock.mockImplementation(async (command, args: unknown) => {
    if (command === 'download_file_with_progress') {
      const downloadId = (args as { downloadId: string }).downloadId;
      return await new Promise<void>((_, reject) => {
        pendingDownloads.set(downloadId, () => reject(new Error('cancelled')));
      });
    }

    if (command === 'cancel_download') {
      const downloadId = (args as { downloadId: string }).downloadId;
      pendingDownloads.get(downloadId)?.();
      return;
    }

    return defaultInvokeMock(command as string);
  });

  await setupPage(String(groupId));

  await openTtsEpisodeModal();

  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('TTS Download Cancel Episode');

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');

  await page.getByTestId('script-file-select').click();

  await waitFor(100);

  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();

  await expect
    .element(page.getByRole('heading', { name: 'Downloading TTS Model' }))
    .toBeInTheDocument();
  await page.screenshot();

  await page.getByTestId('tts-model-download-cancel-button').click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect
    .element(page.getByRole('heading', { name: 'Downloading TTS Model' }))
    .not.toBeInTheDocument();
  expect(invokeMock).toHaveBeenCalledWith('cancel_download', {
    downloadId: 'en/en_US/test/medium/en_US-test-medium.onnx',
  });
  expect(invokeMock).toHaveBeenCalledWith('cancel_download', {
    downloadId: 'en/en_US/test/medium/en_US-test-medium.onnx.json',
  });
  await expect
    .element(page.getByRole('heading', { name: 'Generating Audio' }))
    .not.toBeInTheDocument();
  // //TODO: Change the message to inform the user that it has been canceled
});

test('success: allows cancelling TTS execution mid-process', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openTtsEpisodeModal();

  const invokeMock = vi.mocked(invoke);
  let rejectStart: (() => void) | null = null;
  invokeMock.mockImplementation(async (command) => {
    if (command === 'start_tts') {
      return await new Promise((_, reject) => {
        rejectStart = () => reject('TTS cancelled');
      });
    }
    if (command === 'cancel_tts') {
      rejectStart?.();
      return;
    }
    return defaultInvokeMock(command as string);
  });

  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('TTS Cancel Episode');

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');

  await page.getByTestId('script-file-select').click();

  await waitFor(100);

  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();

  await expect
    .element(page.getByRole('heading', { name: 'Downloading TTS Model' }))
    .toBeInTheDocument();

  await waitFor(DOWNLOAD_WAIT_TIME_MS);

  await expect
    .element(page.getByRole('heading', { name: 'Downloading TTS Model' }))
    .not.toBeInTheDocument();

  await expect.element(page.getByRole('heading', { name: 'Generating Audio' })).toBeInTheDocument();

  await page.screenshot();
  await page.getByTestId('tts-execution-cancel-button').click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect
    .element(page.getByRole('heading', { name: 'Generating Audio' }))
    .not.toBeInTheDocument();
  expect(invokeMock).toHaveBeenCalledWith('cancel_tts');
  // //TODO: Change the message to inform the user that it has been canceled
});

test('success: handles no script language detected in TTS workflow', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openTtsEpisodeModal();

  // Mock the invoke function to return an error for language detection
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'detect_language_from_text') {
      return null;
    }
    return defaultInvokeMock(command);
  });

  // Mock file selection to return SRT file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');

  // Select script file for TTS workflow
  await page.getByTestId('script-file-select').click();

  // Wait for async operations and error handling
  await waitFor(200);
  await page.screenshot();

  // Check that an error toast or message is displayed
  await expect.element(page.getByText('No language detected.')).toBeInTheDocument();

  // Verify that the language select shows default value
  const learningLanguageSelect = page.getByTestId('learningLanguage');
  await expect.element(learningLanguageSelect).toHaveValue('en');
});

test('error: handles script language detection error in TTS workflow', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openTtsEpisodeModal();

  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('TTS Cancel Episode');

  // Mock the invoke function to return an error for language detection
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'detect_language_from_text') {
      throw new Error('Failed to detect language: Network error');
    }
    return defaultInvokeMock(command);
  });

  // Mock file selection to return SRT file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');

  // Select script file for TTS workflow
  await page.getByTestId('script-file-select').click();

  // Wait for async operations and error handling
  await waitFor(200);
  await page.screenshot();

  // Check that an error toast or message is displayed
  // TODO: 表示場所を言語選択付近に変更する
  await expect.element(page.getByText('Failed to auto-detect language')).toBeInTheDocument();

  // Verify that the language select shows default value
  const learningLanguageSelect = page.getByTestId('learningLanguage');
  await expect.element(learningLanguageSelect).toHaveValue('en');
});

test('error: shows error message when TTS voice fetch fails', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  // Force Piper voice metadata fetch to fail
  vi.mocked(httpFetch).mockRejectedValueOnce(new Error('Network error while fetching voices'));

  await setupPage(String(groupId));

  await openTtsEpisodeModal();

  // Mock file selection to return SRT file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');

  // Trigger TTS workflow which attempts to fetch voices
  await page.getByTestId('script-file-select').click();

  await waitFor(200);

  await expect.element(page.getByText('Failed to load TTS voices.')).toBeInTheDocument();
  await page.screenshot();
});

test('error: shows error message when TTS model download fails', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'download_file_with_progress') {
      throw new Error('Network error while downloading');
    }
    return defaultInvokeMock(command);
  });

  await setupPage(String(groupId));

  await openTtsEpisodeModal();

  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('TTS Download Failure Episode');

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');

  await page.getByTestId('script-file-select').click();

  await waitFor(100);

  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect
    .element(
      page.getByText(
        'Failed to download TTS model. Please check your network connection or storage.'
      )
    )
    .toBeInTheDocument();
  await expect.element(page.getByTestId('tts-model-download-close-button')).toBeEnabled();

  await page.getByTestId('tts-model-download-close-button').click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect
    .element(page.getByRole('heading', { name: 'Downloading TTS Model' }))
    .not.toBeInTheDocument();
});

test('error: shows error message when TTS execution fails', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'start_tts') {
      throw new Error('TTS start failed');
    }
    return defaultInvokeMock(command as string);
  });
  const listenMock = vi.mocked(listen);
  listenMock.mockImplementation(
    async (event: string, callback: (event: Event<unknown>) => void) => {
      if (event === 'tts-progress') {
        return vi.fn() as UnlistenFn;
      }
      return defaultListenMock(event, callback);
    }
  );

  await setupPage(String(groupId));

  await openTtsEpisodeModal();

  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('TTS Execution Failure Episode');

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  await page.getByTestId('script-file-select').click();
  await waitFor(100);

  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();
  await waitFor(DOWNLOAD_WAIT_TIME_MS);

  await expect.element(page.getByRole('heading', { name: 'Generating Audio' })).toBeInTheDocument();
  await expect.element(page.getByText('Failed to generate audio using TTS.')).toBeInTheDocument();

  await page.screenshot();
  await expect.element(page.getByTestId('tts-execution-close-button')).toBeEnabled();

  await page.getByTestId('tts-execution-close-button').click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect
    .element(page.getByRole('heading', { name: 'Generating Audio' }))
    .not.toBeInTheDocument();
});
