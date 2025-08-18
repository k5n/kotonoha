# TypeScript コーディングスタイル

## import パスの記述規約（SvelteKit `$lib`）

- **`src/lib` 以下のファイルを import する場合は、必ず `$lib` を使った絶対パスで import してください。**
  - 相対パス（例: `../../lib/xxx`）は使用禁止。
  - `$lib` は SvelteKit の Vite エイリアスで、`src/lib` を指します。

- **例:**
  ```typescript
  // OK
  import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';

  // NG
  import { fetchEpisodes } from '../../lib/application/usecases/fetchEpisodes';
  ```

- **理由:**
  - import パスの可読性・保守性向上
  - ファイル移動時の修正コスト削減
  - SvelteKit 標準の推奨パターン


## 関数定義

> 基本方針：  
> - 通常の関数は function 宣言、  
> - コールバックや一時的な関数は const + アロー関数  
> を使うこと。

- **トップレベルの関数は `function` キーワードで宣言する。**
  - 例:  
    ```typescript
    function fetchData(): void {
      // ...
    }
    ```
  - ホイスティングや可読性の観点から推奨されます。

- **コールバック関数や一時的な関数は `const` + アロー関数で定義する。**
  - 例:  
    ```typescript
    array.map(item => process(item));
    const handleClick = (event: MouseEvent) => {
      // ...
    };
    ```
  - コールバックや短い関数、thisの扱いが不要な場面で使用します。

- **クラスのメソッドやオブジェクトのプロパティには、通常のメソッド記法を使う。**
  - 例:  
    ```typescript
    class User {
      updateName(name: string): void {
        // ...
      }
    }
    ```

- **複数の関連関数を1つのオブジェクトとしてまとめて公開する場合は、オブジェクトリテラルでグループ化し、各関数は通常のメソッド記法で定義する。**
  - 例:  
    ```typescript
    function mapRowToEpisodeGroup(row: EpisodeGroupRow): EpisodeGroup {
      // ...
    }

    export const episodeGroupRepository = {
      async getAllGroups(): Promise<readonly EpisodeGroup[]> {
        // ...
      },
      async addGroup(params: { ... }): Promise<EpisodeGroup> {
        // ...
      },
      // 他のメソッド...
    };
    ```
  - 補助的な関数（private関数）は、オブジェクト外でfunction宣言として定義する。
  - このパターンは、リポジトリ・サービス・ストアなどの「機能単位のまとまり」に推奨されます。

- **関数名はキャメルケース（小文字始まり）で命名する。**
  - 例: `getUserInfo`, `handleSubmit`。

- **必要に応じて型注釈を明示する。**

## Immutableデータの扱い

> 基本方針：  
> データの予期しない変更を防ぐため、TypeScriptの `readonly` キーワードを積極的に活用し、Immutableなデータ構造を心がける。

- **型定義のプロパティには `readonly` を付与する。**
  - 例:  
    ```typescript
    type Episode = {
      readonly id: number;
      readonly title: string;
      readonly audioPath: string;
      readonly createdAt: Date;
    };
    ```
  - エンティティや値オブジェクトなど、一度作成されたら変更されないデータ構造に適用します。

- **配列の型には `readonly` 配列を使用する。**
  - 例:  
    ```typescript
    // 戻り値
    function getEpisodes(): Promise<readonly Episode[]> {
      // ...
    }
    
    // 引数
    function processItems(items: readonly string[]): void {
      // ...
    }
    ```
  - 配列の要素の追加・削除・変更を防ぎ、意図しない副作用を防止します。

- **オブジェクトや配列を更新する場合は、新しいインスタンスを作成する。**
  - 例:  
    ```typescript
    // オブジェクトの更新
    const updatedEpisode = { ...originalEpisode, title: newTitle };
    
    // 配列への要素追加
    const newItems = [...originalItems, newItem];
    
    // 配列の要素更新
    const updatedItems = originalItems.map(item => 
      item.id === targetId ? { ...item, name: newName } : item
    );
    ```
  - 元のデータを変更せず、新しいデータを作成することで副作用を防ぎます。

- **関数の引数で受け取るオブジェクト・配列にも `readonly` を適用する。**
  - 例:  
    ```typescript
    function calculateTotal(prices: readonly number[]): number {
      return prices.reduce((sum, price) => sum + price, 0);
    }
    
    function formatEpisode(episode: Readonly<Episode>): string {
      return `${episode.title} - ${episode.audioPath}`;
    }
    ```
  - 関数内でのデータ変更を防ぎ、関数の純粋性を保ちます。

- **ミュータブルな操作が必要な場合は、ローカルスコープで明示的にコピーを作成する。**
  - 例:  
    ```typescript
    function sortEpisodes(episodes: readonly Episode[]): readonly Episode[] {
      // ミュータブルなコピーを作成してソート
      const mutableCopy = [...episodes];
      mutableCopy.sort((a, b) => a.title.localeCompare(b.title));
      return mutableCopy;
    }
    ```
  - 必要に応じてミュータブルな操作を行いつつ、戻り値は再びimmutableにします。