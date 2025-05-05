import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import các file ngôn ngữ
import translationEN from './locales/en/translation.json';
import translationVI from './locales/vi/translation.json';

// Các tài nguyên ngôn ngữ
const resources = {
  en: {
    translation: translationEN
  },
  vi: {
    translation: translationVI
  }
};

i18n
  // Phát hiện ngôn ngữ từ trình duyệt
  .use(LanguageDetector)
  // Tích hợp với React
  .use(initReactI18next)
  // Khởi tạo i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // không cần escape vì React đã làm điều đó
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;