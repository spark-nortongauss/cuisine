/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Minus, Plus, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { downloadAsset, shareAsset } from "@/lib/browser-media";

export type LightboxItem = {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  filename?: string;
};

type ImageLightboxProps = {
  items: LightboxItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
};

function clampIndex(index: number, length: number) {
  if (!length) return 0;
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
}

export function ImageLightbox({ items, open, onOpenChange, activeIndex, onActiveIndexChange }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const itemCount = items.length;
  const safeIndex = clampIndex(activeIndex, itemCount);
  const activeItem = items[safeIndex];

  useEffect(() => {
    if (!open) {
      setZoom(1);
      setStatusMessage(null);
    }
  }, [open, safeIndex]);

  useEffect(() => {
    if (!open || itemCount <= 1) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") onActiveIndexChange(clampIndex(safeIndex + 1, itemCount));
      if (event.key === "ArrowLeft") onActiveIndexChange(clampIndex(safeIndex - 1, itemCount));
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [itemCount, onActiveIndexChange, open, safeIndex]);

  const canGoPrev = itemCount > 1;
  const counterLabel = useMemo(() => `${safeIndex + 1} / ${itemCount}`, [itemCount, safeIndex]);

  if (!activeItem) return null;

  async function handleDownload() {
    await downloadAsset({ url: activeItem.src, filename: activeItem.filename });
  }

  async function handleShare() {
    const result = await shareAsset({
      url: activeItem.src,
      title: activeItem.title ?? activeItem.alt,
      filename: activeItem.filename,
    });

    if (result === "copied") setStatusMessage("Image link copied to clipboard.");
    if (result === "unsupported") setStatusMessage("Sharing is not available on this device.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(92vh,56rem)] w-[min(98vw,72rem)] max-w-none overflow-hidden p-0" hideClose>
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-white/10 px-5 pb-4 pt-5 md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle>{activeItem.title ?? activeItem.alt}</DialogTitle>
                {activeItem.subtitle ? <p className="text-sm text-muted-foreground">{activeItem.subtitle}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {itemCount > 1 ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-muted-foreground">
                    {counterLabel}
                  </span>
                ) : null}
                <Button variant="ghost" size="icon-sm" onClick={handleShare} aria-label="Share image">
                  <Share2 size={15} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={handleDownload} aria-label="Download image">
                  <Download size={15} />
                </Button>
                <Button variant="ghost" size="icon-sm" asChild aria-label="Open image in new tab">
                  <a href={activeItem.src} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} />
                  </a>
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close image preview">
                  <X size={15} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setZoom((current) => Math.max(1, Number((current - 0.25).toFixed(2))))}>
                  <Minus size={14} />
                  Zoom Out
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
                  Fit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))))}>
                  <Plus size={14} />
                  Zoom In
                </Button>
              </div>
              {statusMessage ? <p className="text-xs text-muted-foreground">{statusMessage}</p> : null}
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/35">
              {canGoPrev ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
                  onClick={() => onActiveIndexChange(clampIndex(safeIndex - 1, itemCount))}
                  aria-label="Previous image"
                >
                  <span aria-hidden>&larr;</span>
                </Button>
              ) : null}

              <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
                <img
                  key={activeItem.src}
                  src={activeItem.src}
                  alt={activeItem.alt}
                  className={cn("max-h-full w-auto max-w-full rounded-[1.5rem] object-contain shadow-luxe transition-transform duration-200")}
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>

              {canGoPrev ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2"
                  onClick={() => onActiveIndexChange(clampIndex(safeIndex + 1, itemCount))}
                  aria-label="Next image"
                >
                  <span aria-hidden>&rarr;</span>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
