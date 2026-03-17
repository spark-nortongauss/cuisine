import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMenuWithOptions, normalizeMenuOptionsWithResolvedImages } from "@/lib/menu-records";
import { resolveLocale } from "@/lib/i18n/config";
import { localizeMenuOptions } from "@/lib/menu-localization";
import { ensureRestrictionSafeMenuArtifacts } from "@/lib/menu-safety-repair";

export async function GET(request: Request, { params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { searchParams } = new URL(request.url);
  const locale = resolveLocale(searchParams.get("locale"));

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  await ensureRestrictionSafeMenuArtifacts(menuId);

  const { data: menu, error } = await fetchMenuWithOptions(menuId);
  if (error || !menu) {
    return NextResponse.json({ success: false, error: error?.message ?? "Menu not found" }, { status: 404 });
  }
  if (menu.owner_id !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const options = await normalizeMenuOptionsWithResolvedImages(menu.menu_options ?? []);
  return NextResponse.json({ success: true, options: await localizeMenuOptions(options, locale) });
}
