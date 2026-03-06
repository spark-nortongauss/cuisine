import { NextResponse } from "next/server";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { generateMichelinMenus } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    console.info("[generate-menu] request start");
    const json = await request.json();
    const parsed = generateMenuSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    console.info("[generate-menu] openai start");
    const options = await generateMichelinMenus(parsed.data);
    console.info("[generate-menu] openai end", { optionsCount: options.length });

    console.info("[generate-menu] supabase write start");
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : supabaseServer;
    const { data, error } = await supabase
      .from("menu_generations")
      .insert({ request: parsed.data, response: options, chef_user_id: user?.id ?? null })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[generate-menu] supabase write error", error);
      return NextResponse.json({ success: false, error: error?.message ?? "Failed to save generated menu." }, { status: 500 });
    }

    console.info("[generate-menu] request end", { menuId: data.id });
    return NextResponse.json({ success: true, menuId: data.id, options });
  } catch (error) {
    console.error("[generate-menu] unexpected error", error);
    return NextResponse.json({ success: false, error: "We could not generate menus right now. Please try again." }, { status: 500 });
  }
}
