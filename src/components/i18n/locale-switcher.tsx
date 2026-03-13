"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n/i18n-provider";
import { NativeSelect } from "@/components/ui/native-select";

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
    <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-card-foreground shadow-soft">
      <Languages size={14} className="text-primary" />
      <span className="sr-only">{t("app.locale", "Language")}</span>
      <NativeSelect
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          document.cookie = `locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
          router.refresh();
        }}
        className="h-auto min-w-[8.5rem] border-0 bg-transparent px-0 py-0 pr-7 text-xs shadow-none focus:ring-0"
        wrapperClassName="min-w-[8.5rem]"
        aria-label={t("app.locale", "Language")}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
