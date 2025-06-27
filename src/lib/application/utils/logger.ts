import type { Logger } from '$lib/domain/utils/logger';
import { debug, error, info, warn } from '@tauri-apps/plugin-log';

/**
 * TauriLogger is an implementation of the Logger interface
 *
 * that uses Tauri's logging plugin to log messages.
 */
export class TauriLogger implements Logger {
  debug(message: string): void {
    debug(message);
  }
  info(message: string): void {
    info(message);
  }
  warn(message: string): void {
    warn(message);
  }
  error(message: string): void {
    error(message);
  }
}
