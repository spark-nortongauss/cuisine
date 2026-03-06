import { PageTransition } from "@/components/layout/page-transition";
import { GenerateMenuForm } from "@/components/modules/generate-menu-form";
import { PageHero } from "@/components/ui/page-hero";

export default function GeneratePage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Flagship Experience"
        title="Generate an extraordinary Michelin-style service"
        description="Combine context, constraints, and flavor direction to produce cinematic menu options for your next event."
      />
      <GenerateMenuForm />
    </PageTransition>
  );
}
