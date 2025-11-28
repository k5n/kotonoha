import { invalidateAll } from '$app/navigation';
import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { fetch } from '@tauri-apps/plugin-http';
import Database from '@tauri-apps/plugin-sql';
import { Stronghold } from '@tauri-apps/plugin-stronghold';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/episode-list/[groupId]/$types';
import { load } from '../routes/episode-list/[groupId]/+page';
import Component from '../routes/episode-list/[groupId]/+page.svelte';
import { setupStrongholdMock } from './lib/mockFactories';
import { outputCoverage } from './lib/outputCoverage';
import { waitFor, waitForFadeTransition } from './lib/utils';

import '$src/app.css';

vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/plugin-stronghold');
vi.mock('@tauri-apps/api/path');
vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppLocalData: 'appData' },
  exists: vi.fn().mockResolvedValue(false),
  remove: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: vi.fn(),
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
    if (command === 'get_stronghold_password') {
      return 'test-password';
    }
    if (command === 'fetch_youtube_subtitle') {
      return [];
    }
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  const fetchMock = vi.mocked(fetch);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url, _options) => {
    if (typeof url === 'string' && url.includes('youtube.com/oembed')) {
      return {
        ok: true,
        json: async () => ({ title: 'Test Video' }),
      } as Response;
    }
    if (typeof url === 'string' && url.includes('googleapis.com/youtube/v3/captions')) {
      return {
        ok: true,
        json: async () => ({
          items: [{ snippet: { language: 'en', trackKind: 'asr' } }],
        }),
      } as Response;
    }
    throw new Error(`Unhandled fetch: ${url}`);
  });

  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue(undefined);

  groupPathStore.reset();
  i18nStore.init('en');
  apiKeyStore.youtube.reset();

  await clearDatabase();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('renders YouTube episode form', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Click the add episode button to open the source selection modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();

  // Click the YouTube selection button
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();
  await waitForFadeTransition();

  // Check that the YouTube episode modal is open and renders the form
  await expect.element(page.getByText('Add New Episode')).toBeInTheDocument();
  await expect.element(page.getByLabelText('YouTube URL')).toBeInTheDocument();
  await expect.element(page.getByPlaceholder("Episode's title")).toBeInTheDocument();

  await page.screenshot();
});

test('handles URL input and validation', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });
  apiKeyStore.youtube.set('test-api-key');

  await setupPage(String(groupId));

  // Mock the invoke for YouTube metadata
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command, _args) => {
    if (command === 'fetch_youtube_metadata') {
      return {
        title: 'Test Video',
        language: 'en',
        trackKind: 'asr',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      };
    }
    if (command === 'get_env_prefix_command') {
      return '';
    }
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  // Open the YouTube modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();

  // Input a valid YouTube URL
  const urlInput = page.getByLabelText('YouTube URL');
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await waitFor(1000);

  // Check that metadata is fetched and title input shows the fetched title
  const titleInput = page.getByPlaceholder("Episode's title");
  await expect.element(titleInput).toHaveValue('Test Video');

  await page.screenshot();
});

test('fetches YouTube API key from Stronghold when store is empty', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  apiKeyStore.youtube.reset();

  const { stronghold } = setupStrongholdMock({ youtubeApiKey: 'stored-youtube-api-key' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(Stronghold.load).mockResolvedValue(stronghold as any);
  vi.mocked(appDataDir).mockResolvedValue('/mock/appdata');

  const fetchMock = vi.mocked(fetch);
  fetchMock.mockImplementation(async (url, _options) => {
    if (typeof url === 'string' && url.includes('youtube.com/oembed')) {
      return {
        ok: true,
        json: async () => ({ title: 'Stored Key Video' }),
      } as Response;
    }
    if (typeof url === 'string' && url.includes('googleapis.com/youtube/v3/captions')) {
      expect(url).toContain('key=stored-youtube-api-key');
      return {
        ok: true,
        json: async () => ({
          items: [{ snippet: { language: 'en', trackKind: 'asr' } }],
        }),
      } as Response;
    }
    throw new Error(`Unhandled fetch: ${url}`);
  });

  await setupPage(String(groupId));

  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();

  const urlInput = page.getByLabelText('YouTube URL');
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await waitFor(1000);

  expect(apiKeyStore.youtube.value).toBe('stored-youtube-api-key');

  const titleInput = page.getByPlaceholder("Episode's title");
  await expect.element(titleInput).toHaveValue('Stored Key Video');

  const googleApiCall = fetchMock.mock.calls.find(
    ([firstArg]) =>
      typeof firstArg === 'string' && firstArg.includes('googleapis.com/youtube/v3/captions')
  );
  expect(googleApiCall?.[0]).toContain('key=stored-youtube-api-key');

  await page.screenshot();
});

test('handles submit request with valid payload', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });
  apiKeyStore.youtube.set('test-api-key');

  await setupPage(String(groupId));

  // Mock the invoke for YouTube metadata and episode creation
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command, _args) => {
    if (command === 'fetch_youtube_metadata') {
      return {
        title: 'Test Video',
        language: 'en',
        trackKind: 'asr',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      };
    }
    if (command === 'get_env_prefix_command') {
      return '';
    }
    if (command === 'fetch_youtube_subtitle') {
      return [];
    }
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  // Open the YouTube modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();

  // Input URL and wait for metadata
  const urlInput = page.getByLabelText('YouTube URL');
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await waitFor(1000);
  await page.screenshot();

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

  // Open the YouTube modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();
  await waitForFadeTransition();

  // Check that the Create button is disabled when no URL is entered
  const createButton = page.getByRole('button', { name: 'Create' });
  await expect.element(createButton).toBeDisabled();

  await page.screenshot();
});

test('closes on cancel', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Open the YouTube modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();
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

test('resets state on reopen after cancel', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });
  apiKeyStore.youtube.set('test-api-key');

  await setupPage(String(groupId));

  // Mock the invoke for YouTube metadata
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockImplementation(async (command, _args) => {
    if (command === 'fetch_youtube_metadata') {
      return {
        title: 'Test Video',
        language: 'en',
        trackKind: 'asr',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      };
    }
    if (command === 'get_env_prefix_command') {
      return '';
    }
    if (command === 'fetch_youtube_subtitle') {
      return [];
    }
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  // First open: Input URL and modify title
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();

  const urlInput = page.getByLabelText('YouTube URL');
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await waitFor(1000);

  const titleInput = page.getByPlaceholder("Episode's title");
  await titleInput.fill('Modified Title');
  await page.screenshot();

  // Cancel and close
  await page.getByRole('button', { name: 'Cancel' }).click();

  // Reopen the modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();
  await waitForFadeTransition();

  // Check that state is reset: URL and title should be empty/default
  await expect.element(urlInput).toHaveValue('');
  await expect.element(titleInput).toHaveValue('');

  await page.screenshot();
});
