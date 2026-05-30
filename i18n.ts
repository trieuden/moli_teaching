import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

/** Namespace = tên file trong public/locales/{{lng}}/{{ns}}.json */
export const I18N_NAMESPACES = [
  "common",
  "game",
] as const;

export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: "vi",
    supportedLngs: ["en", "vi"],
    defaultNS: "common",
    ns: [...I18N_NAMESPACES],
    fallbackNS: "common",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
