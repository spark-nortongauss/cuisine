import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, next: ["/api/generate-shopping-list", "/api/generate-cook-plan"] });
}
