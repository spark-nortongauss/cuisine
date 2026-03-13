import { ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <Card variant="muted" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-primary/20 bg-white/[0.06]">
        <Inbox className="text-primary" size={22} />
      </div>
      <p className="font-serif text-2xl text-card-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? (
        <div className="mt-5 flex justify-center">
          <Button asChild>
            <Link href={action.href}>
              {action.label}
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
