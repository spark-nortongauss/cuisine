import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CookIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: entries, error } = await supabaseServer
    .from("cook_plans")
    .select("menu_generation_id, shopping_lists!left(id, menu_title, serve_at, status)")
    .eq("chef_user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[cook-page] query error", error);
  }

  const eligible = (entries ?? [])
    .map((entry) => {
      const shoppingList = Array.isArray(entry.shopping_lists) ? entry.shopping_lists[0] : entry.shopping_lists;
      return { menuGenerationId: entry.menu_generation_id, shoppingList };
    })
    .filter((entry) => entry.menuGenerationId && entry.shoppingList?.status === "purchased");

  console.info("[cook-page] query result", { count: eligible.length });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Service Timeline"
        title="Cook-ready services"
        description="Only menus with purchased shopping are listed here to keep execution focused and reliable."
      />

      <div className="space-y-3">
        {eligible.length ? (
          eligible.map((entry) => {
            const parsedDate = entry.shoppingList?.serve_at ? new Date(entry.shoppingList.serve_at) : null;
            const serviceLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
              ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsedDate)
              : "Service time TBD";

            return (
              <Link key={`${entry.menuGenerationId}`} href={`/cook/${entry.menuGenerationId}`} className="block">
                <Card className="transition hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-2xl">{entry.shoppingList?.menu_title ?? "Untitled menu"}</h2>
                    <Badge variant="success">Ready</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{serviceLabel}</p>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">No purchased shopping lists yet. Mark shopping as purchased to unlock cook execution.</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
