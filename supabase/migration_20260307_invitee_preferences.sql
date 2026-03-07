alter table public.menus
  add column if not exists invitee_preferences jsonb;
