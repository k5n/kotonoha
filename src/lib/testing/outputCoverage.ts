import { commands } from 'vitest/browser';

declare global {
  interface Window {
    __coverage__?: Record<string, unknown>;
  }
}

export async function outputCoverage(url: string): Promise<void> {
  const coverage = window.__coverage__;
  if (coverage) {
    // import.meta.url example: http://127.0.0.1:63315/home/your_name/path_to_project/src/integration-tests/settings.browser.test.ts?import&browserv=1762486222824
    const name = new URL(url).pathname.split('/').pop()?.replace('.browser.test.ts', '');
    console.log(`output coverage for test: ${name}`);
    await commands.writeFile(`coverage/coverage-${name}.json`, JSON.stringify(coverage, null, 2));
  }
}
