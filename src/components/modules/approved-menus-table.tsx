"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";

type ApprovedMenuRow = {
  id: string;
  title: string;
  mealType: string;
  serveAt: string | null;
  inviteeCount: number | null;
  status: string;
  approvedOptionTitle: string;
  updatedAt: string;
};

type Props = {
  rows: ApprovedMenuRow[];
};

function statusVariant(status: string): "default" | "accent" | "success" | "warning" {
  if (["approved", "selected"].includes(status)) return "accent";
  if (status === "validated") return "success";
  return "default";
}

export function ApprovedMenusTable({ rows }: Props) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = useMemo(() => rows.length > 0 && selectedIds.length === rows.length, [rows.length, selectedIds.length]);

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.length === rows.length ? [] : rows.map((row) => row.id)));
  }

  async function deleteSelected() {
    if (!selectedIds.length || isDeleting) return;
    const confirmed = window.confirm(t("approval.deleteConfirm", `Delete ${selectedIds.length} approved menu${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`));
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    const res = await fetch("/api/approval/menus/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuIds: selectedIds }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? t("approval.deleteError", "Failed to delete approved menus."));
      setIsDeleting(false);
      return;
    }

    setSelectedIds([]);
    setIsDeleting(false);
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("approval.title", "Approved menus")}</p>
        <Button variant="outline" size="sm" onClick={deleteSelected} disabled={!selectedIds.length || isDeleting}>
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {t("approval.deleteSelected", "Delete selected")} ({selectedIds.length})
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            key={row.id}
            onClick={() => router.push(`/approval/menus/${row.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/approval/menus/${row.id}`);
              }
            }}
            role="button"
            tabIndex={0}
            className="w-full rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.06]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="font-serif text-2xl text-card-foreground">{row.title}</p>
                <p className="text-sm text-muted-foreground">{row.approvedOptionTitle}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.includes(row.id)}
                onChange={() => toggleRow(row.id)}
                onClick={(event) => event.stopPropagation()}
                aria-label={t("approval.selectMenu", `Select ${row.title}`)}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              <Badge variant="default">{row.mealType}</Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("common.table.service")}</p>
                <p className="mt-1 text-sm text-card-foreground">
                  {row.serveAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.serveAt)) : t("common.noDate")}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("approval.invitees", "Invitees")}</p>
                <p className="mt-1 text-sm text-card-foreground">{row.inviteeCount ?? "-"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("common.table.updated")}</p>
                <p className="mt-1 text-sm text-card-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(row.updatedAt))}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="premium-table">
          <thead>
            <tr>
              <th className="px-3 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t("approval.selectAll", "Select all menus")} /></th>
              <th className="px-3 py-2">{t("common.table.menu")}</th>
              <th className="px-3 py-2">{t("common.table.meal")}</th>
              <th className="px-3 py-2">{t("common.table.service")}</th>
              <th className="px-3 py-2">{t("approval.invitees", "Invitees")}</th>
              <th className="px-3 py-2">{t("approval.status", "Status")}</th>
              <th className="px-3 py-2">{t("common.table.updated")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                key={row.id}
                className="premium-row cursor-pointer"
                onClick={() => router.push(`/approval/menus/${row.id}`)}
              >
                <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleRow(row.id)}
                    aria-label={t("approval.selectMenu", `Select ${row.title}`)}
                  />
                </td>
                <td className="px-3 py-3">
                  <p className="font-serif text-base">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.approvedOptionTitle}</p>
                </td>
                <td className="px-3 py-3">{row.mealType}</td>
                <td className="px-3 py-3">{row.serveAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.serveAt)) : t("common.noDate")}</td>
                <td className="px-3 py-3">{row.inviteeCount ?? "-"}</td>
                <td className="px-3 py-3 capitalize"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                <td className="px-3 py-3">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(row.updatedAt))}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </Card>
  );
}
