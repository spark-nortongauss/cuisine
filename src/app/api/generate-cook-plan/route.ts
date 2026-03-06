import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { menuId, timeline } = await request.json();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("cook_timelines").insert({ menu_id: menuId, timeline });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
