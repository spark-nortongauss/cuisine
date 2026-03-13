/* eslint-disable @next/next/no-img-element */

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageLightbox, type LightboxItem } from "@/components/ui/image-lightbox";
import { Textarea } from "@/components/ui/textarea";
import { resolveOptionDisplayTitle } from "@/lib/menu-display";
import { cn } from "@/lib/utils";

type ApprovalDish = {
  id: string;
  course_no: number;
  course_label: string | null;
  dish_name: string;
  description: string;
  imageUrl: string | null;
};

type ApprovalOption = {
  id: string;
  title: string | null;
  michelin_name: string | null;
  concept_summary: string | null;
  concept: string | null;
  option_no: number;
  heroImageUrl: string | null;
  dishes: ApprovalDish[];
};

type ApprovalTokenViewProps = {
  token: string;
  options: ApprovalOption[];
  initialSelectedOptionId: string | null;
  initialNote: string;
  initialStatus: string;
};

function buildPreviewItems(option: ApprovalOption): LightboxItem[] {
  return [
    ...(option.heroImageUrl
      ? [
          {
            src: option.heroImageUrl,
            alt: `${resolveOptionDisplayTitle(option) ?? `Option ${option.option_no}`} hero`,
            title: resolveOptionDisplayTitle(option) ?? `Option ${option.option_no}`,
            subtitle: "Hero image",
            filename: `option-${option.option_no}-hero.jpg`,
          },
        ]
      : []),
    ...option.dishes
      .filter((dish) => dish.imageUrl)
      .map((dish, index) => ({
        src: dish.imageUrl as string,
        alt: dish.dish_name,
        title: dish.dish_name,
        subtitle: dish.course_label ?? `Course ${dish.course_no}`,
        filename: `option-${option.option_no}-dish-${index + 1}.jpg`,
      })),
  ];
}

export function ApprovalTokenView({
  token,
  options,
  initialSelectedOptionId,
  initialNote,
  initialStatus,
}: ApprovalTokenViewProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialSelectedOptionId);
  const [note, setNote] = useState(initialNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<LightboxItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedOptionId) ?? null,
    [options, selectedOptionId],
  );

  function openPreview(option: ApprovalOption, index: number) {
    setPreviewItems(buildPreviewItems(option));
    setPreviewIndex(index);
    setPreviewOpen(true);
  }

  async function submitVote() {
    if (!selectedOptionId || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitState("idle");
    setMessage(null);

    try {
      const response = await fetch(`/api/approval/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selectedOptionId, note: note.trim() || undefined }),
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!response.ok || !payload?.success) {
        setSubmitState("error");
        setMessage(payload?.error ?? "Unable to submit your vote right now.");
        return;
      }

      setSubmitState("success");
      setMessage("Your choice has been recorded successfully.");
    } catch {
      setSubmitState("error");
      setMessage("Unable to submit your vote right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {options.map((option) => {
            const previewableItems = buildPreviewItems(option);
            const isSelected = selectedOptionId === option.id;
            const courseCountLabel = `${option.dishes.length} ${option.dishes.length === 1 ? "course" : "courses"}`;

            return (
              <Card
                key={option.id}
                variant="feature"
                className={cn("overflow-hidden p-0 transition", isSelected ? "border-primary/35 shadow-glow" : "")}
              >
                <div className="relative">
                  {option.heroImageUrl ? (
                    <button
                      type="button"
                      onClick={() => openPreview(option, 0)}
                      className="group block w-full text-left"
                      aria-label={`Open image preview for ${resolveOptionDisplayTitle(option) ?? `Option ${option.option_no}`}`}
                    >
                      <img
                        src={option.heroImageUrl}
                        alt={`${resolveOptionDisplayTitle(option) ?? `Option ${option.option_no}`} hero`}
                        className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    </button>
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(232,194,117,0.16),transparent_30%),linear-gradient(160deg,rgba(26,34,50,0.98),rgba(11,16,29,0.96))] text-sm text-muted-foreground">
                      <ImageIcon size={16} className="mr-2 text-primary" />
                      Hero image unavailable
                    </div>
                  )}
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <Badge variant={isSelected ? "success" : "accent"}>{isSelected ? "Selected" : `Option ${option.option_no}`}</Badge>
                    <Badge variant="default">{courseCountLabel}</Badge>
                  </div>
                </div>

                <div className="space-y-5 p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="section-label">Curated direction</p>
                      <h2 className="font-serif text-3xl leading-tight">{resolveOptionDisplayTitle(option) ?? `Option ${option.option_no}`}</h2>
                      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {option.concept_summary ?? option.concept ?? "No concept summary available."}
                      </p>
                    </div>
                    <Button
                      variant={isSelected ? "secondary" : "outline"}
                      onClick={() => setSelectedOptionId(option.id)}
                      aria-pressed={isSelected}
                    >
                      <CheckCircle2 size={15} />
                      {isSelected ? "Selected" : "Choose this option"}
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {option.dishes.map((dish, dishIndex) => {
                      const imageIndex = option.heroImageUrl ? dishIndex + 1 : dishIndex;
                      return (
                        <div key={dish.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3">
                          {dish.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => openPreview(option, imageIndex)}
                              className="group mb-3 block w-full text-left"
                              aria-label={`Preview ${dish.dish_name}`}
                            >
                              <img
                                src={dish.imageUrl}
                                alt={dish.dish_name}
                                className="h-36 w-full rounded-[1.2rem] object-cover transition duration-300 group-hover:scale-[1.01]"
                              />
                            </button>
                          ) : (
                            <div className="mb-3 flex h-36 w-full items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.03] text-xs text-muted-foreground">
                              <ImageIcon size={14} className="mr-2 text-primary" />
                              Image unavailable
                            </div>
                          )}
                          <p className="section-label">{dish.course_label ?? `Course ${dish.course_no}`}</p>
                          <p className="mt-1 text-base font-semibold text-card-foreground">{dish.dish_name}</p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dish.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  {previewableItems.length > 1 ? (
                    <p className="text-xs text-muted-foreground">Tap any picture to open zoom, next/previous, download, and share controls.</p>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Your response</p>
                <h2 className="mt-2 font-serif text-3xl">Cast your vote</h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                <ShieldCheck size={18} />
              </span>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="section-label">Selection status</p>
                <Badge variant={submitState === "success" || initialStatus === "voted" ? "success" : "default"}>
                  {submitState === "success" || initialStatus === "voted" ? "Vote recorded" : "Awaiting vote"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {selectedOption
                  ? `You are currently voting for ${resolveOptionDisplayTitle(selectedOption) ?? `Option ${selectedOption.option_no}`}.`
                  : "Select one option card to enable the vote button."}
              </p>
            </div>

            <label className="space-y-2">
              <span className="section-label">Optional note</span>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Share a preference, concern, or quick note for the host."
                maxLength={220}
              />
              <p className="text-xs text-muted-foreground">{note.length}/220</p>
            </label>

            {message ? (
              <div
                className={cn(
                  "rounded-[1.4rem] border px-4 py-3 text-sm",
                  submitState === "error"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-success/25 bg-success/10 text-success",
                )}
              >
                {message}
              </div>
            ) : null}

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock size={14} className="text-primary" />
                Secure tokenized response
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This link records only your menu preference and optional note. You can close the preview any time with Escape, the backdrop, or the close button.
              </p>
            </div>

            <Button className="w-full" onClick={submitVote} disabled={!selectedOptionId || isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isSubmitting ? "Submitting vote..." : submitState === "success" || initialStatus === "voted" ? "Update vote" : "Submit vote"}
            </Button>
          </Card>
        </div>
      </div>

      <ImageLightbox
        items={previewItems}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        activeIndex={previewIndex}
        onActiveIndexChange={setPreviewIndex}
      />
    </>
  );
}
