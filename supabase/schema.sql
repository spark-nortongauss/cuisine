-- Actual Supabase schema for Gastronomic Cuisine

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text,
  meal_type text not null,
  course_count integer not null,
  restrictions text[] not null default '{}',
  notes text,
  invitee_count integer,
  invitee_preferences jsonb,
  serve_at timestamptz,
  status text not null default 'draft',
  approved_option_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  chef_user_id uuid
);

create table if not exists public.menu_options (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  option_no integer not null default 0 check (option_no >= 1 and option_no <= 3),
  michelin_name text not null,
  concept_summary text,
  beverage_pairing text,
  hero_image_path text,
  hero_image_prompt text,
  created_at timestamptz not null default now(),
  concept text,
  sort_order integer default 0,
  chef_notes text,
  title text
);

create table if not exists public.menu_dishes (
  id uuid primary key default gen_random_uuid(),
  menu_option_id uuid not null references public.menu_options(id) on delete cascade,
  course_no integer not null,
  course_label text,
  dish_name text not null,
  description text not null,
  plating_notes text,
  decoration_notes text,
  image_prompt text,
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_invites (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  invitee_first_name text not null,
  invitee_phone text not null,
  channel text not null default 'sms',
  token_hash text not null unique,
  status text not null default 'pending',
  selected_option_id uuid,
  invitee_note text,
  sent_at timestamptz,
  opened_at timestamptz,
  voted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null unique references public.menus(id) on delete cascade,
  generated_by text not null default 'ai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  section text not null,
  item_name text not null,
  quantity numeric,
  unit text,
  note text,
  purchased boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cook_plans (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null unique references public.menus(id) on delete cascade,
  overview text,
  mise_en_place text,
  plating_overview text,
  service_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cook_steps (
  id uuid primary key default gen_random_uuid(),
  cook_plan_id uuid not null references public.cook_plans(id) on delete cascade,
  step_no integer not null,
  phase text not null,
  title text not null,
  details text not null,
  dish_name text,
  relative_minutes integer,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  invitee_first_name text not null,
  invitee_phone text not null,
  token_hash text not null unique,
  status text not null default 'pending',
  sent_at timestamptz,
  opened_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.dish_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_request_id uuid not null references public.feedback_requests(id) on delete cascade,
  menu_dish_id uuid not null references public.menu_dishes(id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_feedback_summary (
  menu_id uuid primary key references public.menus(id) on delete cascade,
  overall_score numeric not null default 0,
  response_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_favorites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  menu_id uuid not null unique references public.menus(id) on delete cascade,
  rating_percent numeric not null,
  served_on date,
  people_count integer,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
