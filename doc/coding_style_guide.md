# TypeScript コーディングスタイルガイド

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

- **クラスのメソッドやオブジェクトのプロパティには、function宣言や通常のメソッド記法を使う。**
  - 例:  
    ```typescript
    class User {
      updateName(name: string): void {
        // ...
      }
    }
    ```

- **関数名はキャメルケース（小文字始まり）で命名する。**
  - 例: `getUserInfo`, `handleSubmit`。

- **必要に応じて型注釈を明示する。**

このルールに従い、プロジェクト全体で一貫性のある関数定義を徹底してください。
