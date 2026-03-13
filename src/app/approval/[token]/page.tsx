import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { ApprovalTokenView } from "@/components/modules/approval-token-view";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashPublicToken } from "@/lib/db-schema";
import { resolveStorageImageUrl } from "@/lib/menu-images";

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
        eyebrow="Secure invitee preview"
        title={typedInvite.menus.title?.trim() || "Menu approval"}
        description="Review each curated direction, open images in full preview, and submit the option that feels strongest for the table."
        chips={["Private voting link", "Interactive image preview", "Mobile friendly review"]}
      />

      <ApprovalTokenView
        token={token}
        initialStatus={typedInvite.status}
        initialNote={typedInvite.invitee_note ?? ""}
        initialSelectedOptionId={typedInvite.selected_option_id}
        options={resolvedOptions}
      />
    </PageTransition>
  );
}
