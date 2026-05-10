-- Repair demo patient role if it was created as admin by the old @ambulink.ug fallback.

UPDATE public.users
SET role = 'patient'::public.user_role,
    updated_at = NOW()
WHERE email = 'patient.mukisa@ambulink.ug'
  AND role <> 'patient'::public.user_role;

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'patient')
WHERE email = 'patient.mukisa@ambulink.ug';
