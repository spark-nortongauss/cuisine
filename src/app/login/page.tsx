import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <section className="mx-auto flex min-h-[82vh] max-w-lg items-center">
      <Card variant="glass" className="w-full space-y-6 p-7 md:p-10">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Gastronomic Cuisine</p>
          <h1 className="font-serif text-5xl">Chef Login</h1>
          <p className="text-sm text-muted-foreground">Access your private culinary command center.</p>
        </div>
        <LoginForm nextPath={params.next} />
      </Card>
    </section>
  );
}
