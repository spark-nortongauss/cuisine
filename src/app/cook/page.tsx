import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CookIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: entries } = await supabase
    .from("shopping_lists")
    .select("id, menu_generation_id, menu_title, serve_at, status")
    .eq("chef_user_id", user?.id ?? "")
    .eq("status", "purchased")
    .order("serve_at", { ascending: false });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Service Timeline"
        title="Cook-ready services"
        description="Only menus with purchased shopping are listed here to keep execution focused and reliable."
      />

      <div className="space-y-3">
        {entries?.length ? (
          entries.map((entry) => (
            <Link key={entry.id} href={`/cook/${entry.menu_generation_id}`} className="block">
              <Card className="transition hover:-translate-y-0.5 hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-serif text-2xl">{entry.menu_title}</h2>
                  <Badge variant="success">Ready</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.serve_at))}
                </p>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">No purchased shopping lists yet. Mark shopping as purchased to unlock cook execution.</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
