"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n/i18n-provider";

const labels: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
  fr: "Français",
  es: "Español",
  ar: "العربية",
  zh: "中文",
  hi: "हिन्दी",
};

export function LocaleSwitcher() {
  const router = useRouter();
  const { locale, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-card/75 px-3 py-2 text-xs text-muted-foreground shadow-soft">
      <Languages size={14} className="text-primary" />
      <span className="sr-only">{t("app.locale", "Language")}</span>
      <select
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          document.cookie = `locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
          router.refresh();
        }}
        className="bg-transparent text-foreground outline-none"
        aria-label={t("app.locale", "Language")}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
