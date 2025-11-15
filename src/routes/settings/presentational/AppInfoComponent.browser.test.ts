import type { AppInfo } from '$lib/domain/entities/appInfo';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import AppInfoComponent from './AppInfoComponent.svelte';

describe('AppInfoComponent', () => {
  const mockAppInfo: AppInfo = {
    name: 'Kotonoha',
    version: '1.0.0',
    copyright: 'Copyright (C) 2025 Keigo Nakatani',
    license: 'GNU General Public License v3.0',
    homepage: 'https://github.com/k5n/kotonoha',
  };

  test('renders app info correctly', async () => {
    render(AppInfoComponent, { appInfo: mockAppInfo });

    // Check if app name is displayed
    await expect.element(page.getByRole('heading', { name: 'Kotonoha' })).toBeInTheDocument();

    // Check if version is displayed
    await expect.element(page.getByText('Version: 1.0.0')).toBeInTheDocument();

    // Check if copyright is displayed
    await expect
      .element(page.getByText('Copyright: Copyright (C) 2025 Keigo Nakatani'))
      .toBeInTheDocument();

    // Check if license is displayed
    await expect
      .element(page.getByText('License: GNU General Public License v3.0'))
      .toBeInTheDocument();

    // Check if homepage link is displayed
    await expect
      .element(page.getByRole('link', { name: 'https://github.com/k5n/kotonoha' }))
      .toBeInTheDocument();
  });
});
