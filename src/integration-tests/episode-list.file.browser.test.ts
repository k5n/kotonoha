import { invalidateAll } from '$app/navigation';
import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/episode-list/[groupId]/$types';
import { load } from '../routes/episode-list/[groupId]/+page';
import Component from '../routes/episode-list/[groupId]/+page.svelte';
import { outputCoverage } from './lib/outputCoverage';
import { waitForFadeTransition } from './lib/utils';

import '$src/app.css';

vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppLocalData: 'appData' },
  exists: vi.fn().mockResolvedValue(false),
  remove: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn().mockResolvedValue(undefined),
}));

const DATABASE_URL = 'dummy';

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

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.groupId);
    await renderResult.rerender({ data: refreshed, params });
  });

  return { data, params, renderResult };
}

beforeEach(async () => {
  vi.clearAllMocks();

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockReset();
  invokeMock.mockImplementation(async (command) => {
    if (command === 'get_env_prefix_command') {
      return '';
    }
    if (command === 'detect_script_language') {
      return { detectedLanguage: 'en', supportedLanguages: ['en', 'ja'] };
    }
    if (command === 'copy_audio_file') {
      return '/path/to/copied/audio.mp3';
    }
    if (command === 'read_text_file') {
      return '1\n00:00:00,000 --> 00:00:05,000\nHello world\n';
    }
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue(undefined);

  groupPathStore.reset();
  i18nStore.init('en');

  await clearDatabase();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('renders file episode form', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Click the add episode button to open the source selection modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();

  // Click the file selection button
  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  // Check that the file episode modal is open and renders the form
  await expect.element(page.getByText('Add New Episode')).toBeInTheDocument();
  await expect.element(page.getByLabelText('Audio File')).toBeInTheDocument();
  await expect
    .element(page.getByLabelText('Subtitle File (*.srt, *.vtt, *.sswt, *.tsv, *.txt)'))
    .toBeInTheDocument();
  await expect.element(page.getByPlaceholder("Episode's title")).toBeInTheDocument();

  await page.screenshot();
});

test('handles file selection and language detection', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Open the file modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  // Mock file selection by directly setting the store values
  fileEpisodeAddStore.audioFilePath = '/path/to/audio.mp3';
  fileEpisodeAddStore.scriptFilePath = '/path/to/script.srt';

  // Trigger language detection by calling the store method
  fileEpisodeAddStore.completeLanguageDetection('en', ['en', 'ja']);

  // Check that language is detected and selected
  const languageSelect = page.getByLabelText('Learning Target Language');
  await expect.element(languageSelect).toHaveValue('en');

  await page.screenshot();
});

test('handles TSV configuration', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Open the file modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  // Set TSV file path directly
  fileEpisodeAddStore.scriptFilePath = '/path/to/script.tsv';

  // Mock TSV preview data
  fileEpisodeAddStore.tsv.completeScriptPreviewFetching({
    headers: ['start', 'end', 'text'],
    rows: [['00:00:00', '00:00:05', 'Hello world']],
  });

  // Check TSV configuration section appears
  await expect.element(page.getByText('TSV Column Settings')).toBeInTheDocument();
  await expect.element(page.getByLabelText('Start Time Column')).toBeInTheDocument();
  await expect.element(page.getByLabelText('Text Column')).toBeInTheDocument();

  await page.screenshot();
});

test('handles submit request with valid payload', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Open the file modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  // Fill in the form by setting store values directly
  fileEpisodeAddStore.title = 'Test Episode';
  fileEpisodeAddStore.audioFilePath = '/path/to/audio.mp3';
  fileEpisodeAddStore.scriptFilePath = '/path/to/script.srt';
  fileEpisodeAddStore.completeLanguageDetection('en', ['en', 'ja']);
  fileEpisodeAddStore.selectedStudyLanguage = 'en';

  // Click submit
  await page.getByRole('button', { name: 'Create' }).click();
  await waitForFadeTransition();

  // Check that the modal is closed (successful submission)
  await expect
    .element(page.getByRole('heading', { name: 'Add New Episode' }))
    .not.toBeInTheDocument();

  await page.screenshot();
});

test('handles form validation errors', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Open the file modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  // Set title but not audio file
  fileEpisodeAddStore.title = 'Test Episode';

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

test('closes on cancel', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Open the file modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  // Check modal is open
  await expect.element(page.getByRole('heading', { name: 'Add New Episode' })).toBeInTheDocument();

  // Click cancel
  await page.getByRole('button', { name: 'Cancel' }).click();
  await waitForFadeTransition();

  // Check modal is closed
  await expect
    .element(page.getByRole('heading', { name: 'Add New Episode' }))
    .not.toBeInTheDocument();

  await page.screenshot();
});
