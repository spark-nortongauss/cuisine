import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { menuId, items } = await request.json();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("shopping_items").insert(
    items.map((item: Record<string, unknown>) => ({
      ...item,
      menu_id: menuId,
    })),
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
