import { en } from '$lib/locales/en';
import { ja } from '$lib/locales/ja';
import { info, warn } from '@tauri-apps/plugin-log';
import i18next from 'i18next';

let store = $state(i18next.t);
let initialized = $state(false);

export const i18nStore = {
  init(language: string) {
    info('Initializing i18next ...');
    if (initialized) {
      warn('i18next already initialized');
    }
    i18next
      .init({
        lng: language,
        fallbackLng: 'en',
        debug: true,
        resources: {
          ja,
          en,
        },
      })
      .then((t) => {
        info('i18next initialized');
        store = t;
        initialized = true;
      });
  },

  get initialized() {
    return initialized;
  },

  changeLanguage(lang: string) {
    info(`Changing language to ${lang}`);
    i18next.changeLanguage(lang).then((t) => {
      store = t;
      info(`Language changed to ${lang}`);
    });
  },
};

/**
 * リアクティブな翻訳関数
 * UIコンポーネントで `t('key')` のように直接使用できます。
 */
export const t = store;
