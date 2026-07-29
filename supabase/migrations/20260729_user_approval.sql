-- HealthWatch NG — migration: Super Admin registration approval + identity documents.
-- For databases that already ran an earlier schema.sql. Fresh projects should
-- run supabase/schema.sql instead (it already contains everything below).
-- Run in the Supabase SQL editor.

-- 1. profiles: new role + approval column (existing rows backfill as 'approved').
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('Super Admin', 'System Admin', 'Data Engineer', 'Data Scientist', 'Health Officer', 'State Coordinator'));
alter table public.profiles add column if not exists approval_status text not null default 'approved';
alter table public.profiles drop constraint if exists profiles_approval_status_check;
alter table public.profiles add constraint profiles_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

-- 2. Identity documents table (NIN PII — Super Admin read only, no anon access).
create table if not exists public.identity_documents (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  nin text not null default '',
  nin_slip_path text not null default '',
  work_id_path text not null default '',
  submitted_at timestamptz not null default now()
);
alter table public.identity_documents enable row level security;

-- 3. Signup trigger: clamp client-supplied roles, mark new signups pending,
--    mirror NIN/document paths into identity_documents.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  safe_role text;
begin
  safe_role := case
    when requested_role in ('Data Engineer', 'Data Scientist', 'Health Officer', 'State Coordinator')
      then requested_role
    else 'Health Officer'
  end;
  insert into public.profiles (id, name, email, role, state, phone, approval_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    safe_role,
    coalesce(new.raw_user_meta_data ->> 'state', ''),
    new.raw_user_meta_data ->> 'phone',
    'pending'
  );
  insert into public.identity_documents (user_id, nin, nin_slip_path, work_id_path)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nin', ''),
    coalesce(new.raw_user_meta_data ->> 'nin_slip_path', ''),
    coalesce(new.raw_user_meta_data ->> 'work_id_path', '')
  );
  return new;
end;
$$;

-- 4. Role helpers.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('System Admin', 'Super Admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Super Admin'
  );
$$;

drop policy if exists "Super admin read documents" on public.identity_documents;
create policy "Super admin read documents" on public.identity_documents
  for select to authenticated using (public.is_super_admin());

-- 5. Review RPC + column-level hardening (blocks self-approval/self-promotion).
create or replace function public.review_user(target_id uuid, decision text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin may review registrations';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: %', decision;
  end if;
  update public.profiles set approval_status = decision where id = target_id;
end;
$$;
revoke execute on function public.review_user(uuid, text) from anon;

revoke update on public.profiles from anon, authenticated;
grant update (name, phone, state, active, last_active) on public.profiles to authenticated;

-- 6. Private storage bucket for document photos (anon write-only; Super Admin read).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('identity-documents', 'identity-documents', false, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Signup docs upload" on storage.objects;
create policy "Signup docs upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'identity-documents');

drop policy if exists "Super admin read docs" on storage.objects;
create policy "Super admin read docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'identity-documents' and public.is_super_admin());

-- 7. Promote your first Super Admin (edit the email, then uncomment and run —
--    the SQL editor runs as the table owner, bypassing the grants above):
-- update public.profiles set role = 'Super Admin', approval_status = 'approved'
-- where email = 'you@example.org';
