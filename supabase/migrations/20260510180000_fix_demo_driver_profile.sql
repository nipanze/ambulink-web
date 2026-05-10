-- Repair demo driver account if Auth/public user exists but public.drivers is missing.
-- Run this when driver login opens /driver but shows "Driver profile not found".

UPDATE public.users
SET
    first_name = 'Godfrey',
    last_name = 'Ssali',
    phone = CASE
        WHEN phone IS NOT NULL THEN phone
        WHEN NOT EXISTS (
            SELECT 1
            FROM public.users other_user
            WHERE other_user.phone = '+256772100001'
              AND other_user.email <> 'driver.ssali@ambulink.ug'
        ) THEN '+256772100001'
        ELSE '+256772199001'
    END,
    role = 'driver'::public.user_role,
    updated_at = NOW()
WHERE email = 'driver.ssali@ambulink.ug';

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
    'DL-DEMO-SSALI-001',
    'DEM 001S',
    'advanced'::public.vehicle_type,
    'Toyota HiAce',
    'White',
    'Kampala Central',
    'active'::public.driver_status,
    TRUE,
    87,
    4.80,
    NOW()
FROM public.users u
WHERE u.email = 'driver.ssali@ambulink.ug'
ON CONFLICT (user_id) DO UPDATE SET
    license_number = EXCLUDED.license_number,
    vehicle_plate = EXCLUDED.vehicle_plate,
    vehicle_type = EXCLUDED.vehicle_type,
    vehicle_model = EXCLUDED.vehicle_model,
    vehicle_color = EXCLUDED.vehicle_color,
    coverage_zone = EXCLUDED.coverage_zone,
    status = EXCLUDED.status,
    is_online = EXCLUDED.is_online,
    updated_at = NOW()
RETURNING id;

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
    0.31750,
    32.57830,
    45.0,
    0.0,
    NOW()
FROM public.drivers d
JOIN public.users u ON u.id = d.user_id
WHERE u.email = 'driver.ssali@ambulink.ug'
ON CONFLICT (driver_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    heading = EXCLUDED.heading,
    speed_kmh = EXCLUDED.speed_kmh,
    updated_at = NOW();

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
        'first_name', 'Godfrey',
        'last_name', 'Ssali',
        'phone', COALESCE(
            (SELECT phone FROM public.users WHERE email = 'driver.ssali@ambulink.ug'),
            '+256772199001'
        ),
        'role', 'driver'
    )
WHERE email = 'driver.ssali@ambulink.ug';
