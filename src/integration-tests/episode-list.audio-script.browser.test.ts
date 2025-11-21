import { invalidateAll } from '$app/navigation';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { listen, type Event, type UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import Database from '@tauri-apps/plugin-sql';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
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
  throw new Error(`Unhandled Tauri command: ${command as string}`);
}

// Setup function for beforeEach
beforeEach(async () => {
  vi.clearAllMocks();

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockReset();
  invokeMock.mockImplementation(defaultInvokeMock);

  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue(undefined);

  const listenMock = vi.mocked(listen);
  listenMock.mockReset();
  listenMock.mockImplementation(
    async (_event: string, _callback: (event: Event<unknown>) => void) => {
      return vi.fn() as UnlistenFn;
    }
  );

  groupPathStore.reset();
  i18nStore.init('en');

  vi.mocked(open).mockReset();
  vi.mocked(open).mockResolvedValue('/path/to/selected/file');

  await clearDatabase();
});

async function openAudioScriptEpisodeModal() {
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();

  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  await page.getByRole('button', { name: 'Open the audio + script workflow' }).click();
  await waitForFadeTransition();

  await tick();
}

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('success: renders file episode form', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Check that the file episode modal is open and renders the form
  await expect.element(page.getByText('Add New Episode')).toBeInTheDocument();
  await expect.element(page.getByLabelText('Audio File')).toBeInTheDocument();
  await expect
    .element(page.getByLabelText('Subtitle File (*.srt, *.vtt, *.sswt, *.tsv, *.txt)'))
    .toBeInTheDocument();
  await expect.element(page.getByPlaceholder("Episode's title")).toBeInTheDocument();

  await page.screenshot();
});

test('success: handles file selection and language detection', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Click the audio file select button
  await page.getByTestId('audio-file-select').click();

  // Mock file selection to return SRT file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  // Click the script file select button
  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);
  await page.screenshot();

  // Language detection should be triggered automatically after file selection
  // Wait for language to be detected and selected
  const languageSelect = page.getByLabelText('Learning Target Language');
  await expect.element(languageSelect).toHaveValue('en');
});

test('success: handles submit request with valid payload', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Fill in the form via UI
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Test Episode');

  await page.getByTestId('audio-file-select').click();

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);

  // Language should be auto-selected after detection
  const languageSelect = page.getByLabelText('Learning Target Language');
  await expect.element(languageSelect).toHaveValue('en');

  // Click submit
  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();

  // Check that the modal is closed (successful submission)
  await expect
    .element(page.getByRole('heading', { name: 'Add New Episode' }))
    .not.toBeInTheDocument();

  await page.screenshot();
});

test('success: handles TSV configuration', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Mock file selection to return TSV file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.tsv');

  // Override read_text_file mock for TSV
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'read_text_file') {
      return 'start_time\ttext\n00:00:00,000\tHello world\n00:00:05,000\tHow are you?';
    }
    return defaultInvokeMock(command);
  });

  // Select TSV file via UI
  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);
  await page.screenshot();

  // TSV configuration should appear automatically
  await expect.element(page.getByText('TSV Column Settings')).toBeInTheDocument();
  await expect.element(page.getByLabelText('Start Time Column')).toBeInTheDocument();
  await expect.element(page.getByLabelText('Text Column')).toBeInTheDocument();

  await userEvent.selectOptions(page.getByTestId('startTimeColumn'), '0');
  await userEvent.selectOptions(page.getByTestId('textColumn'), '1');
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Test Episode');
  await page.getByTestId('audio-file-select').click();
  await page.screenshot();

  // Click submit
  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();

  // Check that the modal is closed (successful submission)
  await page.screenshot();
  await expect.element(page.getByText('Test Episode')).toBeInTheDocument();
  await expect
    .element(page.getByRole('heading', { name: 'Add New Episode' }))
    .not.toBeInTheDocument();
});

test('error: handles form validation errors', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Fill only title via UI
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Test Episode');

  // Try to submit without filling required fields
  const createButton = page.getByRole('button', { name: 'Create' });
  await createButton.click();

  // Check that error message is shown
  await expect
    .element(
      page.getByText('Please select an audio file or check the option to generate audio using TTS.')
    )
    .toBeInTheDocument();

  await page.screenshot();
});

test('success: handles no script language detected', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Mock the invoke function to return an error for language detection
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'detect_language_from_text') {
      return null;
    }
    return defaultInvokeMock(command);
  });

  // Select audio file first
  await page.getByTestId('audio-file-select').click();

  // Mock file selection to return SRT file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  // Click the script file select button
  await page.getByTestId('script-file-select').click();

  // Wait for async operations and error handling
  await waitFor(200);
  await page.screenshot();

  // Check that an error toast or message is displayed
  await expect.element(page.getByText('No language detected')).toBeInTheDocument();

  // Verify that the language select shows default value
  const learningLanguageSelect = page.getByTestId('learningLanguage');
  await expect.element(learningLanguageSelect).toHaveValue('en');
});

test('error: handles script language detection error', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Mock the invoke function to return an error for language detection
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'detect_language_from_text') {
      throw new Error('Failed to detect language: Unsupported text format');
    }
    return defaultInvokeMock(command);
  });

  // Select audio file first
  await page.getByTestId('audio-file-select').click();

  // Mock file selection to return SRT file
  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  // Click the script file select button
  await page.getByTestId('script-file-select').click();

  // Wait for async operations and error handling
  await waitFor(200);
  await page.screenshot();

  // Check that an error toast or message is displayed
  await expect.element(page.getByText('Failed to auto-detect language')).toBeInTheDocument();

  // Verify that the language select shows default value
  const learningLanguageSelect = page.getByTestId('learningLanguage');
  await expect.element(learningLanguageSelect).toHaveValue('en');
});

test('error: handles episode creation failure', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Fill in the form via UI
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Test Episode');

  await page.getByTestId('audio-file-select').click();

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);

  // Mock the addNewEpisode usecase to throw an error
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'copy_audio_file') {
      throw new Error('Failed to copy audio file: Disk full');
    }
    return defaultInvokeMock(command);
  });

  // Try to submit
  await page.screenshot();
  await page.getByRole('button', { name: 'Create' }).click();

  // Wait for error handling
  await waitFor(200);
  await page.screenshot();

  // Check that error message is displayed
  await expect.element(page.getByText('Failed to add new episode.')).toBeInTheDocument();

  // Verify that the modal is closed
  await expect
    .element(page.getByRole('heading', { name: 'Add New Episode' }))
    .not.toBeInTheDocument();
});

test('error: handles file read failure', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Fill in the form via UI
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Test Episode');

  await page.getByTestId('audio-file-select').click();

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);

  // Mock the read_text_file command to return invalid SRT content
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command) => {
    if (command === 'read_text_file') {
      throw 'File not found.';
    }
    return defaultInvokeMock(command);
  });

  // Try to submit
  await page.screenshot();
  await page.getByRole('button', { name: 'Create' }).click();

  // Wait for error handling
  await waitFor(200);
  await page.screenshot();

  // Check that error message is displayed
  await expect.element(page.getByText('Failed to add new episode.')).toBeInTheDocument();

  // Verify that the modal is closed
  await expect
    .element(page.getByRole('heading', { name: 'Add New Episode' }))
    .not.toBeInTheDocument();
});

test('error: handles episode database insertion failure', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Fill in the form via UI
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Test Episode');

  await page.getByTestId('audio-file-select').click();

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);

  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockImplementation(async (sql: string) => {
    if (sql.startsWith('INSERT INTO episodes')) {
      throw new Error('Database insertion error: UNIQUE constraint failed');
    }
    return { lastInsertId: 0, rowsAffected: 0 };
  });

  try {
    // Try to submit
    await page.screenshot();
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for error handling
    await waitFor(200);
    await page.screenshot();

    // Check that error message is displayed
    await expect.element(page.getByText('Failed to add new episode.')).toBeInTheDocument();

    // Verify that the modal is closed
    await expect
      .element(page.getByRole('heading', { name: 'Add New Episode' }))
      .not.toBeInTheDocument();
  } finally {
    executeSpy.mockRestore();
  }
});

test('error: handles content insertion failure', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  await openAudioScriptEpisodeModal();

  // Fill in the form via UI
  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Test Episode');

  await page.getByTestId('audio-file-select').click();

  vi.mocked(open).mockResolvedValue('/path/to/selected/file.srt');
  await page.getByTestId('script-file-select').click();

  // Wait for async operations
  await waitFor(100);

  // Mock database failure
  const originalExecute = Database.prototype.execute;
  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockImplementation(async function (
    this: Database,
    sql: string,
    bindValues?: unknown[]
  ) {
    if (sql.startsWith('INSERT INTO dialogues')) {
      throw new Error('Database insertion error: UNIQUE constraint failed');
    }
    return originalExecute.apply(this, [sql, bindValues]);
  });

  try {
    // Try to submit
    await page.screenshot();
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for error handling
    await waitFor(200);
    await page.screenshot();

    // Check that error message is displayed
    await expect.element(page.getByText('Failed to add new episode.')).toBeInTheDocument();

    // Verify that the modal is closed
    await expect
      .element(page.getByRole('heading', { name: 'Add New Episode' }))
      .not.toBeInTheDocument();
  } finally {
    executeSpy.mockRestore();
  }
});
