import { NextResponse } from "next/server";
import { voteSchema } from "@/lib/schemas/menu";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashPublicToken } from "@/lib/db-schema";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createSupabaseAdminClient();
  const { token } = await params;
  const tokenHash = hashPublicToken(token);

  const { data, error } = await supabase
    .from("menu_invites")
    .select("id, menu_id, status, selected_option_id, invitee_note, menus(id, title, menu_options(id, title, michelin_name, concept_summary, concept, option_no, menu_dishes(course_no, course_label, dish_name, description)))")
    .eq("token_hash", tokenHash)
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createSupabaseAdminClient();
  const { token } = await params;
  const tokenHash = hashPublicToken(token);

  const payload = voteSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ success: false, error: payload.error.flatten() }, { status: 400 });

  const { error } = await supabase
    .from("menu_invites")
    .update({
      selected_option_id: payload.data.optionId,
      invitee_note: payload.data.note ?? null,
      status: "voted",
      voted_at: new Date().toISOString(),
    })
    .eq("token_hash", tokenHash);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
