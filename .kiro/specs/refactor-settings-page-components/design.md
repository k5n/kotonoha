# 技術設計書

## Overview

settingsページのUI要素を、設定関連とアプリ情報表示に分離し、それぞれを独立したpresentationalコンポーネントとして実装する。これによりコードの保守性と再利用性を向上させ、プレゼンテーション層の構造を明確にする。

### Goals

- 設定用UI要素を別コンポーネントに分離
- アプリ情報表示UI要素を別コンポーネントに分離
- +page.svelteをコンポーネント利用とユースケース橋渡しに限定

### Non-Goals

- 新機能の追加
- 既存ユースケースの変更

## Architecture

### Existing Architecture Analysis

現在のsettingsページは+page.svelteに全てのUIロジックが集中しており、設定入力とアプリ情報表示が混在している。このリファクタリングにより、presentational層の責務を明確に分離する。

### Architecture Pattern & Boundary Map

```
+page.svelte (Container)
├── SettingsComponent (Presentational)
├── AppInfoComponent (Presentational)
└── LanguageSelectionModal (Presentational)
```

### Technology Stack

- Frontend: Svelte 5 + TypeScript
- UI Library: Flowbite-Svelte
- 変更なし

## Requirements Traceability

| Requirement | Component         | Interface                                         |
| ----------- | ----------------- | ------------------------------------------------- |
| 1.1         | SettingsComponent | props: initialSettings, isApiKeySet flags, onSave |
| 1.2         | SettingsComponent | UI elements for API keys, languages               |
| 1.3         | +page.svelte      | saveSettings usecase call                         |
| 1.4         | SettingsComponent | no usecase calls                                  |
| 2.1         | AppInfoComponent  | props: appInfo data                               |
| 2.2         | AppInfoComponent  | display app info                                  |
| 2.3         | AppInfoComponent  | no data fetching                                  |
| 3.1         | +page.svelte      | import and use components                         |
| 3.2         | +page.svelte      | handle save events                                |
| 3.3         | +page.svelte      | combine presentational components                 |

## Components and Interfaces

### Presentation Layer

#### SettingsComponent

**Responsibility & Boundaries**

- **Primary Responsibility**: 設定関連UIの表示と入力処理
- **Domain Boundary**: プレゼンテーション層
- **Data Ownership**: UI状態管理（内部）
- **Transaction Boundary**: なし

**Dependencies**

- **Inbound**: +page.svelte
- **Outbound**: なし

**Contract Definition**

```typescript
interface SettingsComponentProps {
  initialSettings: Settings;
  isGeminiApiKeySet: boolean;
  isYoutubeApiKeySet: boolean;
  isSaving: boolean;
  onSave: (settings: Partial<Settings>, geminiApiKey: string, youtubeApiKey: string) => void;
}
```

#### AppInfoComponent

**Responsibility & Boundaries**

- **Primary Responsibility**: アプリ情報表示
- **Domain Boundary**: プレゼンテーション層
- **Data Ownership**: なし（props経由）
- **Transaction Boundary**: なし

**Dependencies**

- **Inbound**: +page.svelte
- **Outbound**: なし

**Contract Definition**

```typescript
interface AppInfoComponentProps {
  appInfo: AppInfo;
}
```

#### +page.svelte (Modified)

**Responsibility & Boundaries**

- **Primary Responsibility**: コンポーネントの組み合わせとユースケース呼び出し
- **Domain Boundary**: プレゼンテーション層（コンテナ）
- **Data Ownership**: UI状態管理
- **Transaction Boundary**: 設定保存時

**Dependencies**

- **Inbound**: なし
- **Outbound**: saveSettings usecase

**Integration Strategy**

既存の+page.svelteをリファクタリングし、UI要素を新コンポーネントに移動。SettingsComponentは内部で状態を管理し、onSaveで変更結果をまとめて親に渡す。

## Error Handling

既存のエラーハンドリングを維持。設定保存エラーは+page.svelteで処理。

## Testing Strategy

### Unit Tests

- SettingsComponent: UIレンダリングとonSaveでのデータ渡し
- AppInfoComponent: データ表示

### Integration Tests

- +page.svelte: コンポーネント統合と保存フロー

### E2E Tests

- 設定ページ全体の機能確認
