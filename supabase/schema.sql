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
