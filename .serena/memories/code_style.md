**Svelte 5:**
- Use Svelte Runes (`$state`, `$derived`, `$effect`) for reactivity.
- Use native DOM event handlers (`onclick`) instead of `on:click`.
- Use `$bindable()` for two-way prop binding.
- Use `{#snippet}` for content reuse.
- Use SvelteKit's `load` function in `+page.ts` for data loading.
- Define stores using Svelte 5 Runes and export an object with functions and getters.

**TypeScript:**
- Use `function` declarations for top-level functions.
- Use `const` with arrow functions for callbacks.
- Emphasize immutable data structures with the `readonly` keyword.

**Testing:**
- Test files are located in the same directory as the source file with a `.test.ts` extension.
- Vitest is the testing framework, with globals enabled.