import { i18nStore } from '$lib/application/stores/i18n.svelte';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { debug, error, info, trace, warn } from '@tauri-apps/plugin-log';

let initialized = false;

function forwardConsole(
  consoleMethodName: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logFunction: (message: string) => Promise<void>
) {
  console[consoleMethodName] = (message) => {
    logFunction(message);
  };
}

function setupConsoleForwarding() {
  forwardConsole('log', trace);
  forwardConsole('debug', debug);
  forwardConsole('info', info);
  forwardConsole('warn', warn);
  forwardConsole('error', error);
}

async function setupI18nStore() {
  const settings = await settingsRepository.getSettings();
  i18nStore.init(settings.language);
}

export async function initializeApplication(): Promise<void> {
  if (initialized) {
    return;
  }

  const isBrowserMode = import.meta.env.VITE_RUN_MODE === 'browser';

  if (isBrowserMode) {
    console.info('Initializing application...');
  } else {
    info('Initializing application...');
    setupConsoleForwarding();
  }

  await setupI18nStore();
  console.info('Application initialized.');

  initialized = true;
}
