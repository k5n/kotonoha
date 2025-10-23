import { i18nStore } from '$lib/application/stores/i18n.svelte';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';
import { debug, error, info, trace, warn } from '@tauri-apps/plugin-log';

let initialized = false;

function forwardConsole(
  consoleMethodName: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logFunction: (message: string) => Promise<void>,
  outputOriginal: boolean
) {
  const originalLogFunction = console[consoleMethodName];
  console[consoleMethodName] = (message) => {
    if (outputOriginal) {
      originalLogFunction(message);
    }
    logFunction(message);
  };
}

function setupConsoleForwarding() {
  forwardConsole('log', trace, true);
  forwardConsole('debug', debug, true);
  forwardConsole('info', info, true);
  forwardConsole('warn', warn, true);
  forwardConsole('error', error, true);
}

async function setupI18nStore() {
  const settings = await settingsRepository.getSettings();
  i18nStore.init(settings.language);
}

export async function initializeApplication(): Promise<void> {
  if (initialized) {
    return;
  }

  info('Initializing application...');
  setupConsoleForwarding();
  await setupI18nStore();
  console.info('Application initialized.');

  initialized = true;
}
