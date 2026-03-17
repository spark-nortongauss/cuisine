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
  const accessibleLabel = t("app.locale", "Language");

  const handleChange = (nextLocale: Locale) => {
    document.cookie = `locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <>
      <div className="relative md:hidden" title={accessibleLabel}>
        <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-card-foreground shadow-soft">
          <Languages size={15} className="text-primary" aria-hidden />
          <span className="sr-only">{accessibleLabel}</span>
          <select
            value={locale}
            onChange={(event) => handleChange(event.target.value as Locale)}
            aria-label={accessibleLabel}
            title={accessibleLabel}
            className="absolute inset-0 cursor-pointer appearance-none rounded-2xl opacity-0"
          >
            {locales.map((value) => (
              <option key={value} value={value}>
                {labels[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-card-foreground shadow-soft md:inline-flex">
        <Languages size={14} className="text-primary" />
        <span className="sr-only">{accessibleLabel}</span>
        <NativeSelect
          value={locale}
          onChange={(event) => handleChange(event.target.value as Locale)}
          className="h-auto min-w-[8.5rem] border-0 bg-transparent px-0 py-0 pr-7 text-xs shadow-none focus:ring-0"
          wrapperClassName="min-w-[8.5rem]"
          aria-label={accessibleLabel}
          title={accessibleLabel}
        >
          {locales.map((value) => (
            <option key={value} value={value}>
              {labels[value]}
            </option>
          ))}
        </NativeSelect>
      </label>
    </>
  );
}
