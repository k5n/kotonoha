import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import { createMockStore, setupStrongholdMock } from '$lib/testing/mockFactories';
import { outputCoverage } from '$lib/testing/outputCoverage';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/settings/$types';
import { load } from '../routes/settings/+page';
import Component from '../routes/settings/+page.svelte';

import '$src/app.css';

// Mock Tauri plugins
vi.mock('@tauri-apps/plugin-store');
vi.mock('@tauri-apps/plugin-stronghold');
vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/path');
vi.mock('@tauri-apps/api/app');

// Import mocked modules
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { load as storeLoad } from '@tauri-apps/plugin-store';
import { Stronghold } from '@tauri-apps/plugin-stronghold';

beforeEach(() => {
  // Reset stores and mocks
  apiKeyStore.gemini.reset();
  apiKeyStore.youtube.reset();
  i18nStore.init('en');
  vi.clearAllMocks();
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('success: settings and API keys are loaded and displayed correctly', async () => {
  // Setup mocks for successful data loading
  const mockStore = createMockStore({
    language: 'ja',
    learningTargetLanguages: ['en', 'fr'],
    explanationLanguages: ['ja'],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(storeLoad).mockResolvedValue(mockStore as any);

  const { stronghold } = setupStrongholdMock({
    geminiApiKey: 'test-gemini-key',
    youtubeApiKey: 'test-youtube-key',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(Stronghold.load).mockResolvedValue(stronghold as any);
  vi.mocked(invoke).mockResolvedValue('test-password');
  vi.mocked(appDataDir).mockResolvedValue('/test/app/data');
  vi.mocked(getVersion).mockResolvedValue('1.0.0');

  // Execute load function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await load({} as any)) as PageData;

  // Verify load result
  expect(result.settings).toEqual({
    language: 'ja',
    learningTargetLanguages: ['en', 'fr'],
    explanationLanguages: ['ja'],
  });
  expect(result.isGeminiApiKeySet).toBe(true);
  expect(result.isYoutubeApiKeySet).toBe(true);
  expect(result.appInfo).toEqual({
    name: 'Kotonoha',
    version: '1.0.0',
    copyright: 'Copyright (C) 2025  Keigo Nakatani (https://github.com/k5n)',
    license: 'GNU General Public License v3.0',
    homepage: 'https://github.com/k5n/kotonoha',
  });
  expect(result.errorKey).toBeNull();

  // Render component with loaded data
  render(Component, { data: result, params: {} });

  // Verify UI elements
  await expect.element(page.getByText('Settings')).toBeInTheDocument();
  await expect.element(page.getByText('Gemini API Key is already set.')).toBeInTheDocument();
  await expect.element(page.getByText('YouTube API Key is already set.')).toBeInTheDocument();
  await expect.element(page.getByText('Version: 1.0.0')).toBeInTheDocument();

  await page.screenshot();
});

test('error: error message is displayed when settings loading fails', async () => {
  // Setup mock to throw error on settings load
  vi.mocked(storeLoad).mockRejectedValue(new Error('Failed to load store'));

  // Mock other dependencies (should not be reached due to error)
  vi.mocked(invoke).mockResolvedValue('test-password');
  vi.mocked(appDataDir).mockResolvedValue('/test/app/data');
  vi.mocked(getVersion).mockResolvedValue('1.0.0');

  // Execute load function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await load({} as any)) as PageData;

  // Verify error state
  expect(result.settings).toBeNull();
  expect(result.appInfo).toBeNull();
  expect(result.errorKey).toBe('settings.notifications.loadError');

  // Render component with error state
  render(Component, { data: result, params: {} });

  // Verify error message is displayed
  await expect.element(page.getByText('Settings are not loaded.')).toBeInTheDocument();

  await page.screenshot();
});

test('error: error message is displayed when Stronghold (API Key) loading fails', async () => {
  // Setup mock for settings (succeeds)
  const mockStore = createMockStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(storeLoad).mockResolvedValue(mockStore as any);

  // Setup mock for Stronghold to throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(Stronghold.load).mockRejectedValue(new Error('Failed to load Stronghold') as any);
  vi.mocked(invoke).mockResolvedValue('test-password');
  vi.mocked(appDataDir).mockResolvedValue('/test/app/data');
  vi.mocked(getVersion).mockResolvedValue('1.0.0');

  // Execute load function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await load({} as any)) as PageData;

  // Verify error state
  expect(result.settings).toBeNull();
  expect(result.appInfo).toBeNull();
  expect(result.errorKey).toBe('settings.notifications.loadError');

  // Render component with error state
  render(Component, { data: result, params: {} });

  // Verify error message is displayed
  await expect.element(page.getByText('Settings are not loaded.')).toBeInTheDocument();

  await page.screenshot();
});

test('success: warning messages are displayed when API keys are not set', async () => {
  // Setup mocks for successful data loading but no API keys
  const mockStore = createMockStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(storeLoad).mockResolvedValue(mockStore as any);

  const { stronghold } = setupStrongholdMock(); // No API keys

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(Stronghold.load).mockResolvedValue(stronghold as any);
  vi.mocked(invoke).mockResolvedValue('test-password');
  vi.mocked(appDataDir).mockResolvedValue('/test/app/data');
  vi.mocked(getVersion).mockResolvedValue('1.0.0');

  // Execute load function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await load({} as any)) as PageData;

  // Verify load result
  expect(result.isGeminiApiKeySet).toBe(false);
  expect(result.isYoutubeApiKeySet).toBe(false);
  expect(result.errorKey).toBeNull();

  // Render component with loaded data
  render(Component, { data: result, params: {} });

  // Verify warning messages for missing API keys
  await expect.element(page.getByText('Gemini API Key is not set.')).toBeInTheDocument();
  await expect.element(page.getByText('YouTube API Key is not set.')).toBeInTheDocument();

  await page.screenshot();
});
