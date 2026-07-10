-- HealthWatch NG — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) to create every
-- table the app's data layer (src/lib/data.ts) reads from. Column names are
-- snake_case; the app maps them onto the camelCase domain types in
-- src/types/health.ts.

-- ---------------------------------------------------------------------------
-- Profiles — one row per auth user, populated automatically at signup from
-- the metadata the signup form sends (name, role, state, phone).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'Health Officer'
    check (role in ('System Admin', 'Data Engineer', 'Data Scientist', 'Health Officer', 'State Coordinator')),
  state text not null default '',
  phone text,
  active boolean not null default true,
  last_active timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, state, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'Health Officer'),
    coalesce(new.raw_user_meta_data ->> 'state', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Surveillance datasets
-- ---------------------------------------------------------------------------
create table if not exists public.state_risks (
  id text primary key,                -- state code, e.g. 'LA'
  name text not null,
  code text not null,
  risk text not null check (risk in ('Low', 'Medium', 'High', 'Critical')),
  active_cases integer not null default 0,
  dominant_disease text not null
);

create table if not exists public.outbreak_alerts (
  id text primary key,                -- e.g. 'AL-2026-0142'
  disease text not null,
  lga text not null,
  state text not null,
  risk text not null check (risk in ('Low', 'Medium', 'High', 'Critical')),
  case_count integer not null default 0,
  triggered_at timestamptz not null default now(),
  status text not null default 'Active'
    check (status in ('Active', 'Investigating', 'Acknowledged', 'Resolved')),
  description text not null default '',
  reported_by text not null default '',
  contacts_traced integer not null default 0,
  fatalities integer not null default 0,
  detection_time_hrs numeric not null default 0
);

create table if not exists public.weekly_case_trends (
  week text primary key,              -- e.g. 'W23'
  lassa_fever integer not null default 0,
  cholera integer not null default 0,
  meningitis integer not null default 0
);

create table if not exists public.data_sources (
  id text primary key,                -- e.g. 'DS-IDSR'
  name text not null,
  description text not null default '',
  status text not null default 'Connected'
    check (status in ('Connected', 'Degraded', 'Offline')),
  last_sync timestamptz not null default now(),
  record_count integer not null default 0
);

create table if not exists public.audit_log (
  id text primary key,                -- e.g. 'EV-10241'
  user_name text not null,
  action text not null,
  resource text not null,
  timestamp timestamptz not null default now(),
  category text not null
    check (category in ('Auth', 'Data', 'Config', 'Export', 'Alert'))
);

create table if not exists public.forecast_points (
  week text primary key,              -- e.g. 'W27'
  actual integer,                     -- null for future weeks
  predicted integer not null,
  lower integer not null,
  upper integer not null
);

create table if not exists public.high_risk_lgas (
  id text primary key,
  lga text not null,
  state text not null,
  disease text not null,
  predicted_cases integer not null default 0,
  trend text not null default 'up' check (trend in ('up', 'down')),
  change_pct numeric not null default 0
);

create table if not exists public.epi_reports (
  epi_week text primary key,          -- e.g. 'Epi Week 26'
  period_label text not null,
  total_cases_reported integer not null default 0,
  new_outbreaks integer not null default 0,
  under_investigation integer not null default 0,
  states_reporting integer not null default 0,
  recovery_rate numeric not null default 0,
  case_fatality_rate numeric not null default 0
);

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- Reads are granted to the anon role because the app's server components
-- fetch with the anon key (the browser auth session is not forwarded to the
-- server). Writes are left to service-role pipelines (ingest jobs, admin
-- tooling). To restrict reads to signed-in users, migrate the app to
-- @supabase/ssr cookie sessions and change `to anon, authenticated` below to
-- `to authenticated`.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.state_risks enable row level security;
alter table public.outbreak_alerts enable row level security;
alter table public.weekly_case_trends enable row level security;
alter table public.data_sources enable row level security;
alter table public.audit_log enable row level security;
alter table public.forecast_points enable row level security;
alter table public.high_risk_lgas enable row level security;
alter table public.epi_reports enable row level security;

create policy "App read" on public.profiles for select to anon, authenticated using (true);
create policy "App read" on public.state_risks for select to anon, authenticated using (true);
create policy "App read" on public.outbreak_alerts for select to anon, authenticated using (true);
create policy "App read" on public.weekly_case_trends for select to anon, authenticated using (true);
create policy "App read" on public.data_sources for select to anon, authenticated using (true);
create policy "App read" on public.audit_log for select to anon, authenticated using (true);
create policy "App read" on public.forecast_points for select to anon, authenticated using (true);
create policy "App read" on public.high_risk_lgas for select to anon, authenticated using (true);
create policy "App read" on public.epi_reports for select to anon, authenticated using (true);

-- Users may update their own profile (e.g. name or phone changes).
create policy "Own profile update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- In-app write policies.
-- The web app performs two writes from the browser (through the anon client,
-- carrying the signed-in user's JWT — so `to authenticated` applies):
--   1. Officers acknowledging an outbreak alert.
--   2. System Admins toggling a user's active state from the admin panel.
-- The ingest pipeline writes with the service-role key, which bypasses RLS
-- entirely, so these policies only govern in-app mutations.
-- ---------------------------------------------------------------------------

-- Any signed-in officer may update an alert (used to acknowledge it).
drop policy if exists "Auth update alerts" on public.outbreak_alerts;
create policy "Auth update alerts" on public.outbreak_alerts
  for update to authenticated using (true) with check (true);

-- is_admin(): true when the caller's profile role is 'System Admin'. Declared
-- security definer so the lookup runs with the function owner's rights and does
-- NOT re-trigger the profiles RLS policy below (which would recurse).
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'System Admin'
  );
$$;

-- System Admins may update any profile (used for the active/inactive toggle).
drop policy if exists "Admin manage profiles" on public.profiles;
create policy "Admin manage profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
