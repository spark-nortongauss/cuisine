import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashPublicToken } from "@/lib/db-schema";

const feedbackSchema = z.object({
  ratings: z.array(
    z.object({
      menuDishId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    }),
  ).min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = feedbackSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ success: false, error: body.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const tokenHash = hashPublicToken(token);

  const { data: feedbackRequest, error: requestError } = await supabase
    .from("feedback_requests")
    .select("id, menu_id, status")
    .eq("token_hash", tokenHash)
    .single();

  if (requestError || !feedbackRequest) {
    return NextResponse.json({ success: false, error: "Feedback request not found" }, { status: 404 });
  }

  const { error: insertError } = await supabase.from("dish_feedback").insert(
    body.data.ratings.map((rating) => ({
      feedback_request_id: feedbackRequest.id,
      menu_dish_id: rating.menuDishId,
      rating: rating.rating,
      comment: rating.comment ?? null,
    })),
  );

  if (insertError) return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });

  await supabase
    .from("feedback_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", feedbackRequest.id);

  const avgRating = body.data.ratings.reduce((sum, rating) => sum + rating.rating, 0) / body.data.ratings.length;

  const { data: existingSummary } = await supabase
    .from("menu_feedback_summary")
    .select("response_count, overall_score")
    .eq("menu_id", feedbackRequest.menu_id)
    .maybeSingle();

  const responseCount = (existingSummary?.response_count ?? 0) + 1;
  const weightedScore = ((Number(existingSummary?.overall_score ?? 0) * (responseCount - 1)) + avgRating) / responseCount;

  await supabase.from("menu_feedback_summary").upsert({
    menu_id: feedbackRequest.menu_id,
    response_count: responseCount,
    overall_score: weightedScore,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
