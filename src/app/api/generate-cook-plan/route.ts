import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateCookPlanForMenu } from "@/lib/cook-plan-service";

export async function POST(request: Request) {
  const { menuId, menuGenerationId, selectedOptionId } = await request.json();
  const effectiveMenuId = menuId ?? menuGenerationId;

  if (!effectiveMenuId) {
    return NextResponse.json({ success: false, code: "MISSING_MENU_ID", error: "menuId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, code: "UNAUTHENTICATED", error: "Authentication required" }, { status: 401 });
  }

  const result = await generateCookPlanForMenu({
    menuId: effectiveMenuId,
    ownerId: user.id,
    selectedOptionId,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        code: result.code,
        error: result.error,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    success: true,
    menuId: result.menuId,
    cookPlanId: result.cookPlanId,
  });
}
