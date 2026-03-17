import { z } from "zod";
import { getOpenAiClient } from "@/lib/ai/openai";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type TranslationBlock = {
  id: string;
  text: string;
};

export type TranslationRequestOptions = {
  maxRetries?: number;
  timeoutMs?: number;
};

const languageNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Brazilian Portuguese",
  fr: "French",
  es: "Spanish",
  ar: "Arabic",
  zh: "Simplified Chinese",
  hi: "Hindi",
};

const translationResponseSchema = z.object({
  translations: z.array(
    z.object({
      index: z.number().int().min(0),
      text: z.string(),
    }),
  ),
});

const translationCache = new Map<string, string>();

function buildCacheKey(locale: Locale, text: string) {
  return `${locale}::${text}`;
}

function chunkBlocks(blocks: TranslationBlock[], maxCharacters = 12000) {
  const chunks: TranslationBlock[][] = [];
  let currentChunk: TranslationBlock[] = [];
  let currentSize = 0;

  for (const block of blocks) {
    const blockSize = block.text.length;
    if (currentChunk.length && currentSize + blockSize > maxCharacters) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(block);
    currentSize += blockSize;
  }

  if (currentChunk.length) chunks.push(currentChunk);
  return chunks;
}

async function translateChunk(locale: Locale, context: string, chunk: TranslationBlock[], options?: TranslationRequestOptions) {
  const prompt = `You are a culinary localization editor.
Translate every text into ${languageNames[locale]}.

Rules:
1) Preserve meaning, nuance, and premium culinary tone.
2) Preserve numbers, units, temperatures, times, and line breaks when possible.
3) Do not add or remove content.
4) Leave proper nouns, IDs, filenames, and URLs unchanged.
5) Return ONLY valid JSON with this shape:
{"translations":[{"index":0,"text":"..."}]}

Context:
${context}

Texts:
${JSON.stringify(chunk.map((block, index) => ({ index, text: block.text })))} `;

  const completion = await getOpenAiClient().responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    text: {
      format: {
        type: "json_object",
      },
    },
  }, {
    maxRetries: options?.maxRetries ?? 0,
    timeout: options?.timeoutMs,
  });

  const payload = translationResponseSchema.parse(JSON.parse(completion.output_text));
  const translatedByIndex = new Map(payload.translations.map((item) => [item.index, item.text]));

  return chunk.map((block, index) => ({
    id: block.id,
    text: translatedByIndex.get(index) ?? block.text,
  }));
}

export async function translateTextBlocks(locale: Locale, blocks: TranslationBlock[], context: string, options?: TranslationRequestOptions) {
  const translated: Record<string, string> = {};

  for (const block of blocks) {
    translated[block.id] = block.text;
  }

  if (locale === defaultLocale) return translated;

  const uniqueBlocks = new Map<string, TranslationBlock>();
  for (const block of blocks) {
    if (!block.text.trim()) continue;
    const cacheKey = buildCacheKey(locale, block.text);
    const cached = translationCache.get(cacheKey);
    if (cached) {
      translated[block.id] = cached;
      continue;
    }

    if (!uniqueBlocks.has(block.text)) {
      uniqueBlocks.set(block.text, block);
    }
  }

  const missingBlocks = Array.from(uniqueBlocks.values());
  if (!missingBlocks.length) return translated;

  for (const chunk of chunkBlocks(missingBlocks)) {
    try {
      const localizedChunk = await translateChunk(locale, context, chunk, options);
      for (const item of localizedChunk) {
        const source = chunk.find((block) => block.id === item.id)?.text ?? item.text;
        translationCache.set(buildCacheKey(locale, source), item.text);
      }
    } catch (error) {
      console.warn("[translate-text-blocks] translation failed; falling back to source text", {
        locale,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const block of blocks) {
    translated[block.id] = translationCache.get(buildCacheKey(locale, block.text)) ?? block.text;
  }

  return translated;
}

export async function translatePlainText(locale: Locale, text: string | null | undefined, context: string, options?: TranslationRequestOptions) {
  if (!text?.trim()) return text ?? null;
  const translated = await translateTextBlocks(locale, [{ id: "value", text }], context, options);
  return translated.value ?? text;
}
