# コーディングルール

## Svelte 5 全般のスタイル

Svelte 5 では、従来の記法からいくつかの大きな変更が加わりました。以下に示す新しい記法を積極的に利用してください。

### 1. Svelte Runes の利用

- Svelte 5 以降で追加された **Runes** を利用してください。
  - 既存の `$:` ラベルや `let` 変数によるリアクティブ記法は、利用せず runes を利用してください。
  - 例: `$state`, `$derived`, `$effect` など。

### 2. イベントハンドラの記法

イベントハンドラは `on:event` 形式ではなく、`onevent` というネイティブな DOM の記法を利用します。

- **旧記法**: `<button on:click={handleClick}>`
- **新記法**: `<button onclick={handleClick}>`

### 3. Stateオブジェクトプロパティとの双方向バインディング

`$state` で宣言したオブジェクトのプロパティに対して、`bind:value` を直接利用できます。

```svelte
<script>
  let form = $state({ name: '', email: '' });
</script>
<input bind:value={form.name}>
<input bind:value={form.email}>
```

### 4. 親コンポーネントからバインド可能な Props (`$bindable`)

コンポーネントのプロパティを親コンポーネントから `bind:` ディレクティブで双方向バインディング可能にするには、`$props()` 内でプロパティのデフォルト値として `$bindable()` を使用します。

**子コンポーネント (Modal.svelte)**
```svelte
<script>
  let { open = $bindable() } = $props();
</script>

{#if open}
  <div>
    <p>Modal is open!</p>
    <button onclick={() => open = false}>Close</button>
  </div>
{/if}
```

**親コンポーネント (Parent.svelte)**
```svelte
<script>
  import Modal from './Modal.svelte';
  let showModal = $state(false);
</script>

<button onclick={() => showModal = true}>Open Modal</button>

<Modal bind:open={showModal} />
```

### 5. ライフサイクルと副作用 (`$effect` の利用)

`onMount` や `onDestroy` などのライフサイクル関数は `$effect` ルーンに統合されました。DOM の更新後に実行され、クリーンアップ関数を返すことでコンポーネント破棄時の処理も記述できます。

```svelte
<script>
  $effect(() => {
    console.log('Effect runs/reruns');
    return () => {
      console.log('Effect cleans up');
    };
  });
</script>
```

### 6. コンテンツの再利用と受け渡し (`{#snippet}` の利用)

従来の `slot` に代わる、より柔軟で強力な機能として `snippet` が導入されました。UI の一部を切り出して変数としてコンポーネントに渡すことができます。`slot` よりも `snippet` の利用を推奨します。

**子コンポーネント (Child.svelte)**
```svelte
<script>
  let { header } = $props();
</script>
<div>{@render header()}</div>
```

**親コンポーネント (Parent.svelte)**
```svelte
<script>
  import Child from './Child.svelte';
</script>
{#snippet header()}<h1>Title</h1>{/snippet}
<Child {header}/>
```

### 7. DOM要素への参照

コンポーネント内の DOM 要素への参照を取得するには、`$state` で初期化した変数に対して `bind:this` を使用します。

```svelte
<script>
  let myElement = $state(null);
</script>
<div bind:this={myElement}></div>
```

---

## SvelteKit の規約

### ページデータのロード方法

- 各ページ（ルート）でデータを取得する場合は、**SvelteKit の `load` 関数**を利用してください。
  - `+page.ts` に `export const load` を定義します。
- ページコンポーネント（`+page.svelte`）では、`$props()` で `load` から渡されたデータを受け取ってください。
- 型定義は `./$types` で自動生成される `PageProps` などを利用してください。
  - `+page.ts` の `params` や `load` の返り値型も `PageLoad` など `./$types` から取得できます。
  - `./$types` で自動生成される型を利用することで、props や params の型安全性を担保できます。

#### コード例

##### データロード（+page.ts）

```typescript
import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  // ...データ取得処理...
  return { ... };
};
```

##### ページコンポーネント（+page.svelte）

```svelte
<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  // ...
</script>
```

---

## アプリケーション設計

### ストアの記述方法（Svelte Runes 準拠）

- ストアは **Svelte 5 の Runes を利用し、状態そのものは外部に直接公開せず、操作用の関数や getter をまとめたオブジェクトとして公開**してください。
- ストアの利用は `counterStore.reset()` や `counterStore.value` のように、**ストアオブジェクト経由でアクセス**してください。
- ファイル名の拡張子は `*.svelte.ts` としてください。

#### コード例

```typescript
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

##### 利用例：

```typescript
import { counterStore } from './counterStore';

console.log(counterStore.value); // 0
counterStore.increment();
console.log(counterStore.value); // 1
counterStore.reset();
console.log(counterStore.value); // 0
```
