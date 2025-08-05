import i18next, { type TFunction } from 'i18next';

let store: TFunction = $state(i18next.t);

i18next.on('languageChanged', () => {
  store = i18next.t;
});

/**
 * リアクティブな翻訳関数
 * UIコンポーネントで `t('key')` のように直接使用できます。
 */
export function t(...args: Parameters<TFunction>): ReturnType<TFunction> {
  return store(...args);
}
