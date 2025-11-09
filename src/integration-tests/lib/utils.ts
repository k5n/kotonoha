export async function waitFor(milliseconds: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function waitForFadeTransition() {
  const FADE_DURATION_TIME = 100;
  await waitFor(FADE_DURATION_TIME);
}
