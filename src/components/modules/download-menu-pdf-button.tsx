"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

export function DownloadMenuPdfButton({ menuId }: { menuId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filename = useMemo(() => `menu-${menuId}.pdf`, [menuId]);

  async function openPreview() {
    setLoading(true);
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
    const blob = await fetch(pdfUrl).then((res) => res.blob());
    const file = new File([blob], filename, { type: "application/pdf" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: t("approval.pdf.shareTitle", "Michelin Menu PDF") });
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={openPreview}
        disabled={loading}
        aria-label={loading ? t("approval.pdf.preparing", "Preparing PDF...") : t("approval.pdf.downloadMenu", "Download PDF Menu")}
        title={loading ? t("approval.pdf.preparing", "Preparing PDF...") : t("approval.pdf.downloadMenu", "Download PDF Menu")}
      >
        <Download size={16} />
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed inset-x-4 top-8 z-50 mx-auto max-w-5xl rounded-2xl border border-border bg-background p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <Dialog.Title className="font-serif text-xl">{t("approval.pdf.previewTitle", "Michelin-style Menu Preview")}</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" aria-label={t("common.close", "Close")}><X size={16} /></button>
              </Dialog.Close>
            </div>
            {pdfUrl ? <iframe src={pdfUrl} className="h-[70vh] w-full rounded-xl border" title={t("approval.pdf.previewFrameTitle", "Menu PDF preview")} /> : null}
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={sharePdf} disabled={!pdfUrl}><Share2 size={14} />{t("common.share", "Share")}</Button>
              <Button
                type="button"
                variant="outline"
                disabled={!pdfUrl}
                onClick={() => {
                  if (!pdfUrl) return;
                  const link = document.createElement("a");
                  link.href = pdfUrl;
                  link.download = filename;
                  link.click();
                }}
              >
                <Download size={14} />{t("common.download", "Download")}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
