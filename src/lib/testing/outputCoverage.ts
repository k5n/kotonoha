import { commands } from 'vitest/browser';

declare global {
  interface Window {
    __coverage__?: Record<string, unknown>;
  }
}

export async function outputCoverage(name: string): Promise<void> {
  const coverage = window.__coverage__;
  if (coverage) {
    await commands.writeFile(`coverage/coverage-${name}.json`, JSON.stringify(coverage, null, 2));
  }
}
