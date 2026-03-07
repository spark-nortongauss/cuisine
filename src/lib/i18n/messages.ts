import type { Locale } from "@/lib/i18n/config";
import en from "@/messages/en";
import ptBR from "@/messages/pt-BR";
import fr from "@/messages/fr";
import es from "@/messages/es";
import ar from "@/messages/ar";
import zh from "@/messages/zh";
import hi from "@/messages/hi";

export const messagesByLocale = {
  en,
  "pt-BR": ptBR,
  fr,
  es,
  ar,
  zh,
  hi,
} as const;

export type MessageSchema = typeof en;

type MessageLeaf = string | number | boolean;

function getPathValue(source: unknown, path: string): MessageLeaf | undefined {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source) as MessageLeaf | undefined;
}

export function translate(locale: Locale, key: string, fallback?: string): string {
  const value = getPathValue(messagesByLocale[locale], key) ?? getPathValue(messagesByLocale.en, key);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback ?? key;
}
