import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Component from './ErrorWarningToast.svelte';

import '$src/app.css';

test('renders error toast with correct message and icon', async () => {
  const target = document.createElement('div');
  document.body.appendChild(target);

  render(Component, {
    target,
    props: {
      errorMessage: 'An error occurred',
      type: 'error',
    },
  });

  await expect.element(page.getByText('An error occurred')).toBeInTheDocument();
  await page.screenshot();
});

test('renders warning toast with correct message and icon', async () => {
  const target = document.createElement('div');
  document.body.appendChild(target);

  render(Component, {
    target,
    props: {
      errorMessage: 'A warning occurred',
      type: 'warning',
    },
  });

  await expect.element(page.getByText('A warning occurred')).toBeInTheDocument();
  await page.screenshot();
});

test('error type applies red color classes', async () => {
  const target = document.createElement('div');
  document.body.appendChild(target);

  render(Component, {
    target,
    props: {
      errorMessage: 'Error message',
      type: 'error',
    },
  });

  await expect.element(page.getByText('Error message')).toBeInTheDocument();
  await page.screenshot();
});

test('warning type applies orange color classes', async () => {
  const target = document.createElement('div');
  document.body.appendChild(target);

  render(Component, {
    target,
    props: {
      errorMessage: 'Warning message',
      type: 'warning',
    },
  });

  await expect.element(page.getByText('Warning message')).toBeInTheDocument();
  await page.screenshot();
});
