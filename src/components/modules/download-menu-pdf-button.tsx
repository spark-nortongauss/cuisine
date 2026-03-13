"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadAsset, shareAsset } from "@/lib/browser-media";

export function DownloadMenuPdfButton({ menuId, showLabel = false }: { menuId: string; showLabel?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const filename = useMemo(() => `menu-${menuId}.pdf`, [menuId]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function openPreview() {
    setLoading(true);
    setShareMessage(null);
    try {
      const response = await fetch(`/api/menus/${menuId}/pdf`);
      if (!response.ok) return;
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return objectUrl;
      });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function sharePdf() {
    if (!pdfUrl) return;
    const result = await shareAsset({ url: pdfUrl, title: "Michelin Menu PDF", filename });
    if (result === "copied") setShareMessage("PDF link copied to clipboard.");
    if (result === "unsupported") setShareMessage("Sharing is not available on this device.");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={showLabel ? "sm" : "icon"}
        className={showLabel ? "w-full sm:w-auto" : undefined}
        onClick={openPreview}
        disabled={loading}
        aria-label={loading ? "Preparing PDF..." : "Download PDF Menu"}
        title={loading ? "Preparing PDF..." : "Download PDF Menu"}
      >
        <Download size={16} />
        {showLabel ? <span>PDF Brief</span> : null}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[min(92vh,56rem)] w-[min(98vw,72rem)] max-w-none overflow-hidden p-0" hideClose>
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b border-white/10 px-5 pb-4 pt-5 md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <DialogTitle>Michelin-style menu brief</DialogTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Preview the exported PDF, then download or share it from the same surface.</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close PDF preview">
                  <X size={15} />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-4 md:px-6">
              {pdfUrl ? (
                <iframe src={pdfUrl} className="h-full min-h-[60vh] w-full rounded-[1.5rem] border border-white/10 bg-white" title="Menu PDF preview" />
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {shareMessage ? <p className="text-xs text-muted-foreground">{shareMessage}</p> : <span />}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={sharePdf} disabled={!pdfUrl}>
                    <Share2 size={14} />
                    Share
                  </Button>
                  <Button type="button" onClick={() => (pdfUrl ? downloadAsset({ url: pdfUrl, filename }) : undefined)} disabled={!pdfUrl}>
                    <Download size={14} />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
