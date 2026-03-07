import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendInviteSms } from "@/lib/sms/twilio";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashPublicToken } from "@/lib/db-schema";

const schema = z.object({
  menuId: z.string().uuid(),
  inviteeFirstName: z.string().min(1),
  inviteePhone: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const token = crypto.randomUUID();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("feedback_requests").insert({
    menu_id: parsed.data.menuId,
    invitee_first_name: parsed.data.inviteeFirstName,
    invitee_phone: parsed.data.inviteePhone,
    token_hash: hashPublicToken(token),
    status: "pending",
    sent_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${token}`;
  await sendInviteSms(parsed.data.inviteePhone, `Share your meal feedback: ${link}`);
  return NextResponse.json({ success: true });
}
