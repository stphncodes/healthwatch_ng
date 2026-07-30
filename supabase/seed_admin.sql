-- HealthWatch NG — seed the single Admin account
--
-- The platform has exactly ONE administrator, created here and never through
-- any UI. Edit the three values at the top of the DO block, then run this
-- once in the Supabase SQL editor.
--
-- Run order: supabase/schema.sql (or the latest migration) FIRST — this
-- script relies on the on_auth_user_created trigger existing so the profile
-- row is created automatically. Re-running is safe: if the auth user already
-- exists its password is rotated to admin_password and the profile is
-- re-confirmed as the approved Admin.
--
-- Why plain SQL works here: pgcrypto (crypt/gen_salt) is preinstalled on
-- Supabase, and the SQL editor runs as the table owner, bypassing both RLS
-- and the column grants that stop the app from writing role/approval_status.

do $$
declare
  admin_email    text := 'admin@example.org';   -- ← CHANGE: the admin's email
  admin_password text := 'change-me-now';       -- ← CHANGE: a strong password
  admin_name     text := 'NCDC Platform Admin'; -- ← optional display name
  uid uuid;
begin
  select id into uid from auth.users where email = admin_email;

  if uid is null then
    uid := gen_random_uuid();
    -- GoTrue quirks this insert must respect:
    --  * instance_id is the fixed zero UUID;
    --  * the *_token columns must be EMPTY STRINGS, not NULL (GoTrue scans
    --    them as Go strings and crashes on NULL);
    --  * email_confirmed_at must be set or password login is rejected while
    --    email confirmations are enabled.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid, 'authenticated', 'authenticated',
      admin_email, crypt(admin_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', admin_name),
      now(), now(),
      '', '', '', ''
    );
    -- Without a matching identities row (provider_id = user id for the email
    -- provider) email+password sign-in silently fails.
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', admin_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  else
    -- Re-run: rotate the password for the existing account.
    update auth.users
    set encrypted_password = crypt(admin_password, gen_salt('bf'))
    where id = uid;
  end if;

  -- The on_auth_user_created trigger inserted a pending Member profile (on
  -- first run) — promote it to the approved Admin.
  update public.profiles
  set role = 'Admin', approval_status = 'approved', name = admin_name
  where id = uid;
end $$;
