const MENU_IMAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MENU_IMAGE_BUCKET ?? "menu-assets";

export function resolveMenuImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${supabaseUrl}/storage/v1/object/public/${MENU_IMAGE_BUCKET}/${normalizedPath}`;
}
