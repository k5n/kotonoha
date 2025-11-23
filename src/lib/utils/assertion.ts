export function assert(condition: boolean, message: string): void {
  if (!condition) {
    const errorMessage = `Assertion failed: ${message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export function assertNotNull<T>(value: T | null, message: string): asserts value is T {
  assert(value !== null, message);
}
