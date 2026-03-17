type ShoppingEstimateLike = {
  estimated_total_price_eur?: number | null;
  estimated_unit_price_eur?: number | null;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function resolveDisplayedShoppingItemEstimate(item: ShoppingEstimateLike) {
  if (typeof item.estimated_total_price_eur === "number" && Number.isFinite(item.estimated_total_price_eur)) {
    return roundCurrency(item.estimated_total_price_eur);
  }

  if (typeof item.estimated_unit_price_eur === "number" && Number.isFinite(item.estimated_unit_price_eur)) {
    return roundCurrency(item.estimated_unit_price_eur);
  }

  return null;
}

export function sumDisplayedShoppingEstimate(items: ShoppingEstimateLike[]) {
  const sum = items.reduce((total, item) => total + (resolveDisplayedShoppingItemEstimate(item) ?? 0), 0);
  return sum > 0 ? roundCurrency(sum) : null;
}
