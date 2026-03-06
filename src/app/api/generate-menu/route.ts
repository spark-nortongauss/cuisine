import { NextResponse } from "next/server";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { generateMichelinMenus } from "@/lib/ai/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = generateMenuSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const options = await generateMichelinMenus(parsed.data);
  const supabase = createSupabaseServerClient();
  await supabase.from("menu_generations").insert({ request: parsed.data, response: options });

  return NextResponse.json({ options });
}
