import { NextResponse } from "next/server";
import { sendInviteSms } from "@/lib/sms/twilio";

export async function POST(request: Request) {
  const { mobile, token } = await request.json();
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/approval/${token}`;
  await sendInviteSms(mobile, `You are invited to approve the menu: ${link}`);
  return NextResponse.json({ ok: true });
}
