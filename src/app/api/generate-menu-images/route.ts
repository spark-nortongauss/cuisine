import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMenuWithOptions, normalizeMenuOptionsWithResolvedImages } from "@/lib/menu-records";
import { enrichMenuImages } from "@/lib/ai/menu-images";
import { resolveLocale } from "@/lib/i18n/config";
import { localizeMenuOptions } from "@/lib/menu-localization";

type GenerateMenuImagesResponse = {
  success: boolean;
  menuId?: string;
  options?: Awaited<ReturnType<typeof normalizeMenuOptionsWithResolvedImages>>;
  error?: string;
  code?: string;
};

export async function POST(request: Request) {
  try {
    const { menuId, prioritizedOptionId, locale, includeOptions } = await request.json();
    const requestLocale = resolveLocale(typeof locale === "string" ? locale : null);
    const shouldIncludeOptions = includeOptions !== false;

    if (!menuId || typeof menuId !== "string") {
      return NextResponse.json<GenerateMenuImagesResponse>(
        { success: false, code: "MISSING_MENU_ID", error: "menuId is required" },
        { status: 400 },
      );
    }

    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user?.id) {
      return NextResponse.json<GenerateMenuImagesResponse>(
        { success: false, code: "UNAUTHENTICATED", error: "Authentication required" },
        { status: 401 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: menu, error: menuError } = await fetchMenuWithOptions(menuId);

    if (menuError || !menu) {
      return NextResponse.json<GenerateMenuImagesResponse>(
        { success: false, code: "MENU_NOT_FOUND", error: menuError?.message ?? "Menu not found" },
        { status: 404 },
      );
    }

    if (menu.owner_id !== user.id) {
      return NextResponse.json<GenerateMenuImagesResponse>(
        { success: false, code: "FORBIDDEN", error: "Forbidden" },
        { status: 403 },
      );
    }

    await enrichMenuImages({
      supabase,
      ownerId: user.id,
      menuId,
      prioritizedOptionId: typeof prioritizedOptionId === "string" ? prioritizedOptionId : undefined,
      onlyPrioritizedOption: !shouldIncludeOptions && typeof prioritizedOptionId === "string",
    });

    if (!shouldIncludeOptions) {
      return NextResponse.json<GenerateMenuImagesResponse>({ success: true, menuId });
    }

    const { data: refreshedMenu, error: refreshedError } = await fetchMenuWithOptions(menuId);

    if (refreshedError || !refreshedMenu) {
      return NextResponse.json<GenerateMenuImagesResponse>(
        { success: false, code: "MENU_REFRESH_FAILED", error: refreshedError?.message ?? "Unable to reload menu" },
        { status: 500 },
      );
    }

    return NextResponse.json<GenerateMenuImagesResponse>({
      success: true,
      menuId,
      options: await localizeMenuOptions(await normalizeMenuOptionsWithResolvedImages(refreshedMenu.menu_options ?? []), requestLocale),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[generate-menu-images] failed", { message, error });
    return NextResponse.json<GenerateMenuImagesResponse>(
      { success: false, code: "UNEXPECTED_ERROR", error: "Image generation failed" },
      { status: 500 },
    );
  }
}
