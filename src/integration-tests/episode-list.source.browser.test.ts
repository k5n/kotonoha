import { invalidateAll } from '$app/navigation';
import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/episode-list/[groupId]/$types';
import { load } from '../routes/episode-list/[groupId]/+page';
import Component from '../routes/episode-list/[groupId]/+page.svelte';
import { clearDatabase, insertEpisodeGroup } from './lib/database';
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

  groupPathStore.reset();
  i18nStore.init('en');

  await clearDatabase();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('renders file and YouTube selection options', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Click the add episode button to open the source selection modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();

  // Check that the modal is open and shows the selection options
  await expect.element(page.getByText('Select how to add an episode')).toBeInTheDocument();
  await expect
    .element(page.getByText('Choose a source to continue with the appropriate setup flow.'))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Select the file-based episode workflow' }))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Select the YouTube episode workflow' }))
    .toBeInTheDocument();

  await page.screenshot();
});

test('handles file source selection', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Click the add episode button to open the source selection modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();
  await page.screenshot();

  // Click the file selection button
  await page.getByRole('button', { name: 'Select the file-based episode workflow' }).click();
  await waitForFadeTransition();

  // Check that the source selection modal is closed
  await expect.element(page.getByText('Select how to add an episode')).not.toBeInTheDocument();

  // Check that the file workflow selection modal is now open
  await expect.element(page.getByText('Choose your file workflow')).toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Open the audio + script workflow' }))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Open the script + TTS workflow' }))
    .toBeInTheDocument();

  await page.screenshot();
});

test('handles YouTube source selection', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Click the add episode button to open the source selection modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();
  await page.screenshot();

  // Click the YouTube selection button
  await page.getByRole('button', { name: 'Select the YouTube episode workflow' }).click();
  await waitForFadeTransition();

  // Check that the source selection modal is closed
  await expect.element(page.getByText('Select how to add an episode')).not.toBeInTheDocument();

  // Check that the YouTube episode modal is now open
  await expect.element(page.getByText('Add New Episode')).toBeInTheDocument();
  await expect.element(page.getByLabelText('YouTube URL')).toBeInTheDocument();

  await page.screenshot();
});

test('closes on cancel button click', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Test Group' });

  await setupPage(String(groupId));

  // Click the add episode button to open the source selection modal
  await page.getByRole('button', { name: 'Add Episode' }).click();
  await waitForFadeTransition();
  await page.screenshot();

  // Check that the modal is open
  await expect.element(page.getByText('Select how to add an episode')).toBeInTheDocument();

  // Click the cancel button
  await page.getByRole('button', { name: 'Cancel' }).click();
  await waitForFadeTransition();

  // Check that the modal is closed
  await expect.element(page.getByText('Select how to add an episode')).not.toBeInTheDocument();

  await page.screenshot();
});
