-- Core schema for Gastronomic Cuisine

create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  chef_user_id uuid,
  meal_type text,
  course_count smallint,
  restrictions jsonb not null default '[]'::jsonb,
  notes text,
  invitee_count integer,
  serve_at timestamptz,
  selected_option_id uuid,
  status text not null default 'draft' check (status in ('draft', 'validated'))
);

create table if not exists menu_options (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  title text not null,
  concept text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists menu_dishes (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  menu_option_id uuid not null references menu_options(id) on delete cascade,
  course text not null,
  name text not null,
  description text not null,
  plating_notes text not null,
  beverage_suggestion text,
  image_prompt text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists menu_invites (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
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

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  chef_user_id uuid,
  meal_type text,
  menu_title text not null,
  serve_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'purchased')),
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(menu_id)
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  shopping_list_id uuid references shopping_lists(id) on delete cascade,
  section text,
  item_name text,
  quantity numeric,
  unit text,
  notes text,
  purchased boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists cook_plans (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  chef_user_id uuid,
  shopping_list_id uuid references shopping_lists(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(menu_id)
);

create table if not exists cook_timelines (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  timeline jsonb not null,
  created_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  token uuid not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

-- RLS starter policy
alter table menus enable row level security;
drop policy if exists "chef owns records" on menus;
create policy "chef owns records" on menus for all using (auth.uid() is not null);
