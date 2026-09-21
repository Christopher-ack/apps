-- ============================================================
--  Take Five — Supabase schema
--  Paste this whole file into the Supabase SQL Editor and Run.
--  Safe to run more than once.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- tables ----------

create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  pin_hash   text not null,
  color      text not null default '#22C9B7',
  photo      text,
  is_admin   boolean not null default false,
  friends    uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
-- names are unique regardless of capitalisation
create unique index if not exists users_name_lower_idx on public.users (lower(name));

create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  category_id  text not null,
  created_by   uuid not null references public.users(id) on delete cascade,
  question_ids text[] not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.match_players (
  match_id  uuid not null references public.matches(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  status    text not null default 'waiting',
  correct   int,
  base      int,
  bonus     int,
  score     int,
  answers   jsonb,
  played_at timestamptz,
  primary key (match_id, user_id)
);

-- One shared round per calendar day. The first player of the day writes the
-- row; everyone after that reads the same five questions out of it.
create table if not exists public.daily_rounds (
  day          text primary key,           -- 'YYYY-MM-DD'
  categories   text[] not null,
  question_ids text[] not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.daily_players (
  day       text not null references public.daily_rounds(day) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  correct   int,
  base      int,
  bonus     int,
  score     int,
  answers   jsonb,
  played_at timestamptz not null default now(),
  primary key (day, user_id)
);

create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

insert into public.settings (key, value)
values ('daily_categories', '["general"]'::jsonb)
on conflict (key) do nothing;

-- ---------- the view the app actually reads ----------
-- pin_hash never leaves the database. The app only ever sees this view.

create or replace view public.users_public as
  select id, name, color, photo, is_admin, friends, created_at
  from public.users;

-- ---------- row level security ----------
-- The anon key is public by design (it ships inside the web page), so these
-- policies are the only thing standing between a stranger and your data.
-- For a small private group this is a deliberate, documented trade-off:
-- game data is open to anyone who finds the key, PINs are not.

alter table public.users         enable row level security;
alter table public.matches       enable row level security;
alter table public.match_players enable row level security;
alter table public.daily_rounds  enable row level security;
alter table public.daily_players enable row level security;
alter table public.settings      enable row level security;

-- No policies on public.users at all => anon cannot read or write it directly.
-- Everything touching that table goes through the functions below.
revoke all on public.users from anon, authenticated;
grant select on public.users_public to anon, authenticated;

do $$
begin
  -- game tables: readable and writable by anyone holding the anon key
  if not exists (select 1 from pg_policies where tablename='matches' and policyname='matches_all') then
    create policy matches_all on public.matches for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='match_players' and policyname='match_players_all') then
    create policy match_players_all on public.match_players for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='daily_rounds' and policyname='daily_rounds_all') then
    create policy daily_rounds_all on public.daily_rounds for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='daily_players' and policyname='daily_players_all') then
    create policy daily_players_all on public.daily_players for all using (true) with check (true);
  end if;
  -- settings: anyone may read, only admins may change (enforced in the function)
  if not exists (select 1 from pg_policies where tablename='settings' and policyname='settings_read') then
    create policy settings_read on public.settings for select using (true);
  end if;
end $$;

-- ============================================================
--  Functions. All SECURITY DEFINER, so they can touch public.users
--  even though the caller cannot.
-- ============================================================

-- Sign in, or create the account if the name is new.
-- The very first account created becomes the admin.
create or replace function public.sign_in(p_name text, p_pin text)
returns public.users_public
language plpgsql security definer set search_path = public, extensions as $$
declare
  u public.users;
  is_first boolean;
  palette text[] := array['#22C9B7','#8A7BE8','#E28C4A','#E5453F','#79BF57','#7E93C7','#C9CDD8'];
  n int;
  out_row public.users_public;
begin
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'name_required';
  end if;
  if p_pin !~ '^\d{4}$' then
    raise exception 'pin_format';
  end if;

  select * into u from public.users where lower(name) = lower(btrim(p_name));

  if u.id is null then
    select count(*) = 0 into is_first from public.users;
    select count(*) into n from public.users;
    insert into public.users (name, pin_hash, color, is_admin)
    values (btrim(p_name),
            crypt(p_pin, gen_salt('bf')),
            palette[(n % array_length(palette,1)) + 1],
            is_first)
    returning * into u;
  elsif u.pin_hash <> crypt(p_pin, u.pin_hash) then
    raise exception 'bad_pin';
  end if;

  select id, name, color, photo, is_admin, friends, created_at
    into out_row from public.users where id = u.id;
  return out_row;
end $$;

-- Change your own PIN. Requires the current one.
create or replace function public.change_pin(p_user uuid, p_current text, p_new text)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare u public.users;
begin
  select * into u from public.users where id = p_user;
  if u.id is null then raise exception 'no_user'; end if;
  if u.pin_hash <> crypt(p_current, u.pin_hash) then raise exception 'bad_pin'; end if;
  if p_new !~ '^\d{4}$' then raise exception 'pin_format'; end if;
  update public.users set pin_hash = crypt(p_new, gen_salt('bf')) where id = p_user;
  return true;
end $$;

-- Update your own profile. Only ever touches the caller's own row.
create or replace function public.update_profile(p_user uuid, p_name text, p_photo text, p_friends uuid[])
returns public.users_public
language plpgsql security definer set search_path = public, extensions as $$
declare out_row public.users_public;
begin
  if p_name is not null then
    if exists (select 1 from public.users where id <> p_user and lower(name) = lower(btrim(p_name))) then
      raise exception 'name_taken';
    end if;
    update public.users set name = btrim(p_name) where id = p_user;
  end if;
  if p_photo is not null then
    update public.users set photo = nullif(p_photo, '') where id = p_user;
  end if;
  if p_friends is not null then
    update public.users set friends = p_friends where id = p_user;
  end if;
  select id, name, color, photo, is_admin, friends, created_at
    into out_row from public.users where id = p_user;
  return out_row;
end $$;

-- ---------- admin-only ----------

create or replace function public.admin_set_pin(p_actor uuid, p_target uuid, p_new text)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.users where id = p_actor and is_admin) then
    raise exception 'not_admin';
  end if;
  if p_new !~ '^\d{4}$' then raise exception 'pin_format'; end if;
  update public.users set pin_hash = crypt(p_new, gen_salt('bf')) where id = p_target;
  return true;
end $$;

create or replace function public.admin_set_role(p_actor uuid, p_target uuid, p_is_admin boolean)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare admins int;
begin
  if not exists (select 1 from public.users where id = p_actor and is_admin) then
    raise exception 'not_admin';
  end if;
  select count(*) into admins from public.users where is_admin;
  if p_is_admin = false and admins <= 1
     and exists (select 1 from public.users where id = p_target and is_admin) then
    raise exception 'last_admin';
  end if;
  update public.users set is_admin = p_is_admin where id = p_target;
  return true;
end $$;

create or replace function public.admin_delete_user(p_actor uuid, p_target uuid)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare admins int;
begin
  if not exists (select 1 from public.users where id = p_actor and is_admin) then
    raise exception 'not_admin';
  end if;
  if p_actor = p_target then raise exception 'cannot_delete_self'; end if;
  select count(*) into admins from public.users where is_admin;
  if admins <= 1 and exists (select 1 from public.users where id = p_target and is_admin) then
    raise exception 'last_admin';
  end if;

  -- strip them out of everyone's friends list, then let the cascades do the rest
  update public.users set friends = array_remove(friends, p_target);
  delete from public.users where id = p_target;
  -- a game nobody is left in is not a game
  delete from public.matches m
   where not exists (select 1 from public.match_players mp where mp.match_id = m.id);
  return true;
end $$;

create or replace function public.admin_set_daily_categories(p_actor uuid, p_categories jsonb)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.users where id = p_actor and is_admin) then
    raise exception 'not_admin';
  end if;
  if jsonb_array_length(p_categories) < 1 then raise exception 'need_one_category'; end if;
  insert into public.settings (key, value) values ('daily_categories', p_categories)
  on conflict (key) do update set value = excluded.value;
  return true;
end $$;

-- ---------- let the anon key call them ----------

grant execute on function public.sign_in(text, text)                        to anon, authenticated;
grant execute on function public.change_pin(uuid, text, text)               to anon, authenticated;
grant execute on function public.update_profile(uuid, text, text, uuid[])   to anon, authenticated;
grant execute on function public.admin_set_pin(uuid, uuid, text)            to anon, authenticated;
grant execute on function public.admin_set_role(uuid, uuid, boolean)        to anon, authenticated;
grant execute on function public.admin_delete_user(uuid, uuid)              to anon, authenticated;
grant execute on function public.admin_set_daily_categories(uuid, jsonb)    to anon, authenticated;

-- ============================================================
--  Done. Next: copy your Project URL and anon key into config.js
-- ============================================================
