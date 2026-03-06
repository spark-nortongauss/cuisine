import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ShoppingIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("id, menu_title, meal_type, serve_at, status, shopping_items(purchased)")
    .eq("chef_user_id", user?.id ?? "")
    .order("serve_at", { ascending: false });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Operations"
        title="Shopping lists"
        description="Track every approved menu shopping run, monitor progress, and unlock cook-ready services once purchased."
      />

      <div className="space-y-3">
        {lists?.length ? (
          lists.map((list) => {
            const items = (list.shopping_items ?? []) as { purchased: boolean }[];
            const checked = items.filter((item) => item.purchased).length;
            const total = items.length;
            return (
              <Link key={list.id} href={`/shopping/${list.id}`} className="block">
                <Card className="space-y-2 transition hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-2xl">{list.menu_title}</h2>
                    <Badge variant={list.status === "purchased" ? "success" : "accent"}>{list.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(list.serve_at))}
                    {list.meal_type ? ` · ${list.meal_type}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">Progress: {checked}/{total} items checked</p>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${total ? (checked / total) * 100 : 0}%` }} />
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">No approved menus with shopping lists yet. Validate a generated menu first.</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
