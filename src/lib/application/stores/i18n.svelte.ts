import { en } from '$lib/locales/en';
import { ja } from '$lib/locales/ja';
import { info } from '@tauri-apps/plugin-log';
import i18next from 'i18next';

let store = $state(i18next.t);

export const i18nStore = {
  init() {
    info('Initializing i18next ...');
    i18next
      .init({
        lng: 'ja',
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
      });
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
