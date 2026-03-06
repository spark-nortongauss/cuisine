import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { shareMenuSchema } from "@/lib/schemas/menu";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = shareMenuSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const invites = body.data.invitees.map((invitee) => ({
    menu_id: body.data.menuId,
    ...invitee,
    token: crypto.randomUUID(),
  }));
  const { data, error } = await supabase.from("menu_invites").insert(invites).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invites: data });
}
