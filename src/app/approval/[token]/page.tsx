import { notFound } from "next/navigation";
import { CheckCircle2, ImageIcon } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashPublicToken } from "@/lib/db-schema";
import { resolveStorageImageUrl } from "@/lib/menu-images";
import { resolveOptionDisplayTitle } from "@/lib/menu-display";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

type ApprovalInvite = {
  id: string;
  status: string;
  selected_option_id: string | null;
  invitee_note: string | null;
  menus: {
    title: string | null;
    menu_options: Array<{
      id: string;
      title: string | null;
      michelin_name: string | null;
      concept_summary: string | null;
      concept: string | null;
      option_no: number;
      hero_image_path: string | null;
      menu_dishes: Array<{
        id: string;
        course_no: number;
        course_label: string | null;
        dish_name: string;
        description: string;
        image_path: string | null;
      }>;
    }>;
  };
};

export default async function ApprovalTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await getServerLocale();
  const t = getServerT(locale);
  const supabase = createSupabaseAdminClient();
  const tokenHash = hashPublicToken(token);

  const { data: invite, error } = await supabase
    .from("menu_invites")
    .select("id, status, selected_option_id, invitee_note, menus(title, menu_options(id, title, michelin_name, concept_summary, concept, option_no, hero_image_path, menu_dishes(id, course_no, course_label, dish_name, description, image_path)))")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !invite) return notFound();

  const typedInvite = invite as unknown as ApprovalInvite;
  const options = (typedInvite.menus.menu_options ?? []).sort((a, b) => a.option_no - b.option_no);

  const resolvedOptions = await Promise.all(
    options.map(async (option) => {
      const [heroImageUrl, dishes] = await Promise.all([
        resolveStorageImageUrl({ supabase, path: option.hero_image_path }),
        Promise.all(
          (option.menu_dishes ?? [])
            .sort((a, b) => a.course_no - b.course_no)
            .map(async (dish) => ({
              ...dish,
              imageUrl: await resolveStorageImageUrl({ supabase, path: dish.image_path }),
            })),
        ),
      ]);

      return {
        ...option,
        heroImageUrl,
        dishes,
      };
    }),
  );

  return (
    <PageTransition>
      <PageHero
        eyebrow={t("approval.token.eyebrow", "Secure Invitee View")}
        title={typedInvite.menus.title?.trim() || t("approval.token.title", "Menu Approval")}
        description={t("approval.token.description", "Review each curated option and cast your preference. Dish and hero imagery are loaded from secure storage URLs for reliable rendering.")}
      />

      <div className="grid gap-3">
        {resolvedOptions.map((option) => (
          <Card key={option.id} className="space-y-4 transition hover:-translate-y-0.5 hover:shadow-luxe">
            {option.heroImageUrl ? (
              <img src={option.heroImageUrl} alt={`${resolveOptionDisplayTitle(option) ?? t("approval.token.option", "Menu option")} ${t("approval.token.hero", "hero")}`} className="h-48 w-full rounded-2xl object-cover" />
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-border/70 bg-muted/30 text-sm text-muted-foreground">
                <ImageIcon size={16} className="mr-2" />
                {t("approval.token.heroUnavailable", "Hero image unavailable")}
              </div>
            )}

            <h2 className="font-serif text-2xl">{resolveOptionDisplayTitle(option) ?? `${t("approval.token.option", "Option")} ${option.option_no}`}</h2>
            <p className="text-sm text-muted-foreground">{option.concept_summary ?? option.concept ?? t("approval.token.noConcept", "No concept summary available.")}</p>

            <div className="grid gap-2 md:grid-cols-2">
              {option.dishes.map((dish) => (
                <div key={dish.id} className="rounded-xl border border-border/60 bg-card/80 p-3">
                  {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.dish_name} className="mb-2 h-28 w-full rounded-lg object-cover" /> : null}
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{dish.course_label ?? `${t("approval.detail.course", "Course")} ${dish.course_no}`}</p>
                  <p className="font-medium">{dish.dish_name}</p>
                  <p className="text-sm text-muted-foreground">{dish.description}</p>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full md:w-auto">
              <CheckCircle2 size={15} />{t("approval.token.vote", "Vote this option")}
            </Button>
          </Card>
        ))}
      </div>
      <Textarea defaultValue={typedInvite.invitee_note ?? ""} placeholder={t("approval.token.optionalNote", "Optional note")} />
    </PageTransition>
  );
}
