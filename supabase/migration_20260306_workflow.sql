-- Workflow migration: move from menu_generations to menus/menu_options/menu_dishes

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

alter table if exists shopping_lists
  add column if not exists menu_id uuid references menus(id) on delete cascade;

alter table if exists cook_plans
  add column if not exists menu_id uuid references menus(id) on delete cascade;

alter table if exists shopping_lists
  drop constraint if exists shopping_lists_menu_generation_id_key;

create unique index if not exists shopping_lists_menu_id_key on shopping_lists(menu_id);
create unique index if not exists cook_plans_menu_id_key on cook_plans(menu_id);
