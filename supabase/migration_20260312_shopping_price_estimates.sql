alter table public.shopping_lists
  add column if not exists estimated_total_eur numeric;

alter table public.shopping_items
  add column if not exists estimated_unit_price_eur numeric,
  add column if not exists estimated_total_price_eur numeric;
