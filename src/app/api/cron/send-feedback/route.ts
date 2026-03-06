import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, message: "Cron hook ready: fetch yesterday served menus and send Twilio feedback links." });
}
