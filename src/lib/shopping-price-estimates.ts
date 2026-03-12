import { estimateShoppingPricesForFrance } from "@/lib/ai/openai";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function roundCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

export async function ensureShoppingPriceEstimates(shoppingListId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: shoppingList } = await supabase
    .from("shopping_lists")
    .select("id, estimated_total_eur")
    .eq("id", shoppingListId)
    .maybeSingle();

  if (!shoppingList) return;

  const { data: items } = await supabase
    .from("shopping_items")
    .select("id, item_name, quantity, unit, section, estimated_unit_price_eur, estimated_total_price_eur")
    .eq("shopping_list_id", shoppingListId)
    .order("sort_order", { ascending: true });

  const rows = items ?? [];
  if (!rows.length) {
    await supabase.from("shopping_lists").update({ estimated_total_eur: null }).eq("id", shoppingListId);
    return;
  }

  const hasMissing = shoppingList.estimated_total_eur === null || rows.some((item) => item.estimated_unit_price_eur === null || item.estimated_total_price_eur === null);
  if (!hasMissing) return;

  const estimate = await estimateShoppingPricesForFrance(
    rows.map((item) => ({
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      section: item.section,
    })),
  );

  for (const entry of estimate.items) {
    const row = rows[entry.index];
    if (!row) continue;
    await supabase
      .from("shopping_items")
      .update({
        estimated_unit_price_eur: roundCurrency(entry.estimated_unit_price_eur),
        estimated_total_price_eur: roundCurrency(entry.estimated_total_price_eur),
      })
      .eq("id", row.id);
  }

  const estimatedTotal = roundCurrency(estimate.estimated_shopping_total_eur)
    ?? roundCurrency(estimate.items.reduce((acc, item) => acc + (item.estimated_total_price_eur ?? 0), 0));
  await supabase.from("shopping_lists").update({ estimated_total_eur: estimatedTotal }).eq("id", shoppingListId);
}
