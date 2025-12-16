import { goto, invalidateAll } from '$app/navigation';
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
import { clearDatabase, getEpisodeTitle, insertEpisode, insertEpisodeGroup } from './lib/database';
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

function pushGroupToPath(groupId: string, name: string): void {
  groupPathStore.pushGroup({
    id: groupId,
    name,
    groupType: 'album',
    parentId: null,
    displayOrder: 1,
    children: [],
  });
}

async function openEpisodeActionsMenu(episodeId: string): Promise<void> {
  const element = page.getByTestId(`episode-actions-button-${episodeId}`);
  await expect.element(element).toBeVisible();
  await element.click();
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
    throw new Error(`Unhandled Tauri command: ${command as string}`);
  });

  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue(undefined);

  vi.mocked(goto).mockReset();
  vi.mocked(goto).mockResolvedValue();

  groupPathStore.reset();
  i18nStore.init('en');

  await clearDatabase();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('success: episode list loads and displays episodes for the selected group', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Beginner Course' });
  pushGroupToPath(groupId, 'Beginner Course');
  await insertEpisode({ episodeGroupId: groupId, title: 'Episode 1', displayOrder: 1 });
  await insertEpisode({ episodeGroupId: groupId, title: 'Episode 2', displayOrder: 2 });

  const { data } = await setupPage(String(groupId));

  expect(data.errorKey).toBeNull();
  expect(data.episodeGroup?.name).toBe('Beginner Course');
  expect(data.episodes).toHaveLength(2);

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
    await expect.element(page.getByRole('button', { name: 'Add Episode' })).toBeDisabled();

    await page.screenshot();
  } finally {
    selectSpy.mockRestore();
  }
});

test('success: user can rename an existing episode from the action menu', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Beginner Course' });
  pushGroupToPath(groupId, 'Beginner Course');
  const episodeId = await insertEpisode({
    episodeGroupId: groupId,
    title: 'Episode 1 Original',
    displayOrder: 1,
  });

  await setupPage(String(groupId));

  await openEpisodeActionsMenu(episodeId.toString());
  await expect.element(page.getByTestId(`episode-action-rename-${episodeId}`)).toBeVisible();
  await waitForFadeTransition();
  await page.screenshot();
  await page.getByTestId(`episode-action-rename-${episodeId}`).click();

  await expect.element(page.getByText('Edit Episode Name')).toBeInTheDocument();
  await waitForFadeTransition();
  await page.screenshot();

  const input = page.getByLabelText('Episode Name');
  await input.clear();
  await input.fill('Episode 1 Updated');
  await page.screenshot();
  await page.getByRole('button', { name: 'Save' }).click();

  // Check that the screen has been updated
  await expect.element(page.getByText('Episode 1 Updated')).toBeInTheDocument();
  await expect.element(page.getByText('Episode 1 Original')).not.toBeInTheDocument();

  // Also check the database
  const updatedTitle = await getEpisodeTitle(episodeId);
  expect(updatedTitle).toBe('Episode 1 Updated');

  await waitForFadeTransition();
  await page.screenshot();
});

test('error: rename failure displays an error alert and keeps the original title', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Beginner Course' });
  pushGroupToPath(groupId, 'Beginner Course');
  const episodeId = await insertEpisode({
    episodeGroupId: groupId,
    title: 'Episode 1 Original',
    displayOrder: 1,
  });

  await setupPage(String(groupId));

  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockRejectedValueOnce(new Error('rename failed'));

  try {
    await openEpisodeActionsMenu(episodeId.toString());
    await expect.element(page.getByTestId(`episode-action-rename-${episodeId}`)).toBeVisible();
    await page.getByTestId(`episode-action-rename-${episodeId}`).click();
    const input = page.getByLabelText('Episode Name');
    await input.clear();
    await input.fill('Episode 1 Updated');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect.element(page.getByText('Failed to update episode name')).toBeInTheDocument();

    // Screen should not be updated
    await expect.element(page.getByText('Episode 1 Updated')).not.toBeInTheDocument();
    await expect.element(page.getByText('Episode 1 Original')).toBeInTheDocument();

    const storedTitle = await getEpisodeTitle(episodeId);
    expect(storedTitle).toBe('Episode 1 Original');

    await waitForFadeTransition();
    await page.screenshot();
  } finally {
    executeSpy.mockRestore();
  }
});

test('success: user can delete an episode after confirming the dialog', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Beginner Course' });
  pushGroupToPath(groupId, 'Beginner Course');
  const episodeId = await insertEpisode({
    episodeGroupId: groupId,
    title: 'Episode 1',
    displayOrder: 1,
  });

  await setupPage(String(groupId));

  await openEpisodeActionsMenu(episodeId.toString());
  await expect.element(page.getByTestId(`episode-action-delete-${episodeId}`)).toBeVisible();
  await waitForFadeTransition();
  await page.screenshot();
  await page.getByTestId(`episode-action-delete-${episodeId}`).click();

  await expect.element(page.getByText('Delete Episode')).toBeInTheDocument();
  await expect
    .element(
      page.getByText(
        'Are you sure you want to delete the episode "Episode 1"? All related data will also be deleted.'
      )
    )
    .toBeInTheDocument();
  await expect.element(page.getByTestId('confirm-delete-button')).toBeVisible();
  await waitForFadeTransition();
  await page.screenshot();
  await page.getByTestId('confirm-delete-button').click();

  // Check that the screen has been updated
  await expect.element(page.getByText('Episode 1')).not.toBeInTheDocument();

  // Also check the database
  const deletedTitle = await getEpisodeTitle(episodeId);
  expect(deletedTitle).toBeNull();

  await waitForFadeTransition();
  await page.screenshot();
});

test('error: delete failure surfaces the error banner and keeps the record', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Beginner Course' });
  pushGroupToPath(groupId, 'Beginner Course');
  const episodeId = await insertEpisode({
    episodeGroupId: groupId,
    title: 'Episode 1',
    displayOrder: 1,
  });

  await setupPage(String(groupId));

  const executeSpy = vi.spyOn(Database.prototype, 'execute');
  executeSpy.mockRejectedValueOnce(new Error('delete failed'));

  try {
    await openEpisodeActionsMenu(episodeId.toString());
    await expect.element(page.getByTestId(`episode-action-delete-${episodeId}`)).toBeVisible();
    await page.getByTestId(`episode-action-delete-${episodeId}`).click();
    await expect.element(page.getByTestId('confirm-delete-button')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    await expect.element(page.getByText('Failed to delete episode')).toBeInTheDocument();

    // Screen should not be updated
    await expect.element(page.getByText('Episode 1')).toBeInTheDocument();

    const remainingTitle = await getEpisodeTitle(episodeId);
    expect(remainingTitle).toBe('Episode 1');

    await page.screenshot();
  } finally {
    executeSpy.mockRestore();
  }
});

test('breadcrumb: clicking Home navigates to root page', async () => {
  // Create a folder and an album in DB
  const folderId = await insertEpisodeGroup({ name: 'Parent Folder', groupType: 'folder' });
  const albumId = await insertEpisodeGroup({
    name: 'Beginner Course',
    groupType: 'album',
    parentId: folderId,
  });

  // Set groupPathStore to simulate being inside Home > Parent Folder > Beginner Course
  groupPathStore.pushGroup({
    id: folderId,
    name: 'Parent Folder',
    groupType: 'folder',
    displayOrder: 1,
    parentId: null,
    children: [],
  });
  groupPathStore.pushGroup({
    id: albumId,
    name: 'Beginner Course',
    groupType: 'album',
    displayOrder: 1,
    parentId: folderId,
    children: [],
  });

  await setupPage(String(albumId));

  // Verify breadcrumb shows Home, Parent Folder, and Beginner Course
  await expect.element(page.getByTestId('breadcrumb-home')).toBeInTheDocument();
  await expect.element(page.getByTestId(`breadcrumb-group-${folderId}`)).toBeInTheDocument();
  await expect.element(page.getByTestId(`breadcrumb-group-${albumId}`)).toBeInTheDocument();
  await page.screenshot();

  // Click Home
  await page.getByTestId('breadcrumb-home').click();

  // Verify goto was called with root URL
  expect(goto).toHaveBeenCalledWith('/');
});

test('breadcrumb: clicking intermediate group navigates to that group', async () => {
  // Create a folder and an album in DB
  const folderId = await insertEpisodeGroup({ name: 'Parent Folder', groupType: 'folder' });
  const albumId = await insertEpisodeGroup({
    name: 'Beginner Course',
    groupType: 'album',
    parentId: folderId,
  });

  // Set groupPathStore to simulate being inside Home > Parent Folder > Beginner Course
  groupPathStore.pushGroup({
    id: folderId,
    name: 'Parent Folder',
    groupType: 'folder',
    displayOrder: 1,
    parentId: null,
    children: [],
  });
  groupPathStore.pushGroup({
    id: albumId,
    name: 'Beginner Course',
    groupType: 'album',
    displayOrder: 1,
    parentId: folderId,
    children: [],
  });

  await setupPage(String(albumId));

  // Verify breadcrumb shows Home, Parent Folder, and Beginner Course
  await expect.element(page.getByTestId('breadcrumb-home')).toBeInTheDocument();
  await expect.element(page.getByTestId(`breadcrumb-group-${folderId}`)).toBeInTheDocument();
  await expect.element(page.getByTestId(`breadcrumb-group-${albumId}`)).toBeInTheDocument();
  await page.screenshot();

  // Click Parent Folder breadcrumb
  await page.getByTestId(`breadcrumb-group-${folderId}`).click();

  // Verify goto was called with parent folder URL
  expect(goto).toHaveBeenCalledWith(`/${folderId}`);
});
