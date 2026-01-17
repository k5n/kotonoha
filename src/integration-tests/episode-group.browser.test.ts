import { goto, invalidateAll } from '$app/navigation';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import * as pluginFs from '$lib/infrastructure/mocks/plugin-fs';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import type { PageData } from '../routes/[...groupId]/$types';
import { load } from '../routes/[...groupId]/+page';
import Component from '../routes/[...groupId]/+page.svelte';
import { clearDatabase, DATABASE_URL, insertEpisode, insertEpisodeGroup } from './lib/database';
import { outputCoverage } from './lib/outputCoverage';
import { waitForFadeTransition } from './lib/utils';

import '$src/app.css';

vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-fs', () => pluginFs);

const ROOT_GROUP_PARAM = '';

type GroupRow = {
  id: string;
  content: string;
  display_order: number;
  parent_group_id: string | null;
  group_type: 'album' | 'folder';
  updated_at: string;
};

async function selectAllGroups(): Promise<readonly GroupRow[]> {
  const db = new Database(DATABASE_URL);
  return await db.select<GroupRow[]>(
    `SELECT id, parent_group_id, display_order, group_type, content, updated_at
     FROM episode_groups
     ORDER BY display_order, id`
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

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.groupId);
    await renderResult.rerender({ data: refreshed, params });
  });

  return { data, params, renderResult };
}

beforeEach(async () => {
  vi.clearAllMocks();

  groupPathStore.reset();
  i18nStore.init('en');
  pluginFs.__reset();

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

  await expect.element(page.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
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
    await expect.element(page.getByRole('button', { name: 'Add New' })).toBeDisabled();
    await page.screenshot();
  } finally {
    selectSpy.mockRestore();
  }
});

test('interaction: user can add a new album group via the modal', async () => {
  await setupPage();

  await page.screenshot();
  await page.getByRole('button', { name: 'Add New' }).click();
  await expect.element(page.getByRole('heading', { name: 'Add New Group' })).toBeInTheDocument();
  await waitForFadeTransition();
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
  const [group] = groups;
  expect(group.group_type).toBe('album');
  expect(group.parent_group_id).toBeNull();
  expect(JSON.parse(group.content)).toMatchObject({ name: 'New Audio Album' });

  await page.screenshot();
});

test('interaction: user can rename an existing group', async () => {
  const initialName = 'Reading Club';
  const groupId = await insertEpisodeGroup({ name: initialName, groupType: 'folder' });

  await setupPage();

  await page.screenshot();
  await openGroupActionsMenu(groupId.toString());
  const renameButton = page.getByTestId(`group-action-rename-${groupId}`);
  await expect.element(renameButton).toBeVisible();
  await renameButton.click();
  await expect.element(page.getByRole('heading', { name: 'Edit Group Name' })).toBeInTheDocument();
  await waitForFadeTransition();
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
  expect(JSON.parse(groups[0]?.content ?? '{}').name).toBe('Updated Reading Club');

  await page.screenshot();
});

test('interaction: user can delete a group and its episodes', async () => {
  const groupName = 'Archive Folder';
  const groupId = await insertEpisodeGroup({ name: groupName, groupType: 'folder' });
  await insertEpisode({ episodeGroupId: groupId, title: 'Episode 1' });

  await setupPage();

  await page.screenshot();
  await openGroupActionsMenu(groupId.toString());
  const deleteButton = page.getByTestId(`group-action-delete-${groupId}`);
  await expect.element(deleteButton).toBeVisible();
  await waitForFadeTransition();
  await page.screenshot();
  await deleteButton.click();

  await expect.element(page.getByText(/delete the group "Archive Folder"/)).toBeInTheDocument();
  await waitForFadeTransition();
  await page.screenshot();
  await page.getByRole('button', { name: 'Yes, delete' }).click();

  await expect.element(page.getByText(/delete the group "Archive Folder"/)).not.toBeInTheDocument();
  await expect.element(page.getByText('No Groups')).toBeInTheDocument();

  const groups = await selectAllGroups();
  expect(groups).toHaveLength(0);
  expect(await countEpisodes()).toBe(0);

  await page.screenshot();
});

test('interaction: user can move a group to another folder (success)', async () => {
  // DB setup
  const parentId = await insertEpisodeGroup({ name: 'Parent Folder', groupType: 'folder' });
  const childId = await insertEpisodeGroup({ name: 'Child Folder', groupType: 'folder' });

  // Setup page
  await setupPage();
  await expect.element(page.getByText('Parent Folder')).toBeInTheDocument();
  await expect.element(page.getByText('Child Folder')).toBeInTheDocument();

  // Open actions menu for child
  await openGroupActionsMenu(childId.toString());
  const moveButton = page.getByTestId(`group-action-move-${childId}`);
  await expect.element(moveButton).toBeVisible();
  await page.screenshot();
  await moveButton.click();
  await waitForFadeTransition();
  await expect.element(page.getByRole('heading', { name: 'Move Group' })).toBeInTheDocument();
  await page.screenshot();

  // Select parent
  const selectElement = page.getByTestId('parent-group-select');
  await userEvent.selectOptions(selectElement, 'Parent Folder');
  await page.screenshot();

  // Submit
  await page.getByTestId('move-group-submit').click();
  await waitForFadeTransition();
  await page.screenshot();

  // Assert DB
  const groups = await selectAllGroups();
  const movedGroup = groups.find((g) => g.id === childId);
  expect(movedGroup?.parent_group_id).toBe(parentId);

  // Optional UI assert
  await expect.element(page.getByText('Child Folder')).not.toBeInTheDocument();
});

test('interaction error: shows error when adding group fails', async () => {
  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockImplementation(async (sql: string) => {
    if (sql.includes('INSERT INTO episode_groups')) {
      throw new Error('Database insert failed');
    }
    return { lastInsertId: 0, rowsAffected: 0 };
  });

  try {
    await setupPage();

    await page.getByRole('button', { name: 'Add New' }).click();
    await expect.element(page.getByRole('heading', { name: 'Add New Group' })).toBeInTheDocument();

    const nameInput = page.getByLabelText('Group Name');
    await nameInput.fill('New Album');
    await page.getByLabelText('Album').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await waitForFadeTransition();

    await expect.element(page.getByText('Failed to add new group.')).toBeInTheDocument();
    await expect
      .element(page.getByRole('heading', { name: 'Add New Group' }))
      .not.toBeInTheDocument();

    const groups = await selectAllGroups();
    expect(groups).toHaveLength(0);

    await page.screenshot();
  } finally {
    executeSpy.mockRestore();
  }
});

test('interaction error: shows error when renaming group fails', async () => {
  const initialName = 'Reading Club';
  const groupId = await insertEpisodeGroup({ name: initialName, groupType: 'folder' });

  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockImplementation(async (sql: string) => {
    if (sql.includes('UPDATE episode_groups SET content')) {
      throw new Error('Database update failed');
    }
    return { lastInsertId: 0, rowsAffected: 0 };
  });

  try {
    await setupPage();

    await openGroupActionsMenu(groupId.toString());
    const renameButton = page.getByTestId(`group-action-rename-${groupId}`);
    await expect.element(renameButton).toBeVisible();
    await renameButton.click();
    await expect
      .element(page.getByRole('heading', { name: 'Edit Group Name' }))
      .toBeInTheDocument();

    const input = page.getByLabelText('Group Name');
    await input.clear();
    await input.fill('Updated Reading Club');
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForFadeTransition();

    await expect.element(page.getByText('Failed to update group name.')).toBeInTheDocument();
    await expect
      .element(page.getByRole('heading', { name: 'Edit Group Name' }))
      .not.toBeInTheDocument();

    const groups = await selectAllGroups();
    expect(JSON.parse(groups[0]?.content ?? '{}').name).toBe(initialName);

    await page.screenshot();
  } finally {
    executeSpy.mockRestore();
  }
});

test('interaction error: shows error when deleting group fails', async () => {
  const groupName = 'Archive Folder';
  const groupId = await insertEpisodeGroup({ name: groupName, groupType: 'folder' });
  await insertEpisode({ episodeGroupId: groupId, title: 'Episode 1' });

  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockImplementation(async (sql: string) => {
    if (sql.includes('DELETE FROM episode_groups')) {
      throw new Error('Database delete failed');
    }
    return { lastInsertId: 0, rowsAffected: 0 };
  });

  try {
    await setupPage();

    await openGroupActionsMenu(groupId.toString());
    const deleteButton = page.getByTestId(`group-action-delete-${groupId}`);
    await expect.element(deleteButton).toBeVisible();
    await deleteButton.click();
    await waitForFadeTransition();
    await page.screenshot();

    await expect.element(page.getByText(/delete the group "Archive Folder"/)).toBeInTheDocument();
    await page.getByRole('button', { name: 'Yes, delete' }).click();
    await waitForFadeTransition(); // disappearance of modal
    await waitForFadeTransition(); // appearance of error toast

    await expect.element(page.getByText('Failed to delete group.')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Yes, delete' })).not.toBeInTheDocument();

  const groups = await selectAllGroups();
  expect(groups).toHaveLength(1);
  expect(await countEpisodes()).toBe(1);

    await page.screenshot();
  } finally {
    executeSpy.mockRestore();
  }
});

test('interaction error: shows error when moving group fails', async () => {
  // DB setup
  await insertEpisodeGroup({ name: 'Parent Folder', groupType: 'folder' });
  const childId = await insertEpisodeGroup({ name: 'Child Folder', groupType: 'folder' });

  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockImplementation(async (sql: string) => {
    if (sql.includes('UPDATE episode_groups SET parent_group_id')) {
      throw new Error('Database update failed');
    }
    return { lastInsertId: 0, rowsAffected: 0 };
  });

  try {
    // Setup page
    await setupPage();
    await expect.element(page.getByText('Parent Folder')).toBeInTheDocument();
    await expect.element(page.getByText('Child Folder')).toBeInTheDocument();

    // Open actions menu for child
    await openGroupActionsMenu(childId.toString());
    const moveButton = page.getByTestId(`group-action-move-${childId}`);
    await expect.element(moveButton).toBeVisible();
    await page.screenshot();
    await moveButton.click();
    await waitForFadeTransition();
    await expect.element(page.getByRole('heading', { name: 'Move Group' })).toBeInTheDocument();
    await page.screenshot();

    // Select parent
    const selectElement = page.getByTestId('parent-group-select');
    await userEvent.selectOptions(selectElement, 'Parent Folder');
    await page.screenshot();

    // Submit
    await page.getByTestId('move-group-submit').click();
    await waitForFadeTransition();
    await page.screenshot();

    // Assert error message is shown
    await expect.element(page.getByText('Failed to move group.')).toBeInTheDocument();

    // Assert DB is not updated
    const groups = await selectAllGroups();
    const movedGroup = groups.find((g) => g.id === childId);
    expect(movedGroup?.parent_group_id).toBeNull();

    // Assert UI still shows the group
    await expect.element(page.getByText('Child Folder')).toBeInTheDocument();
  } finally {
    executeSpy.mockRestore();
  }
});

test('breadcrumb: clicking Home navigates to root page', async () => {
  // Create a group in DB
  const groupId = await insertEpisodeGroup({ name: 'Parent Folder', groupType: 'folder' });

  // Set groupPathStore to simulate being inside the group
  groupPathStore.pushGroup({
    id: groupId,
    name: 'Parent Folder',
    groupType: 'folder',
    displayOrder: 1,
    parentId: null,
    children: [],
  });

  await setupPage(groupId.toString());

  // Verify breadcrumb shows Home and the group
  await expect.element(page.getByTestId('breadcrumb-home')).toBeInTheDocument();
  await expect.element(page.getByTestId(`breadcrumb-group-${groupId}`)).toBeInTheDocument();
  await page.screenshot();

  // Click Home
  await page.getByTestId('breadcrumb-home').click();

  // Verify goto was called with root URL
  expect(goto).toHaveBeenCalledWith('/');
});

test('breadcrumb: clicking intermediate group navigates to that group', async () => {
  // Create parent and child groups in DB
  const parentId = await insertEpisodeGroup({ name: 'Parent Folder', groupType: 'folder' });
  const childId = await insertEpisodeGroup({
    name: 'Child Folder',
    groupType: 'folder',
    parentId: parentId,
  });

  // Set groupPathStore to simulate being inside the child group (Home > Parent > Child)
  groupPathStore.pushGroup({
    id: parentId,
    name: 'Parent Folder',
    groupType: 'folder',
    displayOrder: 1,
    parentId: null,
    children: [],
  });
  groupPathStore.pushGroup({
    id: childId,
    name: 'Child Folder',
    groupType: 'folder',
    displayOrder: 1,
    parentId,
    children: [],
  });

  await setupPage(childId.toString());

  // Verify breadcrumb shows Home, Parent, and Child
  await expect.element(page.getByTestId('breadcrumb-home')).toBeInTheDocument();
  await expect.element(page.getByTestId(`breadcrumb-group-${parentId}`)).toBeInTheDocument();
  await expect.element(page.getByTestId(`breadcrumb-group-${childId}`)).toBeInTheDocument();
  await page.screenshot();

  // Click Parent Folder breadcrumb
  await page.getByTestId(`breadcrumb-group-${parentId}`).click();

  // Verify goto was called with parent group URL
  expect(goto).toHaveBeenCalledWith(`/${parentId}`);
});
