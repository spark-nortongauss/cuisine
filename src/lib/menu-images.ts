import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const MENU_IMAGE_BUCKET = process.env.SUPABASE_MENU_IMAGE_BUCKET ?? "menu-assets";

export type StorageImageResolution = {
  path: string | null;
  url: string | null;
};

function normalizeStoragePath(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}

function asHttpsUrl(path: string) {
  return /^https?:\/\//i.test(path) ? path : null;
}

export async function resolveStorageImageUrl(params: {
  supabase: SupabaseClient<Database>;
  path: string | null | undefined;
  signedUrlExpiresIn?: number;
}) {
  const { supabase, path, signedUrlExpiresIn = 60 * 60 } = params;
  if (!path) return null;

  const directUrl = asHttpsUrl(path);
  if (directUrl) return directUrl;

  const normalizedPath = normalizeStoragePath(path);

  const { data: signedData, error: signedError } = await supabase.storage
    .from(MENU_IMAGE_BUCKET)
    .createSignedUrl(normalizedPath, signedUrlExpiresIn);

  if (!signedError && signedData?.signedUrl) return signedData.signedUrl;

  const { data: publicData } = supabase.storage.from(MENU_IMAGE_BUCKET).getPublicUrl(normalizedPath);
  if (publicData?.publicUrl) return publicData.publicUrl;

  console.error("[menu-images] failed to resolve storage image url", {
    bucket: MENU_IMAGE_BUCKET,
    path: normalizedPath,
    signedError: signedError?.message,
  });
  return null;
}

export async function resolveStorageImage(params: {
  supabase: SupabaseClient<Database>;
  path: string | null | undefined;
  signedUrlExpiresIn?: number;
}): Promise<StorageImageResolution> {
  const path = params.path ?? null;
  if (!path) return { path: null, url: null };

  const url = await resolveStorageImageUrl(params);
  return { path, url };
}

export async function resolveStorageImagesForMenuOption<TOption extends {
  heroImagePath?: string | null;
  dishes: Array<{ imagePath?: string | null }>;
}>(supabase: SupabaseClient<Database>, option: TOption): Promise<TOption & { heroImageUrl: string | null; dishes: Array<TOption["dishes"][number] & { imageUrl: string | null }> }> {
  const [heroImageUrl, dishImageUrls] = await Promise.all([
    resolveStorageImageUrl({ supabase, path: option.heroImagePath }),
    Promise.all(option.dishes.map((dish) => resolveStorageImageUrl({ supabase, path: dish.imagePath }))),
  ]);

  return {
    ...option,
    heroImageUrl,
    dishes: option.dishes.map((dish, index) => ({
      ...dish,
      imageUrl: dishImageUrls[index] ?? null,
    })),
  };
}

export function getMenuImageBucket() {
  return MENU_IMAGE_BUCKET;
}
