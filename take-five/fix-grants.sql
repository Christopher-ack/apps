-- ============================================================
--  Take Five — grant fix
--
--  Run this if the app says "permission denied for table ..."
--  Paste the whole file into the Supabase SQL Editor and Run.
--  Safe to run more than once, and safe to run on top of schema.sql.
--
--  Why: older Supabase projects auto-granted table access to the anon
--  role. Newer ones don't, so the grants have to be explicit. Row Level
--  Security still applies on top of these — a grant only says "this role
--  may attempt the query", the policies still decide what it sees.
-- ============================================================

grant usage on schema public to anon, authenticated;

-- Game tables: read and write. RLS policies (from schema.sql) allow all rows.
grant select, insert, update, delete on public.matches       to anon, authenticated;
grant select, insert, update, delete on public.match_players to anon, authenticated;
grant select, insert, update, delete on public.daily_rounds  to anon, authenticated;
grant select, insert, update, delete on public.daily_players to anon, authenticated;

-- Settings: readable by everyone, written only through admin_set_daily_categories.
grant select on public.settings to anon, authenticated;

-- The view the app reads instead of public.users. The users table itself stays
-- unreachable, which is what keeps the PIN hashes out of reach.
grant select on public.users_public to anon, authenticated;

revoke all on public.users from anon, authenticated;

-- Functions (harmless to repeat — schema.sql grants these too).
grant execute on function public.sign_in(text, text)                      to anon, authenticated;
grant execute on function public.change_pin(uuid, text, text)             to anon, authenticated;
grant execute on function public.update_profile(uuid, text, text, uuid[]) to anon, authenticated;
grant execute on function public.admin_set_pin(uuid, uuid, text)          to anon, authenticated;
grant execute on function public.admin_set_role(uuid, uuid, boolean)      to anon, authenticated;
grant execute on function public.admin_delete_user(uuid, uuid)            to anon, authenticated;
grant execute on function public.admin_set_daily_categories(uuid, jsonb)  to anon, authenticated;

-- Anything added later in this schema gets the same treatment automatically.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- ============================================================
--  Check it worked: this should return one row per table below,
--  each listing the anon role.
-- ============================================================
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in ('matches','match_players','daily_rounds','daily_players','settings','users_public')
group by table_name, grantee
order by table_name;
