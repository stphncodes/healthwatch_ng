-- HealthWatch NG — provision an administrator (run in the Supabase SQL editor).
-- Admin accounts are NEVER created through the app UI. The only path is:
--   1. The person registers normally on /signup (account lands as 'pending').
--   2. Edit the email below and run this script. It approves the account and
--      grants the role; the SQL editor runs as the table owner, bypassing the
--      column grants that block role changes from the app.
--   3. They sign in at /admin (the standalone Admin Console).
--
-- Use role 'Super Admin' for the registration approver; 'System Admin' for
-- admins who manage users/sources/audit but cannot approve registrations.

update public.profiles
set role = 'Super Admin',
    approval_status = 'approved'
where email = 'you@example.org';   -- ← change me

-- Verify:
-- select email, role, approval_status from public.profiles order by role;
