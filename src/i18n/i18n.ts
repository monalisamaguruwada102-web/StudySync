import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import sn from './sn.json';
import nd from './nd.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            sn: { translation: sn },
            nd: { translation: nd },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
