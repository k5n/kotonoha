import { en } from '$lib/locales/en';
import { ja } from '$lib/locales/ja';
import i18next from 'i18next';

export async function initI18n() {
  await i18next.init({
    lng: 'ja',
    fallbackLng: 'en',
    debug: true,
    resources: {
      ja,
      en,
    },
  });
}
