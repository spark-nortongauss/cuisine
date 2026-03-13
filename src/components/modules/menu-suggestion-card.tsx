/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, CalendarClock, Clock3, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SuggestionAction = {
  href: string;
  label: string;
};

export type MenuSuggestionCardProps = {
  title: string;
  description: string;
  imageUrl?: string | null;
  mealType: string;
  serveLabel: string;
  inviteeCount?: number | null;
  statusLabel: string;
  statusVariant?: "default" | "accent" | "success" | "warning" | "danger";
  primaryAction: SuggestionAction;
  secondaryAction?: SuggestionAction;
};

export function MenuSuggestionCard({
  title,
  description,
  imageUrl,
  mealType,
  serveLabel,
  inviteeCount,
  statusLabel,
  statusVariant = "accent",
  primaryAction,
  secondaryAction,
}: MenuSuggestionCardProps) {
  return (
    <Card variant="feature" className="group overflow-hidden p-0">
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-52 w-full items-end bg-[radial-gradient(circle_at_top_left,rgba(232,194,117,0.22),transparent_32%),linear-gradient(160deg,rgba(27,37,55,1),rgba(13,18,31,0.94))] p-5">
            <Badge variant="accent">Premium concept in progress</Badge>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
        <div className="absolute left-4 top-4">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="section-label">{mealType}</p>
          <h3 className="font-serif text-3xl leading-tight text-card-foreground">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground">
            <CalendarClock size={13} className="text-primary" />
            {serveLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground">
            <Clock3 size={13} className="text-primary" />
            {mealType}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground">
            <Users size={13} className="text-primary" />
            {inviteeCount ?? "-"} guests
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight size={15} />
            </Link>
          </Button>
          {secondaryAction ? (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
