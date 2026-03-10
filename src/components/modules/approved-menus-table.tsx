"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    const confirmed = window.confirm(`Delete ${selectedIds.length} approved menu${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`);
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
      setError(payload?.error ?? "Failed to delete approved menus.");
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
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Approved menus</p>
        <Button variant="outline" size="sm" onClick={deleteSelected} disabled={!selectedIds.length || isDeleting}>
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete selected ({selectedIds.length})
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-3 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all menus" /></th>
              <th className="px-3 py-2">Menu</th>
              <th className="px-3 py-2">Meal</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Invitees</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                key={row.id}
                className="cursor-pointer rounded-2xl border border-border/60 bg-card/65 transition hover:border-primary/40 hover:bg-card/85"
                onClick={() => router.push(`/approval/menus/${row.id}`)}
              >
                <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleRow(row.id)}
                    aria-label={`Select ${row.title}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.approvedOptionTitle}</p>
                </td>
                <td className="px-3 py-3">{row.mealType}</td>
                <td className="px-3 py-3">{row.serveAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.serveAt)) : "No date"}</td>
                <td className="px-3 py-3">{row.inviteeCount ?? "-"}</td>
                <td className="px-3 py-3 capitalize"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                <td className="px-3 py-3">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(row.updatedAt))}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </Card>
  );
}
