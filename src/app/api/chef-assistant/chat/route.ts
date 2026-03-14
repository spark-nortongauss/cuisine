import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { runChefAssistant } from "@/lib/ai/chef-assistant";

export async function POST(request: Request) {
  const supabaseServer = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await runChefAssistant(user.id, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to process chef assistant request" }, { status: 500 });
  }
}
