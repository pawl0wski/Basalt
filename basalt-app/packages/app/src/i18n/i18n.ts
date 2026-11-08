import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";

export async function initI18n() {
    await i18next.use(initReactI18next).init({
        lng: "en",
        fallbackLng: "en",
        resources: { en: { translation: en } },
        interpolation: { prefix: "{", suffix: "}", escapeValue: false },
        returnNull: false,
    });
    return i18next;
}
