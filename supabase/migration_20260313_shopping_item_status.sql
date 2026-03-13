alter table public.shopping_items
  add column if not exists status text not null default 'not_purchased';

update public.shopping_items
set status = case
  when purchased = true then 'purchased'
  else 'not_purchased'
end
where status is null
   or status not in ('purchased', 'already_have', 'not_purchased');

alter table public.shopping_items
  drop constraint if exists shopping_items_status_check;

alter table public.shopping_items
  add constraint shopping_items_status_check
  check (status in ('purchased', 'already_have', 'not_purchased'));

update public.shopping_items
set purchased = case
  when status in ('purchased', 'already_have') then true
  else false
end;
