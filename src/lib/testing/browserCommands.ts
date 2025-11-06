import { commands } from 'vitest/browser';

declare module 'vitest/browser' {
  interface BrowserCommands {
    getCoverage: () => Promise<string | undefined>;
  }
}

export const getCoverage = commands.getCoverage;
export const writeFile = commands.writeFile;
