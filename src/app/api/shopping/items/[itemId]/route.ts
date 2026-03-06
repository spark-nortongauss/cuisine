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

  const supabase = createSupabaseAdminClient();
  const { data: item, error: itemError } = await supabase
    .from("shopping_items")
    .select("id, shopping_list_id")
    .eq("id", itemId)
    .single();

  if (itemError || !item) return NextResponse.json({ error: "Shopping item not found" }, { status: 404 });

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("chef_user_id")
    .eq("id", item.shopping_list_id)
    .single();

  if (user?.id && list?.chef_user_id && list.chef_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("shopping_items").update({ purchased }).eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
