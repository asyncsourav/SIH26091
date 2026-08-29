import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <div className="flex overflow-hidden rounded-full border border-ink-600 text-xs font-semibold">
      {(["en", "hi"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1.5 transition-colors ${
            i18n.language === lang ? "bg-turmeric-500 text-ink-950" : "bg-transparent text-paper-300 hover:bg-ink-800"
          }`}
        >
          {lang === "en" ? "EN" : "हि"}
        </button>
      ))}
    </div>
  );
}
