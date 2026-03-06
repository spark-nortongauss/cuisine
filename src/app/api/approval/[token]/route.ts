import { NextResponse } from "next/server";
import { voteSchema } from "@/lib/schemas/menu";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createSupabaseAdminClient();
  const { token } = await params;
  const { data, error } = await supabase.from("menu_invites").select("*, menu_options(*)").eq("token", token).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createSupabaseAdminClient();
  const { token } = await params;
  const payload = voteSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });

  await supabase.from("menu_votes").insert({ token, ...payload.data });
  return NextResponse.json({ ok: true });
}
