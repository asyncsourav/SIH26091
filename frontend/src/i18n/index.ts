import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../public/locales/en.json";
import hi from "../../public/locales/hi.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi }
  },
  lng: localStorage.getItem("gv_lang") ?? "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export function setLanguage(lang: "en" | "hi") {
  i18n.changeLanguage(lang);
  localStorage.setItem("gv_lang", lang);
}

export default i18n;
