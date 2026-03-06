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
    <section className="mx-auto flex min-h-[80vh] max-w-md items-center">
      <Card className="w-full space-y-6 p-6 md:p-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gastronomic Cuisine</p>
          <h1 className="font-serif text-4xl">Chef Login</h1>
          <p className="text-sm text-muted-foreground">Access your private kitchen operations workspace.</p>
        </div>
        <LoginForm nextPath={params.next} />
      </Card>
    </section>
  );
}
