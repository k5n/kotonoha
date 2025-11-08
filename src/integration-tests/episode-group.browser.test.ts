import { goto, invalidateAll } from '$app/navigation';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import * as pluginFs from '$lib/infrastructure/mocks/plugin-fs';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { outputCoverage } from '$lib/testing/outputCoverage';
import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/[...groupId]/$types';
import { load } from '../routes/[...groupId]/+page';
import Component from '../routes/[...groupId]/+page.svelte';

import '$src/app.css';

vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-fs', () => pluginFs);

const DATABASE_URL = 'dummy';
const ROOT_GROUP_PARAM = '';

type GroupRow = {
  id: number;
  name: string;
  display_order: number;
  parent_group_id: number | null;
  group_type: 'album' | 'folder';
};

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
  const { name, groupType = 'folder', displayOrder = 1, parentId = null } = params;
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
  displayOrder?: number;
}): Promise<number> {
  const { episodeGroupId, title, displayOrder = 1 } = params;
  const now = new Date().toISOString();
  const db = new Database(DATABASE_URL);
  await db.execute(
    `INSERT INTO episodes (episode_group_id, display_order, title, media_path, learning_language, explanation_language, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      episodeGroupId,
      displayOrder,
      title,
      `media/${title.toLowerCase().replace(/\s+/g, '-')}/full.mp3`,
      'ja',
      'en',
      now,
      now,
    ]
  );
  const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() AS id');
  return rows[0]?.id ?? 0;
}

async function selectAllGroups(): Promise<readonly GroupRow[]> {
  const db = new Database(DATABASE_URL);
  return await db.select<GroupRow[]>(
    'SELECT id, name, display_order, parent_group_id, group_type FROM episode_groups ORDER BY id'
  );
}

async function countEpisodes(): Promise<number> {
  const db = new Database(DATABASE_URL);
  const rows = await db.select<{ count: number }[]>('SELECT COUNT(*) AS count FROM episodes');
  return rows[0]?.count ?? 0;
}

async function openGroupActionsMenu(episodeId: string): Promise<void> {
  const element = page.getByTestId(`group-actions-button-${episodeId}`);
  await expect.element(element).toBeVisible();
  await element.click();
}

async function loadPageData(groupId: string = ROOT_GROUP_PARAM): Promise<PageData> {
  return (await load({ params: { groupId } } as never)) as PageData;
}

type RouteParams = { groupId: string };

function createRouteParams(groupId: string = ROOT_GROUP_PARAM): RouteParams {
  return { groupId };
}

async function setupPage(groupId: string = ROOT_GROUP_PARAM) {
  const params = createRouteParams(groupId);
  const data = await loadPageData(groupId);
  const renderResult = render(Component, { data, params });
  return { data, params, renderResult };
}

beforeEach(async () => {
  groupPathStore.reset();
  i18nStore.init('en');
  pluginFs.__reset();
  vi.clearAllMocks();

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockReset();
  invokeMock.mockImplementation(async (command) => {
    if (command === 'get_env_prefix_command') {
      return '';
    }
    if (command === 'read_text_file') {
      return '';
    }
    if (command === 'copy_audio_file') {
      return null;
    }
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  vi.mocked(goto).mockReset();
  vi.mocked(goto).mockResolvedValue();
  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue();

  await clearDatabase();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('empty: shows empty state when no episode groups exist', async () => {
  const { data } = await setupPage();

  expect(data.groups).toHaveLength(0);
  expect(data.errorKey).toBeNull();

  await expect.element(page.getByRole('heading', { name: 'Group List' })).toBeInTheDocument();
  await expect.element(page.getByText('No Groups')).toBeInTheDocument();
  await expect
    .element(page.getByText("Let's add the first group to organize your content."))
    .toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Add First Group' })).toBeInTheDocument();

  await page.screenshot();
});

test('success: displays folder and album groups', async () => {
  await insertEpisodeGroup({ name: 'Grammar Folders', groupType: 'folder', displayOrder: 1 });
  await insertEpisodeGroup({ name: 'Listening Album', groupType: 'album', displayOrder: 2 });

  const { data } = await setupPage();

  expect(data.groups.map((g) => g.groupType)).toEqual(['folder', 'album']);

  await expect.element(page.getByText('Grammar Folders')).toBeInTheDocument();
  await expect.element(page.getByText('Listening Album')).toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Add New' })).toBeEnabled();

  await page.screenshot();
});

test('error: shows translated error when fetching groups fails', async () => {
  const selectSpy = vi.spyOn(Database.prototype, 'select');
  selectSpy.mockRejectedValue(new Error('database unavailable'));

  try {
    const data = (await loadPageData()) as PageData;
    render(Component, { data, params: createRouteParams() });

    expect(data.groups).toHaveLength(0);
    expect(data.errorKey).toBe('groupPage.errors.fetchGroups');

    await expect.element(page.getByText('Failed to fetch groups.')).toBeInTheDocument();
    await page.screenshot();
  } finally {
    selectSpy.mockRestore();
  }
});

test('interaction: user can add a new album group via the modal', async () => {
  const { params, renderResult } = await setupPage();

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.groupId);
    await renderResult.rerender({ data: refreshed, params });
  });

  await page.screenshot();
  await page.getByRole('button', { name: 'Add New' }).click();
  await expect.element(page.getByRole('heading', { name: 'Add New Group' })).toBeInTheDocument();
  await page.screenshot();

  const nameInput = page.getByLabelText('Group Name');
  await nameInput.fill('New Audio Album');
  await page.getByLabelText('Album').click();
  await page.screenshot();
  await page.getByRole('button', { name: 'Create' }).click();

  await expect
    .element(page.getByRole('heading', { name: 'Add New Group' }))
    .not.toBeInTheDocument();
  await expect.element(page.getByText('New Audio Album')).toBeInTheDocument();

  const groups = await selectAllGroups();
  expect(groups).toHaveLength(1);
  expect(groups[0]).toMatchObject({
    name: 'New Audio Album',
    group_type: 'album',
    parent_group_id: null,
  });

  await page.screenshot();
});

test('interaction: user can rename an existing group', async () => {
  const initialName = 'Reading Club';
  const groupId = await insertEpisodeGroup({ name: initialName, groupType: 'folder' });

  const { params, renderResult } = await setupPage();

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.groupId);
    await renderResult.rerender({ data: refreshed, params });
  });

  await page.screenshot();
  await openGroupActionsMenu(groupId.toString());
  const renameButton = page.getByTestId(`group-action-rename-${groupId}`);
  await expect.element(renameButton).toBeVisible();
  await renameButton.click();
  await expect.element(page.getByRole('heading', { name: 'Edit Group Name' })).toBeInTheDocument();
  await page.screenshot();

  const input = page.getByLabelText('Group Name');
  await input.clear();
  await input.fill('Updated Reading Club');
  await page.screenshot();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect
    .element(page.getByRole('heading', { name: 'Edit Group Name' }))
    .not.toBeInTheDocument();
  await expect.element(page.getByText('Updated Reading Club')).toBeInTheDocument();

  const groups = await selectAllGroups();
  expect(groups[0]?.name).toBe('Updated Reading Club');

  await page.screenshot();
});

test('interaction: user can delete a group and its episodes', async () => {
  const groupName = 'Archive Folder';
  const groupId = await insertEpisodeGroup({ name: groupName, groupType: 'folder' });
  await insertEpisode({ episodeGroupId: groupId, title: 'Episode 1' });

  const { params, renderResult } = await setupPage();

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.groupId);
    await renderResult.rerender({ data: refreshed, params });
  });

  await page.screenshot();
  await openGroupActionsMenu(groupId.toString());
  const deleteButton = page.getByTestId(`group-action-delete-${groupId}`);
  await expect.element(deleteButton).toBeVisible();
  await page.screenshot();
  await deleteButton.click();

  await expect.element(page.getByText(/delete the group "Archive Folder"/)).toBeInTheDocument();
  await page.screenshot();
  await page.getByRole('button', { name: 'Yes, delete' }).click();

  await expect.element(page.getByText(/delete the group "Archive Folder"/)).not.toBeInTheDocument();
  await expect.element(page.getByText('No Groups')).toBeInTheDocument();

  const groups = await selectAllGroups();
  expect(groups).toHaveLength(0);
  expect(await countEpisodes()).toBe(0);

  await page.screenshot();
});
