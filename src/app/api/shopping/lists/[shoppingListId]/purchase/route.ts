import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ shoppingListId: string }> }) {
  const { shoppingListId } = await params;

  const supabaseServer = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id, menus(owner_id)")
    .eq("id", shoppingListId)
    .single();

  const menu = Array.isArray(list?.menus) ? list?.menus[0] : list?.menus;
  if (!menu || menu.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("shopping_items")
    .update({ status: "purchased", purchased: true })
    .eq("shopping_list_id", shoppingListId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
