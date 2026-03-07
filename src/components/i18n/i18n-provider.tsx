"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getLocaleDirection } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  direction: "ltr" | "rtl";
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    direction: getLocaleDirection(locale),
    t: (key: string, fallback?: string) => translate(locale, key, fallback),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
