alter table if exists public.cook_steps
  add column if not exists technique text,
  add column if not exists knife_cut text,
  add column if not exists utensils text[];
