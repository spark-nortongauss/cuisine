import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ shoppingListId: string }> }) {
  const { shoppingListId } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: list } = await supabase.from("shopping_lists").select("chef_user_id").eq("id", shoppingListId).single();

  if (user?.id && list?.chef_user_id && list.chef_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "purchased", purchased_at: new Date().toISOString() })
    .eq("id", shoppingListId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
