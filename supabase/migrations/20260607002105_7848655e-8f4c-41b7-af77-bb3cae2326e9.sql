-- 1. Add units count per vehicle model
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS units integer NOT NULL DEFAULT 1;

-- 2. Create dedicated admin auth user with password Santa123
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@tapiarentcar.com';
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'admin@tapiarentcar.com', crypt('Santa123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador Tapia"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), uid,
      jsonb_build_object('sub', uid::text, 'email', 'admin@tapiarentcar.com'),
      'email', uid::text, now(), now(), now()
    );
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;