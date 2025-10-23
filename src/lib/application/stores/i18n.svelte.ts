import { env } from '$env/dynamic/public';
import { en } from '$lib/application/locales/en';
import { ja } from '$lib/application/locales/ja';
import i18next, { type TFunction } from 'i18next';

let store = $state(i18next.t);

function isDebugMode(): boolean {
  const debugMode = env.PUBLIC_I18NEXT_DEBUG || 'false';
  return debugMode === 'true';
}

export const i18nStore = {
  init(language: string) {
    console.info('Initializing i18next ...');
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
        console.info('i18next initialized');
        store = t;
      });
  },

  changeLanguage(lang: string) {
    console.info(`Changing language to ${lang}`);
    i18next.changeLanguage(lang).then((t) => {
      store = t;
      console.info(`Language changed to ${lang}`);
    });
  },
};

/**
 * リアクティブな翻訳関数
 * UIコンポーネントで `t('key')` のように直接使用できます。
 */
export function t(...args: Parameters<TFunction>): ReturnType<TFunction> {
  return store(...args);
}
