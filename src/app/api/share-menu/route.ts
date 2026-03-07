import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { shareMenuSchema } from "@/lib/schemas/menu";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashPublicToken } from "@/lib/db-schema";

export async function POST(request: Request) {
  const body = shareMenuSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ success: false, error: body.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const invites = body.data.invitees.map((invitee) => {
    const token = crypto.randomUUID();
    return {
      menu_id: body.data.menuId,
      invitee_first_name: invitee.firstName,
      invitee_phone: invitee.mobile,
      token_hash: hashPublicToken(token),
      channel: "sms",
      status: "pending",
      raw_token: token,
    };
  });

  const { data, error } = await supabase
    .from("menu_invites")
    .insert(invites.map(({ raw_token, ...dbRow }) => dbRow))
    .select("id, menu_id, invitee_first_name, invitee_phone, status, created_at");

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, invites: data, tokens: invites.map((invite) => ({ mobile: invite.invitee_phone, token: invite.raw_token })) });
}
