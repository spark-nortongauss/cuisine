import { PageTransition } from "@/components/layout/page-transition";
import { GenerateMenuForm } from "@/components/modules/generate-menu-form";
import { PageHero } from "@/components/ui/page-hero";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

export default async function GeneratePage() {
  const locale = await getServerLocale();
  const t = getServerT(locale);
  return (
    <PageTransition>
      <PageHero
        eyebrow={t("generate.eyebrow", "Flagship Experience")}
        title={t("generate.title", "Generate an extraordinary Michelin-style service")}
        description={t("generate.description", "Combine context, constraints, and flavor direction to produce cinematic menu options for your next event.")}
      />
      <GenerateMenuForm />
    </PageTransition>
  );
}
