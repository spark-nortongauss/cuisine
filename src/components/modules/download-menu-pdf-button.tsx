"use client";

import { useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/components/i18n/i18n-provider";
import { downloadAsset, shareAsset } from "@/lib/browser-media";

export function DownloadMenuPdfButton({ menuId, showLabel = false }: { menuId: string; showLabel?: boolean }) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [previewNonce, setPreviewNonce] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const filename = useMemo(() => `menu-${menuId}.pdf`, [menuId]);
  const basePdfUrl = useMemo(() => `/api/menus/${menuId}/pdf?locale=${encodeURIComponent(locale)}`, [locale, menuId]);
  const previewUrl = previewNonce ? `${basePdfUrl}&ts=${previewNonce}` : basePdfUrl;
  const downloadUrl = previewNonce ? `${basePdfUrl}&download=1&ts=${previewNonce}` : `${basePdfUrl}&download=1`;

  async function openPreview() {
    setShareMessage(null);
    setPreviewLoading(true);
    setPreviewNonce(Date.now());
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPreviewLoading(false);
    }
  }

  async function sharePdf() {
    const absolutePreviewUrl = new URL(previewUrl, window.location.origin).toString();
    const result = await shareAsset({ url: absolutePreviewUrl, title: t("pdf.previewTitle", "Michelin menu PDF"), filename });
    if (result === "copied") setShareMessage(t("pdf.linkCopied", "PDF link copied to clipboard."));
    if (result === "unsupported") setShareMessage(t("pdf.shareUnsupported", "Sharing is not available on this device."));
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={showLabel ? "sm" : "icon"}
        className={showLabel ? "w-full sm:w-auto" : undefined}
        onClick={openPreview}
        aria-label={t("pdf.downloadAction", "Download PDF menu")}
        title={t("pdf.downloadAction", "Download PDF menu")}
      >
        <Download size={16} />
        {showLabel ? <span>{t("pdf.buttonLabel", "PDF Brief")}</span> : null}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="h-[min(92vh,56rem)] w-[min(98vw,72rem)] max-w-none overflow-hidden p-0" hideClose>
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b border-white/10 px-5 pb-4 pt-5 md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <DialogTitle>{t("pdf.previewTitle", "Michelin menu PDF")}</DialogTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{t("pdf.previewDescription", "Preview the exported PDF, then download or share it from the same surface.")}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => handleOpenChange(false)} aria-label={t("pdf.closePreview", "Close PDF preview")}>
                  <X size={15} />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-4 md:px-6">
              <div className="relative flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white">
                {previewLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 text-sm text-slate-700">
                    {t("pdf.previewLoading", "Loading PDF preview...")}
                  </div>
                ) : null}
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  className="h-full min-h-[60vh] w-full"
                  title={t("pdf.previewFrame", "Menu PDF preview")}
                  onLoad={() => setPreviewLoading(false)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-h-5 text-xs text-muted-foreground">{shareMessage ?? ""}</div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}>
                    {t("pdf.openInNewTab", "Open in a new tab")}
                  </Button>
                  <Button type="button" variant="outline" onClick={sharePdf}>
                    <Share2 size={14} />
                    {t("pdf.share", "Share")}
                  </Button>
                  <Button type="button" onClick={() => downloadAsset({ url: downloadUrl, filename })}>
                    <Download size={14} />
                    {t("pdf.download", "Download")}
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
