import { i18nStore } from '$lib/application/stores/i18n.svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageProps } from './$types';
import Component from './+page.svelte';

import '$src/app.css';

beforeEach(() => {
  i18nStore.init('en');
});

test('show error message when fetching settings fails', async () => {
  const props: PageProps = {
    params: {},
    data: {
      isGeminiApiKeySet: false,
      isYoutubeApiKeySet: false,
      settings: null,
      appInfo: null,
      errorKey: 'settings.notifications.loadError',
    },
  };
  render(Component, props);

  await expect.element(page.getByText('Settings are not loaded.')).toBeInTheDocument();
  await page.screenshot();
});
