import { env } from '$env/dynamic/public';
import { en } from '$lib/locales/en';
import { ja } from '$lib/locales/ja';
import { info, warn } from '@tauri-apps/plugin-log';
import i18next, { type TFunction } from 'i18next';

let store = $state({ t: i18next.t, initialized: false });

function isDebugMode(): boolean {
  const debugMode = env.PUBLIC_I18NEXT_DEBUG || 'false';
  return debugMode === 'true';
}

export const i18nStore = {
  init(language: string) {
    info('Initializing i18next ...');
    if (store.initialized) {
      warn('i18next already initialized');
    }
    i18next
      .init({
        lng: language,
        fallbackLng: 'en',
        debug: isDebugMode(),
        resources: {
          ja,
          en,
        },
      })
      .then((t) => {
        info('i18next initialized');
        store = { ...store, t, initialized: true };
      });
  },

  get initialized() {
    return store.initialized;
  },

  changeLanguage(lang: string) {
    info(`Changing language to ${lang}`);
    i18next.changeLanguage(lang).then((t) => {
      store = { ...store, t };
      info(`Language changed to ${lang}`);
    });
  },
};

/**
 * リアクティブな翻訳関数
 * UIコンポーネントで `t('key')` のように直接使用できます。
 */
export function t(...args: Parameters<TFunction>): ReturnType<TFunction> {
  return store.t(...args);
}
