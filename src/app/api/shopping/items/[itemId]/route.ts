import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const { purchased } = await request.json();

  if (typeof purchased !== "boolean") {
    return NextResponse.json({ error: "purchased must be a boolean" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data: item, error: itemError } = await supabase
    .from("shopping_items")
    .select("id, shopping_list_id")
    .eq("id", itemId)
    .single();

  if (itemError || !item) return NextResponse.json({ error: "Shopping item not found" }, { status: 404 });

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("menu_id, menus(owner_id)")
    .eq("id", item.shopping_list_id)
    .single();

  const menu = Array.isArray(list?.menus) ? list?.menus[0] : list?.menus;
  if (!menu || menu.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("shopping_items").update({ purchased }).eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
