import { i18nStore } from '$lib/application/stores/i18n.svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Component from './Breadcrumbs.svelte';

import '$src/app.css';

beforeEach(() => {
  i18nStore.init('en');
});

test('renders home breadcrumb item', async () => {
  const props = {
    path: [],
    onNavigate: (_: number | null) => {},
  };
  render(Component, props);

  await expect.element(page.getByText('Home')).toBeInTheDocument();
  await expect.element(page.getByLabelText('home outline')).toBeInTheDocument();
  await page.screenshot();
});
