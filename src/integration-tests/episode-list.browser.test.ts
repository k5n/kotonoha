import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { outputCoverage } from '$lib/testing/outputCoverage';
import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/episode-list/[groupId]/$types';
import { load } from '../routes/episode-list/[groupId]/+page';
import Component from '../routes/episode-list/[groupId]/+page.svelte';

import '$src/app.css';

vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');

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

async function insertEpisode(params: {
  episodeGroupId: number;
  title: string;
  displayOrder: number;
}): Promise<void> {
  const { episodeGroupId, title, displayOrder } = params;
  const now = new Date().toISOString();
  const db = new Database(DATABASE_URL);
  await db.execute(
    `INSERT INTO episodes (episode_group_id, display_order, title, media_path, learning_language, explanation_language, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [episodeGroupId, displayOrder, title, `media/${title}.mp3`, 'ja', 'en', now, now]
  );
}

beforeEach(async () => {
  const invokeMock = vi.mocked(invoke);
  invokeMock.mockReset();
  invokeMock.mockImplementation(async (command) => {
    if (command === 'get_env_prefix_command') {
      return '';
    }
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  groupPathStore.reset();
  episodeAddStore.close();
  i18nStore.init('en');
  vi.clearAllMocks();

  await clearDatabase();
});

afterAll(async () => {
  await outputCoverage('episode-list-integration');
});

test('success: episode list loads and displays episodes for the selected group', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Beginner Course' });
  await insertEpisode({ episodeGroupId: groupId, title: 'Episode 1', displayOrder: 1 });
  await insertEpisode({ episodeGroupId: groupId, title: 'Episode 2', displayOrder: 2 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await load({ params: { groupId: String(groupId) } } as any)) as PageData;

  expect(result.errorKey).toBeNull();
  expect(result.episodeGroup?.name).toBe('Beginner Course');
  expect(result.episodes).toHaveLength(2);

  render(Component, { data: result, params: { groupId: String(groupId) } });

  await expect.element(page.getByRole('heading', { name: 'Beginner Course' })).toBeInTheDocument();
  await expect.element(page.getByText('Add Episode')).toBeInTheDocument();
  await expect.element(page.getByText('Episode 1')).toBeInTheDocument();
  await expect.element(page.getByText('Episode 2')).toBeInTheDocument();
  await expect.element(page.getByText('Title')).toBeInTheDocument();
  await expect.element(page.getByText('Date Added')).toBeInTheDocument();
  await expect.element(page.getByText('Cards')).toBeInTheDocument();

  await page.screenshot();
});

test('error: error message is shown when episode fetching fails due to database error', async () => {
  const selectSpy = vi.spyOn(Database.prototype, 'select');
  selectSpy.mockRejectedValue(new Error('Database failure'));

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await load({ params: { groupId: '999' } } as any)) as PageData;

    expect(result.episodeGroup).toBeNull();
    expect(result.episodes).toHaveLength(0);
    expect(result.errorKey).toBe('episodeListPage.errors.fetchEpisodes');

    render(Component, { data: result, params: { groupId: '999' } });

    await expect.element(page.getByText('Failed to fetch episodes.')).toBeInTheDocument();
    await expect.element(page.getByText('Loading...')).toBeInTheDocument();

    await page.screenshot();
  } finally {
    selectSpy.mockRestore();
  }
});
