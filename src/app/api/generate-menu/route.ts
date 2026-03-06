import { NextResponse } from "next/server";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { generateMichelinMenus } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = generateMenuSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const options = await generateMichelinMenus(parsed.data);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("menu_generations")
    .insert({ request: parsed.data, response: options, chef_user_id: user?.id ?? null })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ options, menuGenerationId: data.id });
}
