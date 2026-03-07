import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMenuWithOptions } from "@/lib/menu-records";

export async function POST(request: Request) {
  const { menuId, optionId } = await request.json();

  if (!menuId || !optionId) {
    return NextResponse.json({ success: false, code: "MISSING_PARAMS", error: "menuId and optionId are required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, code: "UNAUTHENTICATED", error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: menu, error: menuError } = await fetchMenuWithOptions(menuId);

  if (menuError || !menu) {
    return NextResponse.json({ success: false, code: "MENU_NOT_FOUND", error: menuError?.message ?? "Menu not found" }, { status: 404 });
  }

  if (menu.owner_id !== user.id) {
    return NextResponse.json({ success: false, code: "FORBIDDEN", error: "Forbidden" }, { status: 403 });
  }

  const exists = (menu.menu_options ?? []).some((option) => option.id === optionId);
  if (!exists) {
    return NextResponse.json({ success: false, code: "OPTION_NOT_FOUND", error: "Menu option does not exist" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("menus")
    .update({ approved_option_id: optionId, status: "approved", chef_user_id: user.id })
    .eq("id", menuId);

  if (updateError) {
    return NextResponse.json({ success: false, code: "MENU_UPDATE_FAILED", error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, menuId, approvedOptionId: optionId, status: "approved" });
}
