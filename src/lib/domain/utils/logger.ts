/**
 * Logger interface for logging messages at different levels.
 *
 * This interface can be implemented by any logging library or custom logger.
 */
export interface Logger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

/**
 * ConsoleLogger is a simple implementation of the Logger interface
 *
 * that logs messages to the console.
 * It can be used for unit tests.
 */
export class ConsoleLogger implements Logger {
  debug(message: string): void {
    console.debug(message);
  }

  info(message: string): void {
    console.info(message);
  }
  warn(message: string): void {
    console.warn(message);
  }
  error(message: string): void {
    console.error(message);
  }
}
