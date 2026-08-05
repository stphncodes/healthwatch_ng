-- Migration: single-admin model + one-photo identity documents + admin content editing
-- For databases created before 2026-07-30. Fresh installs get all of this from
-- supabase/schema.sql — do not run both.
--
-- What this does, in order (the order matters):
--   1. Remaps the old six-role model onto Admin/Member and tightens the CHECK.
--   2. Reshapes identity_documents to a single government-ID photo.
--   3. Recreates handle_new_user() — always Member, single document.
--   4. Recreates is_admin() for the new role and re-points every policy that
--      referenced is_super_admin() BEFORE dropping that function (policy
--      expressions hold dependencies that would block the drop).
--   5. Recreates review_user() gated on is_admin().
--   6. Replaces the blanket "Auth update alerts" policy with the
--      acknowledge_alert() RPC + Admin-only content-editing policies.
--
-- Run it in the Supabase SQL editor, then run supabase/seed_admin.sql to
-- create (or confirm) the single Admin account.

-- ---------------------------------------------------------------------------
-- 1. Role remap — BEFORE the new CHECK constraint.
-- NOTE: every row that held either old admin tier becomes 'Admin'. The model
-- is ONE admin: if this leaves more than one Admin row, demote the extras by
-- hand (update public.profiles set role = 'Member' where id = '...').
-- ---------------------------------------------------------------------------
update public.profiles set role = 'Admin'
  where role in ('Super Admin', 'System Admin');
update public.profiles set role = 'Member'
  where role <> 'Admin';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('Admin', 'Member'));
alter table public.profiles alter column role set default 'Member';

-- ---------------------------------------------------------------------------
-- 2. identity_documents: nin_slip_path → id_photo_path, drop work_id_path.
-- Guarded so re-running the migration is harmless. Orphaned work-id.jpg
-- objects remain in the storage bucket (harmless; delete manually if wanted).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'identity_documents'
      and column_name = 'nin_slip_path'
  ) then
    alter table public.identity_documents rename column nin_slip_path to id_photo_path;
  end if;
end $$;
alter table public.identity_documents drop column if exists work_id_path;

-- ---------------------------------------------------------------------------
-- 3. Signup trigger: every self-registered account is a pending Member.
-- The nin_slip_path fallback covers old clients still in flight during deploy.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, state, phone, approval_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    'Member',
    coalesce(new.raw_user_meta_data ->> 'state', ''),
    new.raw_user_meta_data ->> 'phone',
    'pending'
  );
  insert into public.identity_documents (user_id, nin, id_photo_path)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nin', ''),
    coalesce(
      new.raw_user_meta_data ->> 'id_photo_path',
      new.raw_user_meta_data ->> 'nin_slip_path',
      ''
    )
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Role helpers: is_admin() targets the single Admin role. Policies that
-- referenced is_super_admin() are re-pointed BEFORE the function is dropped.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  );
$$;

drop policy if exists "Super admin read documents" on public.identity_documents;
drop policy if exists "Admin read documents" on public.identity_documents;
create policy "Admin read documents" on public.identity_documents
  for select to authenticated using (public.is_admin());

drop policy if exists "Super admin read docs" on storage.objects;
drop policy if exists "Admin read docs" on storage.objects;
create policy "Admin read docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'identity-documents' and public.is_admin());

drop function if exists public.is_super_admin();

-- ---------------------------------------------------------------------------
-- 5. Registration review: gated on is_admin().
-- ---------------------------------------------------------------------------
create or replace function public.review_user(target_id uuid, decision text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator may review registrations';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: %', decision;
  end if;
  update public.profiles set approval_status = decision where id = target_id;
end;
$$;
revoke execute on function public.review_user(uuid, text) from anon;

-- ---------------------------------------------------------------------------
-- 6. Alerts tightening + Admin content editing.
-- Direct alert writes become Admin-only; officers acknowledge through the
-- status-only RPC (src/lib/mutations.ts calls it).
-- ---------------------------------------------------------------------------
drop policy if exists "Auth update alerts" on public.outbreak_alerts;

create or replace function public.acknowledge_alert(alert_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to acknowledge an alert';
  end if;
  update public.outbreak_alerts set status = 'Acknowledged' where id = alert_id;
end;
$$;
revoke execute on function public.acknowledge_alert(text) from anon;

drop policy if exists "Admin manage alerts" on public.outbreak_alerts;
create policy "Admin manage alerts" on public.outbreak_alerts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage state risks" on public.state_risks;
create policy "Admin manage state risks" on public.state_risks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage data sources" on public.data_sources;
create policy "Admin manage data sources" on public.data_sources
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
