alter table if exists menu_generations
  add column if not exists chef_user_id uuid,
  add column if not exists selected_option jsonb,
  add column if not exists selected_option_id text,
  add column if not exists status text not null default 'draft';

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  menu_generation_id uuid not null references menu_generations(id) on delete cascade,
  chef_user_id uuid,
  meal_type text,
  menu_title text not null,
  serve_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'purchased')),
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(menu_generation_id)
);

alter table if exists shopping_items
  add column if not exists shopping_list_id uuid references shopping_lists(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now();

create index if not exists shopping_lists_chef_idx on shopping_lists(chef_user_id, serve_at desc);
create index if not exists shopping_items_list_idx on shopping_items(shopping_list_id);

create table if not exists cook_plans (
  id uuid primary key default gen_random_uuid(),
  menu_generation_id uuid not null references menu_generations(id) on delete cascade,
  chef_user_id uuid,
  shopping_list_id uuid references shopping_lists(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(menu_generation_id)
);

create index if not exists cook_plans_chef_idx on cook_plans(chef_user_id, created_at desc);

create or replace function set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_shopping_lists_updated_at on shopping_lists;
create trigger set_shopping_lists_updated_at
before update on shopping_lists
for each row execute function set_updated_at_timestamp();

drop trigger if exists set_cook_plans_updated_at on cook_plans;
create trigger set_cook_plans_updated_at
before update on cook_plans
for each row execute function set_updated_at_timestamp();
