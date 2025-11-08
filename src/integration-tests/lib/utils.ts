export async function waitFor(milliseconds: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
