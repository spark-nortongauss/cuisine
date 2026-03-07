import { cookies } from "next/headers";
import { defaultLocale, getLocaleDirection, resolveLocale, type Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get("locale")?.value ?? defaultLocale);
}

export function formatWithLocale(locale: Locale, date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function getServerT(locale: Locale) {
  return (key: string, fallback?: string) => translate(locale, key, fallback);
}

export function getServerDirection(locale: Locale) {
  return getLocaleDirection(locale);
}
