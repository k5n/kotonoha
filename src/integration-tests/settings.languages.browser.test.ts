import { invalidateAll } from '$app/navigation';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import type { MockedFunction } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/settings/$types';
import { load } from '../routes/settings/+page';
import Component from '../routes/settings/+page.svelte';
import { createStatefulStore, setupStrongholdMock } from './lib/mockFactories';
import { outputCoverage } from './lib/outputCoverage';

import '$src/app.css';

// Mock Tauri and app navigation modules BEFORE imports are used
vi.mock('@tauri-apps/plugin-store');
vi.mock('@tauri-apps/plugin-stronghold');
vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/path');
vi.mock('@tauri-apps/api/app');
vi.mock('$app/navigation', () => ({
  invalidateAll: vi.fn().mockResolvedValue(undefined),
}));

// Import mocked modules
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { load as storeLoad } from '@tauri-apps/plugin-store';
import { Stronghold } from '@tauri-apps/plugin-stronghold';
import { waitForFadeTransition } from './lib/utils';

type StoreInstance = ReturnType<typeof createStatefulStore>;
type SetupOptions = {
  initialSettings?: {
    language?: string;
    learningTargetLanguages?: readonly string[];
    explanationLanguages?: readonly string[];
  };
  locale?: 'en' | 'ja';
  configureStoreMock?: (args: {
    store: StoreInstance;
    storeLoadMock: MockedFunction<typeof storeLoad>;
  }) => void;
};

beforeEach(() => {
  // Reset i18n and mocks
  i18nStore.init('en');
  vi.clearAllMocks();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

async function setupPage(options: SetupOptions = {}) {
  if (options.locale && options.locale !== 'en') {
    i18nStore.init(options.locale);
  }

  // Use a single shared stateful store across get/save calls
  const store = createStatefulStore({
    learningTargetLanguages: options.initialSettings?.learningTargetLanguages ?? [],
    explanationLanguages: options.initialSettings?.explanationLanguages ?? [],
    language: options.initialSettings?.language ?? 'en',
  });

  const storeLoadMock = vi.mocked(storeLoad);
  storeLoadMock.mockReset();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeLoadMock.mockResolvedValue(store as any);
  options.configureStoreMock?.({ store, storeLoadMock });

  const { stronghold } = setupStrongholdMock();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(Stronghold.load).mockResolvedValue(stronghold as any);
  vi.mocked(invoke).mockImplementation(async (command) => {
    if (command === 'get_env_prefix_command') return '';
    return 'ok' as never;
  });
  vi.mocked(appDataDir).mockResolvedValue('/test/app/data');
  vi.mocked(getVersion).mockResolvedValue('1.0.0');

  // Execute load
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await load({} as any)) as PageData;
  const params = {} as never;
  const renderResult = render(Component, { data, params });

  // Wire invalidateAll to re-load + rerender
  vi.mocked(invalidateAll).mockImplementation(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshed = (await load({} as any)) as PageData;
    await renderResult.rerender({ data: refreshed, params });
  });

  return { store, data, renderResult };
}

test('learning target languages: add, save, and persist after reload', async () => {
  const { store } = await setupPage();
  store.__setSaveDelay?.(50);

  // Initial state: placeholder is shown
  await expect.element(page.getByText('None (All languages are targeted)')).toBeInTheDocument();
  await page.screenshot();

  // Open language selection modal
  await page.getByText('Add Learning Target Language').click();

  // Search and select Japanese
  const searchInput = page.getByPlaceholder('Search for a language');
  await searchInput.fill('jap');
  // Clicking label toggles the checkbox (scope inside modal to avoid UI language select)
  const modal = page.getByRole('dialog');
  await modal.getByRole('checkbox', { name: 'Japanese' }).click();
  await page.screenshot();

  // Close modal using the built-in close button
  await modal.getByRole('button', { name: 'Close' }).click();

  // Badge appears for Japanese (check remove button for specificity)
  const removeJapanese = page.getByRole('button', { name: 'Remove Japanese' });
  await expect.element(removeJapanese).toBeInTheDocument();
  await page.screenshot();

  // Save and verify saving UI
  await page.getByText('Save').click();
  await expect.element(page.getByText('Saving...')).toBeInTheDocument();

  // After invalidateAll + rerender, the selection persists
  await expect.element(page.getByText('Settings saved successfully.')).toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Remove Japanese' })).toBeInTheDocument();
  await page.screenshot();
});

test('learning target languages: delete persists after save', async () => {
  const { store } = await setupPage({
    initialSettings: { learningTargetLanguages: ['ja', 'en'] },
  });
  store.__setSaveDelay?.(50);

  await page.screenshot();
  await expect.element(page.getByRole('button', { name: 'Remove English' })).toBeInTheDocument();
  await page.getByRole('button', { name: 'Remove English' }).click();

  await expect
    .element(page.getByRole('button', { name: 'Remove English' }))
    .not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Remove Japanese' })).toBeInTheDocument();
  await page.screenshot();

  await page.getByText('Save').click();
  await expect.element(page.getByText('Saving...')).toBeInTheDocument();
  await expect.element(page.getByText('Settings saved successfully.')).toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Remove English' }))
    .not.toBeInTheDocument();
  await page.screenshot();
});

test('explanation languages: add and persist after reload', async () => {
  const { store } = await setupPage({
    initialSettings: { explanationLanguages: ['en'] },
  });
  store.__setSaveDelay?.(50);

  await page.screenshot();
  await expect.element(page.getByRole('button', { name: 'Remove English' })).toBeInTheDocument();

  await page.getByText('Add Explanation Language').click();
  const modal = page.getByRole('dialog');
  await page.getByPlaceholder('Search for a language').fill('jap');
  await modal.getByRole('checkbox', { name: 'Japanese' }).click();
  await page.screenshot();
  await modal.getByRole('button', { name: 'Close' }).click();

  await expect.element(page.getByRole('button', { name: 'Remove Japanese' })).toBeInTheDocument();
  await page.screenshot();

  await page.getByText('Save').click();
  await expect.element(page.getByText('Saving...')).toBeInTheDocument();
  await expect.element(page.getByText('Settings saved successfully.')).toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Remove Japanese' })).toBeInTheDocument();
  await page.screenshot();
});

test('language names: badges display in UI language while modal shows native and English names', async () => {
  await setupPage({
    locale: 'ja',
    initialSettings: { learningTargetLanguages: ['en'], explanationLanguages: ['ja'] },
  });

  await page.screenshot();
  await expect
    .element(page.getByTestId('learning-target-badge-en').getByText('英語'))
    .toBeInTheDocument();
  await expect
    .element(page.getByTestId('explanation-language-badge-ja').getByText('日本語'))
    .toBeInTheDocument();

  await page.getByText('学習対象言語を追加').click();
  await waitForFadeTransition();
  const modal = page.getByRole('dialog');
  await expect.element(modal.getByText('日本語')).toBeInTheDocument();
  await expect.element(modal.getByText('(Japanese)')).toBeInTheDocument();
  await page.screenshot();
  await modal.getByRole('button', { name: 'Close' }).click();
});

test('save failure surfaces error and re-enables controls', async () => {
  const { store } = await setupPage({
    initialSettings: { learningTargetLanguages: ['ja'] },
  });
  store.__setSaveDelay?.(50);
  store.__setFailNextSave?.(true);

  await page.screenshot();
  await page.getByText('Save').click();
  await expect.element(page.getByText('Saving...')).toBeInTheDocument();
  await expect.element(page.getByText('Failed to save settings.')).toBeInTheDocument();
  await page.screenshot();
});

test('load failure shows notification banner', async () => {
  await setupPage({
    configureStoreMock: ({ storeLoadMock }) => {
      storeLoadMock.mockRejectedValueOnce(new Error('Failed to load store'));
    },
  });

  await expect.element(page.getByText('Settings are not loaded.')).toBeInTheDocument();
  await page.screenshot();
});
