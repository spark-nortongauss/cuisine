import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const menuId = typeof payload?.menuId === "string" ? payload.menuId : null;

  if (!menuId) {
    return NextResponse.json({ success: false, error: "menuId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select("id, owner_id, serve_at, invitee_count")
    .eq("id", menuId)
    .maybeSingle();

  if (menuError || !menu) {
    return NextResponse.json({ success: false, error: menuError?.message ?? "Menu not found" }, { status: 404 });
  }

  if (menu.owner_id !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("menu_favorites")
    .select("id")
    .eq("menu_id", menuId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, alreadyFavorited: true });
  }

  const servedOn = menu.serve_at ? new Date(menu.serve_at).toISOString().slice(0, 10) : null;

  const { error: insertError } = await supabase.from("menu_favorites").insert({
    owner_id: user.id,
    menu_id: menuId,
    rating_percent: 0,
    served_on: servedOn,
    people_count: menu.invitee_count ?? null,
  });

  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, alreadyFavorited: false });
}
