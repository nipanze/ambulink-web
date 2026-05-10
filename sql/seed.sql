-- ============================================================
--  AMBULINK — Seed Data (PostgreSQL Compatible) v1.0
--  Kampala International University | © 2026
--  Team: Tumusiime Mahad · Mugisha Abdul · Kato Ashraf
--
--  COMMON PASSWORD for all seeded accounts: ambulink@2026
--  Hash: bcrypt, cost 12
-- ============================================================

SET client_encoding = 'UTF8';


-- ============================================================
--  1. USERS
--  Roles: admin(1), driver(6), patient(many), institution_rep(3)
-- ============================================================
WITH pw(hash) AS (
    VALUES ('$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu'::TEXT)
)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
SELECT v.email, pw.hash, v.first_name, v.last_name, v.phone, v.role::user_role
FROM pw
CROSS JOIN (VALUES
    -- ── Admins (id: 1–2) ──────────────────────────────────
    ('admin@ambulink.ug',          'Flavia',    'Namugga',       '+256700000001', 'admin'),
    ('ops@ambulink.ug',            'David',     'Wafula',        '+256700000002', 'admin'),

    -- ── Drivers (id: 3–12) ───────────────────────────────
    ('driver.ssali@ambulink.ug',   'Godfrey',   'Ssali',         '+256772100001', 'driver'),
    ('driver.nakato@ambulink.ug',  'Sarah',     'Nakato',        '+256772100002', 'driver'),
    ('driver.mukasa@ambulink.ug',  'Ronald',    'Mukasa',        '+256772100003', 'driver'),
    ('driver.achan@ambulink.ug',   'Pamela',    'Achan',         '+256772100004', 'driver'),
    ('driver.okello@ambulink.ug',  'Peter',     'Okello',        '+256772100005', 'driver'),
    ('driver.nabirye@ambulink.ug', 'Agnes',     'Nabirye',       '+256772100006', 'driver'),
    ('driver.tumwine@ambulink.ug', 'Joel',      'Tumwine',       '+256772100007', 'driver'),
    ('driver.apio@ambulink.ug',    'Christine', 'Apio',          '+256772100008', 'driver'),
    ('driver.kato@ambulink.ug',    'Michael',   'Kato',          '+256772100009', 'driver'),
    ('driver.atim@ambulink.ug',    'Beatrice',  'Atim',          '+256772100010', 'driver'),

    -- ── Institution Reps (id: 13–15) ─────────────────────
    ('rep.mulago@ambulink.ug',     'James',     'Mugambwa',      '+256701200001', 'institution_rep'),
    ('rep.kiu@ambulink.ug',        'Rebecca',   'Kemigisha',     '+256701200002', 'institution_rep'),
    ('rep.aga@ambulink.ug',        'Irene',     'Kizito',        '+256701200003', 'institution_rep'),

    -- ── Patients (id: 16–30) ─────────────────────────────
    ('patient.mukisa@ambulink.ug', 'Joshua',    'Mukisa',        '+256780300001', 'patient'),
    ('patient.nambi@ambulink.ug',  'Cynthia',   'Nambi',         '+256780300002', 'patient'),
    ('patient.odong@ambulink.ug',  'Kenneth',   'Odong',         '+256780300003', 'patient'),
    ('patient.nanyonjo@ambulink.ug','Patricia', 'Nanyonjo',      '+256780300004', 'patient'),
    ('patient.bwire@ambulink.ug',  'Robert',    'Bwire',         '+256780300005', 'patient'),
    ('patient.akello@ambulink.ug', 'Grace',     'Akello',        '+256780300006', 'patient'),
    ('patient.ssemanda@ambulink.ug','Peter',    'Ssemanda',      '+256780300007', 'patient'),
    ('patient.nabwire@ambulink.ug','Linda',     'Nabwire',       '+256780300008', 'patient'),
    ('patient.tumusiime@ambulink.ug','Ivan',    'Tumusiime',      '+256780300009', 'patient'),
    ('patient.kaggwa@ambulink.ug', 'Eunice',    'Kaggwa',        '+256780300010', 'patient'),
    ('patient.lutaaya@ambulink.ug','Henry',     'Lutaaya',       '+256780300011', 'patient'),
    ('patient.nakamya@ambulink.ug','Jane',      'Nakamya',       '+256780300012', 'patient'),
    ('patient.ochieng@ambulink.ug','Morris',    'Ochieng',       '+256780300013', 'patient'),
    ('patient.auma@ambulink.ug',   'Mercy',     'Auma',          '+256780300014', 'patient'),
    ('patient.wesonga@ambulink.ug','Methodius', 'Wesonga',       '+256780300015', 'patient')
) AS v(email, first_name, last_name, phone, role);


-- ============================================================
--  2. DRIVER PROFILES  (one per driver user, ids 3–12)
--  All start as 'active' for demo purposes
-- ============================================================
INSERT INTO drivers (
    user_id, license_number, vehicle_plate, vehicle_type,
    vehicle_model, vehicle_color, coverage_zone, status,
    is_online, total_trips, average_rating, verified_at, verified_by
)
SELECT
    u.id,
    v.license_number,
    v.vehicle_plate,
    v.vehicle_type::vehicle_type,
    v.vehicle_model,
    v.vehicle_color,
    v.coverage_zone,
    'active'::driver_status,
    v.is_online,
    v.total_trips,
    v.average_rating,
    NOW() - INTERVAL '10 days',
    1   -- verified by admin id=1
FROM (VALUES
    ('driver.ssali@ambulink.ug',    'DL-KLA-10001', 'UBB 001A', 'advanced',  'Toyota HiAce',     'White',  'Kampala Central',        TRUE,  87,  4.80),
    ('driver.nakato@ambulink.ug',   'DL-KLA-10002', 'UBB 002B', 'basic',     'Toyota Hiace',     'White',  'Kampala North',          TRUE,  54,  4.65),
    ('driver.mukasa@ambulink.ug',   'DL-KLA-10003', 'UBB 003C', 'basic',     'Nissan Urvan',     'White',  'Wakiso',                 TRUE,  120, 4.90),
    ('driver.achan@ambulink.ug',    'DL-GUL-10004', 'UBB 004D', 'advanced',  'Toyota HiAce',     'White',  'Gulu',                   FALSE, 33,  4.70),
    ('driver.okello@ambulink.ug',   'DL-MBR-10005', 'UBB 005E', 'basic',     'Mitsubishi Rosa',  'White',  'Mbarara',                FALSE, 61,  4.55),
    ('driver.nabirye@ambulink.ug',  'DL-JIN-10006', 'UBB 006F', 'advanced',  'Toyota HiAce',     'White',  'Jinja',                  TRUE,  45,  4.75),
    ('driver.tumwine@ambulink.ug',  'DL-KLA-10007', 'UBB 007G', 'neonatal',  'Toyota Hiace',     'White',  'Kampala South',          TRUE,  29,  4.85),
    ('driver.apio@ambulink.ug',     'DL-KLA-10008', 'UBB 008H', 'basic',     'Ford Transit',     'White',  'Kampala East',           TRUE,  72,  4.60),
    ('driver.kato@ambulink.ug',     'DL-MBL-10009', 'UBB 009I', 'advanced',  'Toyota HiAce',     'White',  'Mbale',                  FALSE, 18,  4.50),
    ('driver.atim@ambulink.ug',     'DL-KLA-10010', 'UBB 010J', 'basic',     'Nissan Urvan',     'White',  'Kampala West',           TRUE,  95,  4.72)
) AS v(email, license_number, vehicle_plate, vehicle_type, vehicle_model, vehicle_color, coverage_zone, is_online, total_trips, average_rating)
JOIN users u ON u.email = v.email;


-- ============================================================
--  3. DRIVER LOCATIONS  (seed GPS positions for online drivers)
--  Kampala coords: ~0.3476° N, 32.5825° E
-- ============================================================
INSERT INTO driver_locations (driver_id, latitude, longitude, heading, speed_kmh)
SELECT d.id, v.latitude, v.longitude, v.heading, v.speed_kmh
FROM (VALUES
    ('driver.ssali@ambulink.ug',    0.31750,  32.57830, 045.0,  0.0),
    ('driver.nakato@ambulink.ug',   0.36420,  32.60150, 180.0,  0.0),
    ('driver.mukasa@ambulink.ug',   0.29300,  32.55100, 270.0, 25.0),
    ('driver.nabirye@ambulink.ug',  0.43210,  33.20450, 000.0,  0.0),
    ('driver.tumwine@ambulink.ug',  0.28900,  32.56700, 135.0,  0.0),
    ('driver.apio@ambulink.ug',     0.34100,  32.61200, 090.0, 10.0),
    ('driver.atim@ambulink.ug',     0.30650,  32.53900, 315.0,  0.0)
) AS v(email, latitude, longitude, heading, speed_kmh)
JOIN users   u ON u.email   = v.email
JOIN drivers d ON d.user_id = u.id;


-- ============================================================
--  4. INSTITUTIONS
-- ============================================================
INSERT INTO institutions (
    name, type, address, latitude, longitude,
    contact_phone, contact_email, website, status,
    reviewed_by, reviewed_at
) VALUES
('Mulago National Referral Hospital',  'hospital',    'Mulago Hill Road, Kampala',           0.33560,  32.57650, '+256414541882', 'info@mulago.go.ug',       'https://mulago.go.ug',          'active', 1, NOW() - INTERVAL '30 days'),
('Aga Khan Hospital Kampala',          'hospital',    'Plot 1 Nile Avenue, Kampala',         0.31940,  32.58200, '+256312205000', 'info@akdn.org',            'https://hospitals.akhpk.org',   'active', 1, NOW() - INTERVAL '28 days'),
('Case Medical Centre',                'hospital',    'Muyenga Tank Hill Road, Kampala',     0.29750,  32.60420, '+256414510000', 'info@casemedical.com',     'https://casemedical.com',       'active', 1, NOW() - INTERVAL '25 days'),
('Kampala International University',   'school',      'Kansanga, Kampala',                   0.27780,  32.59870, '+256414501001', 'health@kiu.ac.ug',         'https://kiu.ac.ug',             'active', 1, NOW() - INTERVAL '20 days'),
('International Hospital Kampala',     'hospital',    'Plot 4686 Namuwongo, Kampala',        0.30120,  32.61830, '+256312200400', 'info@ihk.co.ug',           'https://ihk.co.ug',             'active', 1, NOW() - INTERVAL '18 days'),
('Nakasero Hospital',                  'hospital',    'Plot 14 Nakasero Road, Kampala',      0.32100,  32.58900, '+256414344000', 'info@nakaserobhosp.com',   'https://nakaserobhosp.com',     'active', 1, NOW() - INTERVAL '15 days'),
('Uganda Red Cross Society',           'ngo',         'Plot 28/30 Lumumba Avenue, Kampala',  0.31500,  32.57300, '+256414258701', 'info@redcrossug.org',      'https://redcrossug.org',        'active', 1, NOW() - INTERVAL '12 days'),
('Jinja Regional Referral Hospital',   'hospital',    'Nalufenya Road, Jinja',               0.44780,  33.20360, '+256434121006', 'info@jinja.go.ug',         NULL,                            'active', 1, NOW() - INTERVAL '10 days'),
('St. Francis Hospital Nsambya',       'hospital',    'Nsambya Hill, Kampala',               0.29200,  32.59600, '+256414267190', 'info@nsambya.co.ug',       'https://nsambya.co.ug',         'active', 1, NOW() - INTERVAL '8 days'),
('Kabale Regional Referral Hospital',  'hospital',    'Kabale Town, Kabale',                -1.25020,  29.98960, '+256486422030', 'info@kabale.go.ug',        NULL,                            'active', 1, NOW() - INTERVAL '5 days'),
('MedWave Clinic Ntinda',              'clinic',      'Ntinda, Kampala',                     0.35700,  32.62100, '+256754300001', 'info@medwave.ug',          NULL,                            'pending', NULL, NULL),
('Lifeline Medical Centre Mbarara',    'clinic',      'High Street, Mbarara',               -0.60870,  30.65450, '+256485420001', 'info@lifeline.ug',         NULL,                            'pending', NULL, NULL);


-- ============================================================
--  5. INSTITUTION REPS  (link rep users to institutions)
-- ============================================================
INSERT INTO institution_reps (user_id, institution_id, job_title, is_primary)
SELECT u.id, i.id, v.job_title, v.is_primary
FROM (VALUES
    ('rep.mulago@ambulink.ug', 'Mulago National Referral Hospital',    'Emergency Coordinator', TRUE),
    ('rep.kiu@ambulink.ug',    'Kampala International University',     'Campus Health Officer', TRUE),
    ('rep.aga@ambulink.ug',    'Aga Khan Hospital Kampala',            'Ambulance Liaison',     TRUE)
) AS v(email, institution_name, job_title, is_primary)
JOIN users        u ON u.email = v.email
JOIN institutions i ON i.name  = v.institution_name;


-- ============================================================
--  6. BOOKINGS  (diverse sample covering all types/statuses)
-- ============================================================

-- Helper: get user id by email
-- Completed emergency booking — Kampala Central
WITH ids AS (
    SELECT
        (SELECT id FROM users   WHERE email = 'patient.mukisa@ambulink.ug')  AS patient_id,
        (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'driver.ssali@ambulink.ug')) AS driver_id
)
INSERT INTO bookings (
    booking_ref, patient_id, driver_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address,
    destination_name, destination_latitude, destination_longitude, destination_address,
    assigned_at, pickup_at, dropoff_at,
    distance_km, duration_minutes, fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260501-0001',
    ids.patient_id, ids.driver_id, 'emergency', 'completed',
    0.31450, 32.58100, 'Makerere University Road, Kampala',
    'Mulago National Referral Hospital', 0.33560, 32.57650, 'Mulago Hill Road',
    NOW() - INTERVAL '8 days' + INTERVAL '4 minutes',
    NOW() - INTERVAL '8 days' + INTERVAL '9 minutes',
    NOW() - INTERVAL '8 days' + INTERVAL '24 minutes',
    3.2, 23, 25000.00, 'paid',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
FROM ids;

-- Completed emergency — rated
WITH ids AS (
    SELECT
        (SELECT id FROM users   WHERE email = 'patient.nambi@ambulink.ug')   AS patient_id,
        (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'driver.mukasa@ambulink.ug')) AS driver_id
)
INSERT INTO bookings (
    booking_ref, patient_id, driver_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address,
    destination_name, destination_latitude, destination_longitude, destination_address,
    assigned_at, pickup_at, dropoff_at,
    distance_km, duration_minutes, fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260502-0001',
    ids.patient_id, ids.driver_id, 'emergency', 'completed',
    0.30100, 32.56400, 'Namirembe Road, Kampala',
    'Case Medical Centre', 0.29750, 32.60420, 'Muyenga Tank Hill Road',
    NOW() - INTERVAL '7 days' + INTERVAL '3 minutes',
    NOW() - INTERVAL '7 days' + INTERVAL '8 minutes',
    NOW() - INTERVAL '7 days' + INTERVAL '30 minutes',
    5.8, 34, 40000.00, 'paid',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
FROM ids;

-- Completed scheduled booking
WITH ids AS (
    SELECT
        (SELECT id FROM users   WHERE email = 'patient.odong@ambulink.ug')   AS patient_id,
        (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'driver.nakato@ambulink.ug')) AS driver_id
)
INSERT INTO bookings (
    booking_ref, patient_id, driver_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address,
    destination_name, destination_latitude, destination_longitude, destination_address,
    scheduled_at, assigned_at, pickup_at, dropoff_at,
    distance_km, duration_minutes, fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260503-0001',
    ids.patient_id, ids.driver_id, 'scheduled', 'completed',
    0.35100, 32.61400, 'Ntinda Shopping Centre',
    'Nakasero Hospital', 0.32100, 32.58900, 'Nakasero Road',
    NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '2 hours' + INTERVAL '5 minutes',
    NOW() - INTERVAL '5 days' + INTERVAL '2 hours' + INTERVAL '15 minutes',
    NOW() - INTERVAL '5 days' + INTERVAL '2 hours' + INTERVAL '40 minutes',
    7.1, 45, 55000.00, 'paid',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days'
FROM ids;

-- Completed institutional booking (Mulago)
WITH ids AS (
    SELECT
        (SELECT id FROM users        WHERE email = 'rep.mulago@ambulink.ug')  AS patient_id,
        (SELECT id FROM drivers      WHERE user_id = (SELECT id FROM users WHERE email = 'driver.tumwine@ambulink.ug')) AS driver_id,
        (SELECT id FROM institutions WHERE name   = 'Mulago National Referral Hospital') AS inst_id
)
INSERT INTO bookings (
    booking_ref, patient_id, driver_id, institution_id, type, status, is_priority,
    pickup_latitude, pickup_longitude, pickup_address,
    destination_name, destination_latitude, destination_longitude, destination_address,
    assigned_at, pickup_at, dropoff_at,
    distance_km, duration_minutes, fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260503-0002',
    ids.patient_id, ids.driver_id, ids.inst_id, 'institutional', 'completed', TRUE,
    0.33560, 32.57650, 'Mulago Hospital, Ward 5',
    'International Hospital Kampala', 0.30120, 32.61830, 'Namuwongo',
    NOW() - INTERVAL '5 days' + INTERVAL '2 minutes',
    NOW() - INTERVAL '5 days' + INTERVAL '7 minutes',
    NOW() - INTERVAL '5 days' + INTERVAL '28 minutes',
    4.9, 30, 0.00, 'waived',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
FROM ids;

-- Completed highway accident booking
WITH ids AS (
    SELECT
        (SELECT id FROM users   WHERE email = 'patient.bwire@ambulink.ug')   AS patient_id,
        (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'driver.nabirye@ambulink.ug')) AS driver_id
)
INSERT INTO bookings (
    booking_ref, patient_id, driver_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address, pickup_landmark,
    destination_name, destination_latitude, destination_longitude, destination_address,
    assigned_at, pickup_at, dropoff_at,
    distance_km, duration_minutes, fare_amount, payment_status,
    road_corridor, highway_landmark,
    created_at, updated_at
)
SELECT
    'AMB-20260504-0001',
    ids.patient_id, ids.driver_id, 'highway', 'completed',
    0.41200, 33.05600, 'Kampala–Jinja Highway, km 34', 'Near Busiika Trading Centre',
    'Jinja Regional Referral Hospital', 0.44780, 33.20360, 'Nalufenya Road, Jinja',
    NOW() - INTERVAL '4 days' + INTERVAL '7 minutes',
    NOW() - INTERVAL '4 days' + INTERVAL '20 minutes',
    NOW() - INTERVAL '4 days' + INTERVAL '65 minutes',
    19.4, 68, 120000.00, 'paid',
    'kampala_jinja', 'Busiika Trading Centre',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
FROM ids;

-- Active booking — driver en_route right now
WITH ids AS (
    SELECT
        (SELECT id FROM users   WHERE email = 'patient.akello@ambulink.ug')  AS patient_id,
        (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'driver.apio@ambulink.ug')) AS driver_id
)
INSERT INTO bookings (
    booking_ref, patient_id, driver_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address,
    destination_name, destination_latitude, destination_longitude, destination_address,
    assigned_at,
    distance_km, fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260509-0001',
    ids.patient_id, ids.driver_id, 'emergency', 'en_route',
    0.34100, 32.61200, 'Naguru Hill, Kampala',
    'St. Francis Hospital Nsambya', 0.29200, 32.59600, 'Nsambya Hill',
    NOW() - INTERVAL '4 minutes',
    7.8, 60000.00, 'unpaid',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '4 minutes'
FROM ids;

-- Pending emergency — just created, not yet assigned
WITH ids AS (
    SELECT (SELECT id FROM users WHERE email = 'patient.ssemanda@ambulink.ug') AS patient_id
)
INSERT INTO bookings (
    booking_ref, patient_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address, pickup_landmark,
    destination_name,
    fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260509-0002',
    ids.patient_id, 'emergency', 'requested',
    0.30900, 32.56200, 'Old Kampala Road', 'Near Old Kampala Mosque',
    'Nearest available hospital',
    NULL, 'unpaid',
    NOW() - INTERVAL '30 seconds',
    NOW() - INTERVAL '30 seconds'
FROM ids;

-- Upcoming scheduled booking (future)
WITH ids AS (
    SELECT
        (SELECT id FROM users   WHERE email = 'patient.nabwire@ambulink.ug')  AS patient_id,
        (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'driver.mukasa@ambulink.ug')) AS driver_id
)
INSERT INTO bookings (
    booking_ref, patient_id, driver_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address,
    destination_name, destination_latitude, destination_longitude, destination_address,
    scheduled_at, assigned_at,
    fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260510-0001',
    ids.patient_id, ids.driver_id, 'scheduled', 'assigned',
    0.36500, 32.62000, 'Kirinya, Wakiso',
    'Aga Khan Hospital Kampala', 0.31940, 32.58200, 'Nile Avenue',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    NOW() - INTERVAL '1 hour',
    70000.00, 'unpaid',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
FROM ids;

-- Cancelled booking
WITH ids AS (
    SELECT (SELECT id FROM users WHERE email = 'patient.tumusiime@ambulink.ug') AS patient_id
)
INSERT INTO bookings (
    booking_ref, patient_id, type, status,
    pickup_latitude, pickup_longitude, pickup_address,
    destination_name,
    cancelled_at, cancellation_reason,
    fare_amount, payment_status,
    created_at, updated_at
)
SELECT
    'AMB-20260506-0001',
    ids.patient_id, 'emergency', 'cancelled',
    0.32800, 32.59300, 'Kamwokya, Kampala',
    'Nakasero Hospital',
    NOW() - INTERVAL '3 days' + INTERVAL '2 minutes',
    'Patient called to say condition resolved before driver arrived',
    NULL, 'unpaid',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
FROM ids;


-- ============================================================
--  7. BOOKING STATUS HISTORY  (seed transitions for completed trips)
-- ============================================================
INSERT INTO booking_status_history (booking_id, from_status, to_status, created_at)
SELECT b.id, 'requested'::booking_status, 'assigned'::booking_status,     b.assigned_at
FROM bookings b WHERE b.assigned_at IS NOT NULL AND b.booking_ref IN (
    'AMB-20260501-0001','AMB-20260502-0001','AMB-20260503-0001',
    'AMB-20260503-0002','AMB-20260504-0001','AMB-20260509-0001',
    'AMB-20260510-0001'
);

INSERT INTO booking_status_history (booking_id, from_status, to_status, created_at)
SELECT b.id, 'assigned'::booking_status, 'en_route'::booking_status,      b.assigned_at + INTERVAL '1 minute'
FROM bookings b WHERE b.status IN ('en_route','at_scene','transporting','completed')
  AND b.assigned_at IS NOT NULL;

INSERT INTO booking_status_history (booking_id, from_status, to_status, created_at)
SELECT b.id, 'en_route'::booking_status, 'at_scene'::booking_status,      b.pickup_at
FROM bookings b WHERE b.pickup_at IS NOT NULL;

INSERT INTO booking_status_history (booking_id, from_status, to_status, created_at)
SELECT b.id, 'at_scene'::booking_status, 'transporting'::booking_status,  b.pickup_at + INTERVAL '5 minutes'
FROM bookings b WHERE b.pickup_at IS NOT NULL AND b.dropoff_at IS NOT NULL;

INSERT INTO booking_status_history (booking_id, from_status, to_status, created_at)
SELECT b.id, 'transporting'::booking_status, 'completed'::booking_status, b.dropoff_at
FROM bookings b WHERE b.dropoff_at IS NOT NULL;

INSERT INTO booking_status_history (booking_id, from_status, to_status, created_at)
SELECT b.id, 'requested'::booking_status, 'cancelled'::booking_status,    b.cancelled_at
FROM bookings b WHERE b.cancelled_at IS NOT NULL;


-- ============================================================
--  8. DRIVER RATINGS  (for completed bookings)
-- ============================================================
INSERT INTO driver_ratings (booking_id, patient_id, driver_id, rating, comment)
SELECT
    b.id,
    b.patient_id,
    b.driver_id,
    v.rating,
    v.comment
FROM (VALUES
    ('AMB-20260501-0001', 5, 'Very fast response — driver arrived in under 10 minutes!'),
    ('AMB-20260502-0001', 5, 'Godfrey was calm and professional throughout the journey.'),
    ('AMB-20260503-0001', 4, 'Good service, punctual for the scheduled pick-up.'),
    ('AMB-20260504-0001', 5, 'Excellent — highway response was lifesaving.')
) AS v(booking_ref, rating, comment)
JOIN bookings b ON b.booking_ref = v.booking_ref
WHERE b.driver_id IS NOT NULL;


-- ============================================================
--  9. NOTIFICATIONS  (sample notifications across event types)
-- ============================================================
INSERT INTO notifications (user_id, event, channel, status, title, body, related_booking_id, is_read, read_at, sent_at, created_at)
SELECT
    u.id,
    v.event::notification_event,
    v.channel::notification_channel,
    v.status::notification_status,
    v.title,
    v.body,
    b.id,
    v.is_read,
    CASE WHEN v.is_read THEN NOW() - INTERVAL '1 hour' ELSE NULL END,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
FROM (VALUES
    -- patient notifications
    ('patient.mukisa@ambulink.ug',  'booking_created',   'in_app', 'sent',      'Booking Confirmed',       'Your emergency booking AMB-20260501-0001 has been received.',  'AMB-20260501-0001', TRUE),
    ('patient.mukisa@ambulink.ug',  'driver_assigned',   'fcm',    'delivered', 'Driver Assigned',         'Godfrey Ssali is on the way. ETA: 6 minutes.',                 'AMB-20260501-0001', TRUE),
    ('patient.mukisa@ambulink.ug',  'trip_completed',    'in_app', 'sent',      'Trip Completed',          'Your trip to Mulago is complete. Please rate your driver.',     'AMB-20260501-0001', TRUE),
    ('patient.akello@ambulink.ug',  'driver_en_route',   'fcm',    'delivered', 'Driver En Route',         'Christine Apio is heading to your location.',                  'AMB-20260509-0001', FALSE),
    ('patient.ssemanda@ambulink.ug','booking_created',   'in_app', 'sent',      'Booking Received',        'We are finding the nearest available driver for you.',          'AMB-20260509-0002', FALSE),
    -- driver notifications
    ('driver.ssali@ambulink.ug',    'booking_created',   'fcm',    'delivered', 'New Emergency Booking',   'Emergency request near Makerere University Road.',             'AMB-20260501-0001', TRUE),
    ('driver.apio@ambulink.ug',     'booking_created',   'fcm',    'delivered', 'New Emergency Booking',   'Emergency request near Naguru Hill.',                          'AMB-20260509-0001', TRUE),
    -- admin notifications
    ('admin@ambulink.ug',           'institution_booking','in_app','sent',       'Priority Institutional',  'Mulago Hospital submitted a priority booking.',                'AMB-20260503-0002', TRUE),
    ('admin@ambulink.ug',           'admin_alert',       'in_app', 'sent',       'New Institution Pending', 'MedWave Clinic Ntinda is awaiting approval.',                  NULL,                FALSE)
) AS v(email, event, channel, status, title, body, booking_ref, is_read)
JOIN users u ON u.email = v.email
LEFT JOIN bookings b ON b.booking_ref = v.booking_ref;


-- ============================================================
--  10. AUDIT LOGS  (sample admin actions)
-- ============================================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'admin@ambulink.ug'),
    v.action,
    v.entity_type,
    v.entity_id,
    v.new_values::JSONB,
    '41.210.86.1',
    NOW() - (v.days_ago || ' days')::INTERVAL
FROM (VALUES
    ('VERIFY_DRIVER',       'drivers',      1,  '{"status":"active","verified":true}',                5),
    ('VERIFY_DRIVER',       'drivers',      2,  '{"status":"active","verified":true}',                5),
    ('APPROVE_INSTITUTION', 'institutions', 1,  '{"status":"active","institution":"Mulago"}',         30),
    ('APPROVE_INSTITUTION', 'institutions', 2,  '{"status":"active","institution":"Aga Khan"}',       28),
    ('APPROVE_INSTITUTION', 'institutions', 4,  '{"status":"active","institution":"KIU"}',            20),
    ('UPDATE_BOOKING',      'bookings',     1,  '{"status":"completed"}',                             8),
    ('SUSPEND_DRIVER',      'drivers',      5,  '{"status":"suspended","reason":"missed 3 trips"}',   1)
) AS v(action, entity_type, entity_id, new_values, days_ago);


-- ============================================================
--  END OF SEED DATA — AmbuLink v1.0
--  Kampala International University | © 2026
--  Tumusiime Mahad · Mugisha Abdul · Kato Ashraf
-- ============================================================
