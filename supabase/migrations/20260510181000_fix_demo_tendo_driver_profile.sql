-- Repair Ivan Tendo's public app profile in Supabase Cloud.
-- IMPORTANT:
-- 1. First create/reset the Auth user in Supabase Dashboard:
--    Authentication > Users > Add user
--    Email: driver.tendo@ambulink.ug
--    Password: ambulink@2026
--    Auto Confirm User: ON
--    User metadata:
--    {"first_name":"Ivan","last_name":"Tendo","phone":"+256782200002","role":"driver"}
-- 2. Then run this SQL in the SQL Editor.

SELECT public.ensure_user_profile(
    'driver.tendo@ambulink.ug',
    'Ivan',
    'Tendo',
    '+256782200002',
    'driver'
);

UPDATE public.users
SET
    first_name = 'Ivan',
    last_name = 'Tendo',
    phone = CASE
        WHEN phone IS NOT NULL THEN phone
        WHEN NOT EXISTS (
            SELECT 1
            FROM public.users other_user
            WHERE other_user.phone = '+256782200002'
              AND other_user.email <> 'driver.tendo@ambulink.ug'
        ) THEN '+256782200002'
        ELSE '+256782299002'
    END,
    role = 'driver'::public.user_role,
    updated_at = NOW()
WHERE email = 'driver.tendo@ambulink.ug';

INSERT INTO public.drivers (
    user_id,
    license_number,
    vehicle_plate,
    vehicle_type,
    vehicle_model,
    vehicle_color,
    coverage_zone,
    status,
    is_online,
    total_trips,
    average_rating,
    verified_at
)
SELECT
    u.id,
    'DL-DEMO-TENDO-002',
    'DEM 002T',
    'basic'::public.vehicle_type,
    'Nissan Caravan',
    'White/Yellow',
    'Kampala Central, Makindye',
    'active'::public.driver_status,
    TRUE,
    51,
    4.45,
    NOW()
FROM public.users u
WHERE u.email = 'driver.tendo@ambulink.ug'
ON CONFLICT (user_id) DO UPDATE SET
    license_number = EXCLUDED.license_number,
    vehicle_plate = EXCLUDED.vehicle_plate,
    vehicle_type = EXCLUDED.vehicle_type,
    vehicle_model = EXCLUDED.vehicle_model,
    vehicle_color = EXCLUDED.vehicle_color,
    coverage_zone = EXCLUDED.coverage_zone,
    status = EXCLUDED.status,
    is_online = EXCLUDED.is_online,
    updated_at = NOW();

INSERT INTO public.driver_locations (
    driver_id,
    latitude,
    longitude,
    heading,
    speed_kmh,
    updated_at
)
SELECT
    d.id,
    0.30090,
    32.59510,
    180.0,
    35.5,
    NOW()
FROM public.drivers d
JOIN public.users u ON u.id = d.user_id
WHERE u.email = 'driver.tendo@ambulink.ug'
ON CONFLICT (driver_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    heading = EXCLUDED.heading,
    speed_kmh = EXCLUDED.speed_kmh,
    updated_at = NOW();

SELECT
    u.email,
    u.role AS public_role,
    d.status AS driver_status,
    d.is_online,
    dl.latitude,
    dl.longitude
FROM public.users u
LEFT JOIN public.drivers d ON d.user_id = u.id
LEFT JOIN public.driver_locations dl ON dl.driver_id = d.id
WHERE u.email = 'driver.tendo@ambulink.ug';
