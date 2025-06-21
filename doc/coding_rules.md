# コーディングルール

## Svelte Runes の利用

- Svelte 5 以降で追加された **Runes** を利用してください。
  - 既存の `$:` ラベルや `let` 変数によるリアクティブ記法は、利用せず runes を利用してください。
  - 例: `$state`, `$derived`, `$effect` など。

## SvelteKit ページデータのロード方法

- 各ページ（ルート）でデータを取得する場合は、**SvelteKit の `load` 関数**を利用してください。
  - `+page.ts` に `export const load` を定義します。
- ページコンポーネント（`+page.svelte`）では、`$props()` で `load` から渡されたデータを受け取ってください。
- 型定義は `./$types` で自動生成される `PageProps` などを利用してください。
  - `+page.ts` の `params` や `load` の返り値型も `PageLoad` など `./$types` から取得できます。
  - `./$types` で自動生成される型を利用することで、props や params の型安全性を担保できます。

### コード例

#### データロード（+page.ts）

```typescript
import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  // ...データ取得処理...
  return { ... };
};
```

#### ページコンポーネント（+page.svelte）

```svelte
<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  // ...
</script>
```

## ストアの記述方法（Svelte Runes 準拠）

- ストアは **Svelte 5 の Runes を利用し、状態そのものは外部に直接公開せず、操作用の関数や getter をまとめたオブジェクトとして公開**してください。
- ストアの利用は `counterStore.reset()` や `counterStore.value` のように、**ストアオブジェクト経由でアクセス**してください。

### コード例

```typescript
import { $state } from 'svelte';

let store = $state(0);

export const counterStore = {
  get value() {
    return store;
  },

  increment() {
    store += 1;
  },

  reset() {
    store = 0;
  }
};
```

利用例：

```typescript
import { counterStore } from './counterStore';

console.log(counterStore.value); // 0
counterStore.increment();
console.log(counterStore.value); // 1
counterStore.reset();
console.log(counterStore.value); // 0
```
