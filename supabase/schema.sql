-- Core schema for Gastronomic Cuisine
create table if not exists menu_generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  request jsonb not null,
  response jsonb not null
);

create table if not exists menu_invites (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null,
  token uuid unique not null,
  first_name text not null,
  mobile text not null,
  created_at timestamptz default now()
);

create table if not exists menu_votes (
  id uuid primary key default gen_random_uuid(),
  token uuid not null,
  option_id uuid not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null,
  section text,
  item_name text,
  quantity numeric,
  unit text,
  notes text,
  purchased boolean default false
);

create table if not exists cook_timelines (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null,
  timeline jsonb not null,
  created_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  token uuid not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

-- Example RLS starter
alter table menu_generations enable row level security;
create policy "chef owns records" on menu_generations for all using (auth.uid() is not null);

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
