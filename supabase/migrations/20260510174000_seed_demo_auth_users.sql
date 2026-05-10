-- Demo Auth users for Supabase Cloud.
-- Run after the schema + profile sync SQL if demo login says "Invalid login credentials".
-- Common password for all demo accounts: ambulink@2026

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH demo_users(email, first_name, last_name, phone, role) AS (
    VALUES
        ('admin@ambulink.ug',          'Flavia',  'Namugga', '+256700000001', 'admin'),
        ('driver.ssali@ambulink.ug',   'Godfrey', 'Ssali',   '+256772100001', 'driver'),
        ('patient.mukisa@ambulink.ug', 'Joshua',  'Mukisa',  '+256782200001', 'patient')
),
profiles AS (
    SELECT public.ensure_user_profile(email, first_name, last_name, phone, role) AS app_user
    FROM demo_users
),
auth_seed AS (
    SELECT
        d.*,
        (p.app_user).id AS db_user_id,
        crypt('ambulink@2026', gen_salt('bf')) AS password_hash
    FROM demo_users d
    JOIN profiles p ON (p.app_user).email = d.email
)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    password_hash,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
        'db_user_id', db_user_id,
        'first_name', first_name,
        'last_name', last_name,
        'phone', phone,
        'role', role
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
FROM auth_seed
ON CONFLICT (email) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = auth.users.raw_user_meta_data || EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email',
    u.id::text,
    NOW(),
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email IN ('admin@ambulink.ug', 'driver.ssali@ambulink.ug', 'patient.mukisa@ambulink.ug')
ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();
