import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CookPayload = {
  prepSchedule?: { slot: string; action: string }[];
  miseEnPlace?: string[];
  timeline?: { time: string; step: string }[];
  serviceSequence?: string[];
  platingAssemblyNotes?: string[];
  assemblyDraft?: string;
  recipes?: { dish: string; ingredients: string[]; method: string[] }[];
};

export default async function CookPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: list, error: listError } = await supabaseServer
    .from("shopping_lists")
    .select("id, chef_user_id, menu_title, serve_at, status")
    .eq("menu_generation_id", menuId)
    .eq("status", "purchased")
    .single();

  if (listError) {
    console.error("[cook-detail] shopping list query error", listError);
  }

  if (!list) return notFound();
  if (user?.id && list.chef_user_id && list.chef_user_id !== user.id) return notFound();

  const { data: cookPlan, error: planError } = await supabaseServer.from("cook_plans").select("payload").eq("menu_generation_id", menuId).single();
  if (planError) {
    console.error("[cook-detail] cook plan query error", planError);
  }
  const payload = (cookPlan?.payload ?? {}) as CookPayload;
  const parsedDate = list.serve_at ? new Date(list.serve_at) : null;
  const serviceLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsedDate)
    : "Service time TBD";

  return (
    <PageTransition>
      <PageHero
        eyebrow="Service Timeline"
        title={list.menu_title}
        description={serviceLabel}
      />

      <div className="space-y-3">
        <Card>
          <h2 className="font-serif text-2xl">Cooking schedule</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(payload.timeline ?? []).map((slot) => (
              <li key={`${slot.time}-${slot.step}`} className="rounded-xl border border-border/60 p-2"><strong>{slot.time}</strong> · {slot.step}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl">Recipes</h2>
          <div className="mt-3 space-y-3">
            {(payload.recipes ?? []).map((recipe) => (
              <div key={recipe.dish} className="rounded-xl border border-border/60 p-3">
                <p className="font-medium">{recipe.dish}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Ingredients</p>
                <ul className="list-disc pl-5 text-sm">{(recipe.ingredients ?? []).map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Method</p>
                <ol className="list-decimal pl-5 text-sm">{(recipe.method ?? []).map((step) => <li key={step}>{step}</li>)}</ol>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl">Plating & assembly guidance</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{(payload.platingAssemblyNotes ?? []).map((note) => <li key={note}>{note}</li>)}</ul>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">{payload.assemblyDraft ?? "No assembly draft generated yet."}</pre>
        </Card>
      </div>
    </PageTransition>
  );
}
