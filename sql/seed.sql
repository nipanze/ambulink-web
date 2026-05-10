-- ============================================================
--  AMBULINK — Smart Ambulance Booking System
--  PostgreSQL Seed Data v2.0
--  Kampala International University | © 2026
--  Team: Tumusiime Mahad · Mugisha Abdul · Kato Ashraf
--  Supervisor: Mr. Tumwebaze Wilson
-- ============================================================
--
--  COMMON PASSWORD for all seeded accounts: ambulink@2026
--  Hash: bcrypt, cost 12
--  $2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu
--
-- ============================================================

SET client_encoding = 'UTF8';
BEGIN;

-- Prevent trg_create_patient_profile from firing skeleton rows
-- before our detailed explicit INSERT into patients runs.
ALTER TABLE users DISABLE TRIGGER trg_create_patient_profile;

-- ============================================================
--  UTILITY CTE — shared password hash
-- ============================================================
-- Referenced inline below. All accounts: ambulink@2026

-- ============================================================
--  SECTION 1 — USERS
--  IDs 1–20
--   1     = admin
--   2–6   = patients
--   7–11  = drivers
--   12–15 = institution_reps
--   16–20 = extra patients
-- ============================================================

INSERT INTO users
    (id, email, password_hash, first_name, last_name, phone, role, fcm_token, is_active, last_login)
VALUES
-- Admin
(1,  'admin@ambulink.ug',         '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'System',   'Admin',    '+256700000001', 'admin',           'fcm_admin_001',   TRUE, NOW() - INTERVAL '1 hour'),

-- Patients
(2,  'nakato.sarah@gmail.com',    '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Sarah',    'Nakato',   '+256772100001', 'patient',         'fcm_pat_001',     TRUE, NOW() - INTERVAL '2 hours'),
(3,  'ochieng.james@gmail.com',   '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'James',    'Ochieng',  '+256772100002', 'patient',         'fcm_pat_002',     TRUE, NOW() - INTERVAL '1 day'),
(4,  'mutesi.grace@gmail.com',    '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Grace',    'Mutesi',   '+256772100003', 'patient',         'fcm_pat_003',     TRUE, NOW() - INTERVAL '3 days'),
(5,  'ssemakula.david@gmail.com', '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'David',    'Ssemakula','+256772100004', 'patient',         'fcm_pat_004',     TRUE, NOW() - INTERVAL '5 days'),
(6,  'atim.florence@gmail.com',   '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Florence', 'Atim',     '+256772100005', 'patient',         'fcm_pat_005',     TRUE, NOW() - INTERVAL '7 days'),

-- Drivers
(7,  'driver.mukasa@ambulink.ug', '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Ronald',   'Mukasa',   '+256782200001', 'driver',          'fcm_drv_001',     TRUE, NOW() - INTERVAL '30 minutes'),
(8,  'driver.tendo@ambulink.ug',  '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Ivan',     'Tendo',    '+256782200002', 'driver',          'fcm_drv_002',     TRUE, NOW() - INTERVAL '2 hours'),
(9,  'driver.nkosi@ambulink.ug',  '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Peter',    'Nkosi',    '+256782200003', 'driver',          'fcm_drv_003',     TRUE, NOW() - INTERVAL '4 hours'),
(10, 'driver.apio@ambulink.ug',   '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Agnes',    'Apio',     '+256782200004', 'driver',          'fcm_drv_004',     TRUE, NOW() - INTERVAL '1 day'),
(11, 'driver.bogere@ambulink.ug', '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Moses',    'Bogere',   '+256782200005', 'driver',          'fcm_drv_005',     FALSE, NOW() - INTERVAL '10 days'),

-- Institution reps
(12, 'rep.mulago@kiuhealth.ug',   '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Harriet',  'Nalwadda', '+256702300001', 'institution_rep', 'fcm_rep_001',     TRUE, NOW() - INTERVAL '1 hour'),
(13, 'rep.kcca@kiuhealth.ug',     '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Emmanuel', 'Lule',     '+256702300002', 'institution_rep', 'fcm_rep_002',     TRUE, NOW() - INTERVAL '3 hours'),
(14, 'rep.ifc@kiuhealth.ug',      '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Prossy',   'Nabukenya','+256702300003', 'institution_rep', 'fcm_rep_003',     TRUE, NOW() - INTERVAL '2 days'),
(15, 'rep.pending@example.ug',    '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Brian',    'Kizza',    '+256702300004', 'institution_rep', NULL,              TRUE, NOW() - INTERVAL '5 days'),

-- Extra patients
(16, 'kabugo.richard@gmail.com',  '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Richard',  'Kabugo',   '+256772100016', 'patient',         'fcm_pat_016',     TRUE, NOW() - INTERVAL '2 days'),
(17, 'namukasa.rita@gmail.com',   '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Rita',     'Namukasa', '+256772100017', 'patient',         'fcm_pat_017',     TRUE, NOW() - INTERVAL '3 days'),
(18, 'okello.paul@gmail.com',     '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Paul',     'Okello',   '+256772100018', 'patient',         'fcm_pat_018',     TRUE, NOW() - INTERVAL '6 days'),
(19, 'nansubuga.betty@gmail.com', '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'Betty',    'Nansubuga','+256772100019', 'patient',         'fcm_pat_019',     TRUE, NOW() - INTERVAL '8 days'),
(20, 'mugabi.john@gmail.com',     '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu', 'John',     'Mugabi',   '+256772100020', 'patient',         'fcm_pat_020',     TRUE, NOW() - INTERVAL '10 days');

-- Sync SERIAL sequence
SELECT setval('users_id_seq', 20, true);


-- ============================================================
--  SECTION 2 — SESSIONS
-- ============================================================

INSERT INTO sessions (session_id, user_id, device_info, ip_address, expires_at)
VALUES
('sess_admin_abc123',   1,  'Mozilla/5.0 Chrome/124 Windows 10',         '41.210.20.1',   NOW() + INTERVAL '7 days'),
('sess_sarah_xyz789',   2,  'Dart/3.3 (dart:io) Flutter/3.19 Android 13','41.210.20.15',  NOW() + INTERVAL '30 days'),
('sess_james_lmn456',   3,  'Dart/3.3 (dart:io) Flutter/3.19 Android 12','41.210.20.22',  NOW() + INTERVAL '30 days'),
('sess_mukasa_drv001',  7,  'Dart/3.3 (dart:io) Flutter/3.19 Android 14','41.210.20.55',  NOW() + INTERVAL '30 days'),
('sess_tendo_drv002',   8,  'Dart/3.3 (dart:io) Flutter/3.19 Android 13','41.210.20.60',  NOW() + INTERVAL '30 days'),
('sess_harriet_rep001', 12, 'Mozilla/5.0 Chrome/124 Ubuntu',             '41.210.21.100', NOW() + INTERVAL '7 days');


-- ============================================================
--  SECTION 3 — PATIENTS  (user_ids 2–6, 16–20)
--  IDs 1–10 matching insertion order
-- ============================================================

INSERT INTO patients
    (id, user_id, date_of_birth, gender, national_id,
     blood_group, allergies, chronic_conditions, current_medications, disability_notes,
     emergency_contact_name, emergency_contact_phone, emergency_contact_rel,
     preferred_hospital, preferred_language,
     total_bookings, total_completed, total_cancelled,
     verified_at)
VALUES
(1,  2,  '1992-04-15', 'female',              'CM9200415001A', 'O+',      'Penicillin',               'Hypertension',         'Amlodipine 5mg',            NULL,                   'Joseph Nakato',    '+256772900001', 'Husband',  'Mulago National Referral Hospital', 'English', 4, 3, 1, NOW() - INTERVAL '30 days'),
(2,  3,  '1985-11-22', 'male',                'CM8501122002B', 'A+',      NULL,                       'Diabetes Type 2',      'Metformin 500mg',           NULL,                   'Mary Ochieng',     '+256772900002', 'Wife',     'Kampala International Hospital',    'English', 2, 2, 0, NOW() - INTERVAL '60 days'),
(3,  4,  '2000-07-08', 'female',              'CM0000708003C', 'B+',      'Latex, Sulfonamides',      NULL,                   NULL,                        NULL,                   'Patrick Mutesi',   '+256772900003', 'Brother',  'Case Medical Centre',               'Luganda', 1, 1, 0, NOW() - INTERVAL '15 days'),
(4,  5,  '1978-03-30', 'male',                'CM7800330004D', 'AB-',     'Aspirin',                  'Asthma, Hypertension', 'Salbutamol inhaler, Losartan','Wheelchair user',    'Alice Ssemakula',  '+256772900004', 'Spouse',   'Mulago National Referral Hospital', 'English', 3, 2, 1, NOW() - INTERVAL '45 days'),
(5,  6,  '1995-09-12', 'female',              'CM9500912005E', 'O-',      NULL,                       NULL,                   NULL,                        NULL,                   'Robert Atim',      '+256772900005', 'Father',   'St. Francis Hospital Nsambya',      'Acholi',  1, 0, 1, NULL),
(6,  16, '1990-06-25', 'male',                'CM9000625006F', 'A-',      'Codeine',                  'Epilepsy',             'Phenobarbital 60mg',        NULL,                   'Angela Kabugo',    '+256772900006', 'Sister',   'Rubaga Hospital',                   'English', 5, 4, 1, NOW() - INTERVAL '90 days'),
(7,  17, '1988-12-01', 'female',              'CM8801201007G', 'B-',      NULL,                       NULL,                   NULL,                        NULL,                   'George Namukasa',  '+256772900007', 'Husband',  'Case Medical Centre',               'Luganda', 2, 1, 1, NOW() - INTERVAL '20 days'),
(8,  18, '1975-05-18', 'male',                'CM7500518008H', 'AB+',     'Ibuprofen',                'Chronic Kidney Disease','Erythropoietin injection', 'Dialysis patient',     'Susan Okello',     '+256772900008', 'Wife',     'Mulago National Referral Hospital', 'Luo',     6, 5, 1, NOW() - INTERVAL '120 days'),
(9,  19, '2003-02-14', 'female',              'CM0300214009I', 'O+',      NULL,                       NULL,                   NULL,                        NULL,                   'Thomas Nansubuga', '+256772900009', 'Father',   'International Hospital Kampala',    'English', 1, 1, 0, NOW() - INTERVAL '10 days'),
(10, 20, '1969-08-07', 'male',                'CM6900807010J', 'A+',      'Penicillin, Erythromycin', 'Type 1 Diabetes, Hypertension','Insulin glargine, Amlodipine','Visual impairment','Lydia Mugabi','+256772900010', 'Daughter', 'Mulago National Referral Hospital', 'English', 8, 6, 2, NOW() - INTERVAL '200 days');

SELECT setval('patients_id_seq', 10, true);

-- Trigger back on for normal runtime behaviour
ALTER TABLE users ENABLE TRIGGER trg_create_patient_profile;


-- ============================================================
--  SECTION 4 — DRIVERS  (user_ids 7–11)
--  IDs 1–5
-- ============================================================

INSERT INTO drivers
    (id, user_id, license_number, vehicle_plate, vehicle_type, vehicle_model, vehicle_color,
     coverage_zone, status, is_online, total_trips, average_rating,
     verified_at, verified_by)
VALUES
(1, 7,  'DL-KLA-2019-001', 'UAL 123A', 'advanced', 'Toyota HiAce Ambulance',  'White',        'Kampala Central, Nakawa',        'active',      TRUE,  84, 4.72, NOW() - INTERVAL '180 days', 1),
(2, 8,  'DL-KLA-2020-002', 'UAL 456B', 'basic',    'Nissan Caravan Ambulance', 'White/Yellow', 'Kampala Central, Makindye',      'active',      TRUE,  51, 4.45, NOW() - INTERVAL '120 days', 1),
(3, 9,  'DL-KLA-2018-003', 'UAL 789C', 'neonatal', 'Mercedes Sprinter',        'White/Blue',   'Mulago, Kawempe, Nakawa',        'active',      FALSE, 38, 4.88, NOW() - INTERVAL '90 days',  1),
(4, 10, 'DL-KLA-2021-004', 'UAL 321D', 'basic',    'Toyota HiAce Ambulance',   'White',        'Entebbe Road, Makindye',         'active',      TRUE,  29, 4.20, NOW() - INTERVAL '60 days',  1),
(5, 11, 'DL-KLA-2022-005', 'UAL 654E', 'basic',    'Nissan Caravan Ambulance', 'White',        'Kampala Central',                'suspended',   FALSE,  9, 3.80, NOW() - INTERVAL '30 days',  1);

SELECT setval('drivers_id_seq', 5, true);

-- Driver suspended reason
UPDATE drivers SET suspended_reason = 'Multiple patient complaints about reckless driving. Under review.' WHERE id = 5;


-- ============================================================
--  SECTION 4b — DRIVER LOCATIONS
-- ============================================================

INSERT INTO driver_locations (driver_id, latitude, longitude, heading, speed_kmh, accuracy_m)
VALUES
(1, 0.3476,  32.5825, 90.0,  0.0,   8.0),   -- Nakasero (stationary, waiting)
(2, 0.3009,  32.5951, 180.0, 35.5,  10.0),  -- Muyenga, heading south
(3, 0.3406,  32.5699, 0.0,   0.0,   6.0),   -- Mulago hill (stationary)
(4, 0.2921,  32.5985, 270.0, 28.0,  12.0),  -- Entebbe Rd, heading west
(5, 0.3150,  32.5720, 0.0,   0.0,   15.0);  -- Wandegeya (offline/suspended)


-- ============================================================
--  SECTION 5 — INSTITUTIONS  (IDs 1–5)
-- ============================================================

INSERT INTO institutions
    (id, name, type, address, latitude, longitude,
     contact_phone, contact_email, website,
     status, reviewed_by, reviewed_at)
VALUES
(1, 'Mulago National Referral Hospital',   'hospital',    'Upper Mulago Hill Road, Kampala',              0.3406,  32.5699, '+256414540020', 'info@mulago.go.ug',         'https://mulago.go.ug',        'active', 1, NOW() - INTERVAL '200 days'),
(2, 'Kampala International Hospital',      'hospital',    'Plot 4686, Namuwongo, Kampala',                0.2979,  32.6052, '+256312202100', 'info@kijambula.com',        'https://kih.co.ug',           'active', 1, NOW() - INTERVAL '150 days'),
(3, 'Kampala City Council Authority (KCCA)','government', 'City Hall, Colline Road, Kampala',             0.3163,  32.5822, '+256417330000', 'info@kcca.go.ug',           'https://kcca.go.ug',          'active', 1, NOW() - INTERVAL '100 days'),
(4, 'International Finance Corporation UG','corporate',   'Rwenzori House, 1 Lumumba Avenue, Kampala',   0.3242,  32.5858, '+256312300500', 'kampala@ifc.org',           'https://ifc.org',             'active', 1, NOW() - INTERVAL '80 days'),
(5, 'Bright Future Academy Entebbe',       'school',      'Entebbe Road, Entebbe',                        0.0600,  32.4608, '+256392001234', 'admin@brightfuture.ug',     NULL,                          'pending', NULL, NULL);

SELECT setval('institutions_id_seq', 5, true);


-- ============================================================
--  SECTION 5b — INSTITUTION REPS
-- ============================================================

INSERT INTO institution_reps (id, user_id, institution_id, job_title, is_primary)
VALUES
(1, 12, 1, 'Head of Ambulance Services',    TRUE),
(2, 13, 3, 'Emergency Liaison Officer',     TRUE),
(3, 14, 4, 'Corporate Health & Safety Mgr', TRUE),
(4, 15, 5, 'School Administrator',          TRUE);

SELECT setval('institution_reps_id_seq', 4, true);


-- ============================================================
--  SECTION 6 — BOOKINGS  (IDs 1–12)
--  Mix: completed, active, cancelled, scheduled, highway, institutional
-- ============================================================

INSERT INTO bookings
    (id, booking_ref, patient_id, driver_id, institution_id, type, status,
     pickup_latitude, pickup_longitude, pickup_address, pickup_landmark,
     destination_name, destination_latitude, destination_longitude, destination_address,
     scheduled_at, assigned_at, pickup_at, dropoff_at, cancelled_at, cancellation_reason,
     distance_km, duration_minutes, is_priority, patient_notes,
     road_corridor, highway_landmark,
     fare_amount, payment_status)
VALUES

-- 1. Completed emergency — Sarah Nakato, driver Ronald Mukasa
(1,  'AMB-20260101-0001', 1, 1, NULL,  'emergency',    'completed',
 0.3312, 32.5779, 'Nakasero, Kampala',                 'Near Shell Nakasero',
 'Mulago National Referral Hospital', 0.3406, 32.5699, 'Upper Mulago Hill Road, Kampala',
 NULL, NOW()-INTERVAL '20 days 2h', NOW()-INTERVAL '20 days 1h 50m', NOW()-INTERVAL '20 days 1h 30m',  NULL, NULL,
 5.2, 20, TRUE,  'Patient collapsed, suspected cardiac event', NULL, NULL, 65000, 'paid'),

-- 2. Completed emergency — James Ochieng, driver Ivan Tendo
(2,  'AMB-20260110-0002', 2, 2, NULL,  'emergency',    'completed',
 0.3025, 32.6010, 'Muyenga, Kampala',                  'Shell Muyenga',
 'Case Medical Centre',               0.3218, 32.5858, 'Plot 67 Lugogo Bypass, Kampala',
 NULL, NOW()-INTERVAL '15 days 3h', NOW()-INTERVAL '15 days 2h 50m', NOW()-INTERVAL '15 days 2h 25m',  NULL, NULL,
 4.1, 18, FALSE, 'Severe hypoglycaemic episode, unconscious', NULL, NULL, 52000, 'paid'),

-- 3. Completed scheduled — Grace Mutesi, driver Agnes Apio
(3,  'AMB-20260115-0003', 3, 4, NULL,  'scheduled',    'completed',
 0.3180, 32.6100, 'Bugolobi, Kampala',                 'Bugolobi Market',
 'International Hospital Kampala',    0.3304, 32.5767, 'Namuwongo, Kampala',
 NOW()-INTERVAL '10 days', NOW()-INTERVAL '10 days 5m', NOW()-INTERVAL '10 days'+INTERVAL '5m', NOW()-INTERVAL '10 days'+INTERVAL '30m', NULL, NULL,
 3.8, 25, FALSE, 'Post-op follow-up appointment', NULL, NULL, 45000, 'paid'),

-- 4. Completed institutional — David Ssemakula, driver Ronald Mukasa, institution KCCA
(4,  'AMB-20260120-0004', 4, 1, 3, 'institutional', 'completed',
 0.3163, 32.5822, 'City Hall, Kampala',                'KCCA City Hall Entrance',
 'Mulago National Referral Hospital', 0.3406, 32.5699, 'Upper Mulago Hill Road, Kampala',
 NULL, NOW()-INTERVAL '8 days 1h', NOW()-INTERVAL '8 days 55m', NOW()-INTERVAL '8 days 35m', NULL, NULL,
 3.2, 18, TRUE,  'Employee collapsed in meeting, suspected stroke', NULL, NULL, 50000, 'waived'),

-- 5. Completed highway — Richard Kabugo, driver Ivan Tendo
(5,  'AMB-20260122-0005', 6, 2, NULL,  'highway',      'completed',
 0.1800, 32.5200, 'Entebbe Road, near Kajjansi',       'Total Kajjansi Petrol Station',
 'Mulago National Referral Hospital', 0.3406, 32.5699, 'Upper Mulago Hill Road, Kampala',
 NULL, NOW()-INTERVAL '6 days 2h', NOW()-INTERVAL '6 days 1h 45m', NOW()-INTERVAL '6 days 1h 10m', NULL, NULL,
 28.4, 55, TRUE,  'RTA victim, multiple limb fractures', 'kampala_masaka', 'Kajjansi Trading Centre', 120000, 'paid'),

-- 6. Cancelled — Florence Atim, no driver
(6,  'AMB-20260123-0006', 5, NULL, NULL, 'emergency',  'cancelled',
 0.3522, 32.5900, 'Kamwokya, Kampala',                 'Kamwokya Community Clinic',
 'Mulago National Referral Hospital', 0.3406, 32.5699, 'Upper Mulago Hill Road, Kampala',
 NULL, NULL, NULL, NULL, NOW()-INTERVAL '5 days', 'Patient found own transport before driver arrived',
 NULL, NULL, FALSE, 'Severe abdominal pain', NULL, NULL, NULL, 'unpaid'),

-- 7. Active — en_route — Sarah Nakato, driver Peter Nkosi
(7,  'AMB-20260508-0007', 1, 3, NULL,  'emergency',    'en_route',
 0.3476, 32.5825, 'Nakasero Road, Kampala',            'Uchumi Supermarket Nakasero',
 'St. Francis Hospital Nsambya',      0.2960, 32.5912, 'Nsambya Road, Kampala',
 NULL, NOW()-INTERVAL '8 minutes', NULL, NULL, NULL, NULL,
 6.8, NULL, TRUE,  'Pregnant, active labour — 38 weeks', NULL, NULL, 70000, 'unpaid'),

-- 8. Active — at_scene — Paul Okello, driver Agnes Apio
(8,  'AMB-20260509-0008', 8, 4, NULL,  'emergency',    'at_scene',
 0.3020, 32.5950, 'Makindye, Kampala',                 'Makindye Police Barracks Gate',
 'Mulago National Referral Hospital', 0.3406, 32.5699, 'Upper Mulago Hill Road, Kampala',
 NULL, NOW()-INTERVAL '15 minutes', NOW()-INTERVAL '5 minutes', NULL, NULL, NULL,
 7.1, NULL, TRUE,  'Dialysis patient, arteriovenous fistula bleed', NULL, NULL, 65000, 'unpaid'),

-- 9. Requested (unassigned) — Betty Nansubuga
(9,  'AMB-20260510-0009', 9, NULL, NULL, 'emergency',  'requested',
 0.3380, 32.5750, 'Wandegeya, Kampala',                'Wandegeya Market',
 NULL,                                NULL,   NULL,     NULL,
 NULL, NULL, NULL, NULL, NULL, NULL,
 NULL, NULL, FALSE, 'High fever, convulsions', NULL, NULL, NULL, 'unpaid'),

-- 10. Scheduled (future) — John Mugabi, driver Ronald Mukasa
(10, 'AMB-20260512-0010', 10, 1, NULL,  'scheduled',   'assigned',
 0.3200, 32.5820, 'Kololo, Kampala',                   'Kololo Airstrip Road',
 'Mulago National Referral Hospital', 0.3406, 32.5699, 'Upper Mulago Hill Road, Kampala',
 NOW()+INTERVAL '2 days', NOW()-INTERVAL '1 hour', NULL, NULL, NULL, NULL,
 3.5, NULL, FALSE, 'Pre-arranged dialysis transport', NULL, NULL, 40000, 'unpaid'),

-- 11. Completed institutional — Rita Namukasa, driver Ivan Tendo, IFC institution
(11, 'AMB-20260502-0011', 7, 2, 4, 'institutional', 'completed',
 0.3242, 32.5858, 'Rwenzori House, Lumumba Avenue',    'IFC Uganda Office Entrance',
 'Case Medical Centre',               0.3218, 32.5858, 'Plot 67 Lugogo Bypass, Kampala',
 NULL, NOW()-INTERVAL '8 days 2h', NOW()-INTERVAL '8 days 1h 50m', NOW()-INTERVAL '8 days 1h 25m', NULL, NULL,
 1.8, 12, FALSE, 'Employee allergic reaction, anaphylaxis', NULL, NULL, 40000, 'waived'),

-- 12. Completed highway — John Mugabi, driver Agnes Apio
(12, 'AMB-20260425-0012', 10, 4, NULL, 'highway',     'completed',
 0.6500, 32.8000, 'Kampala–Jinja Highway, Lugazi',     'Kakira Sugar Works Junction',
 'Mulago National Referral Hospital', 0.3406, 32.5699, 'Upper Mulago Hill Road, Kampala',
 NULL, NOW()-INTERVAL '15 days 1h', NOW()-INTERVAL '15 days 50m', NOW()-INTERVAL '14 days 23h', NULL, NULL,
 52.7, 90, TRUE,  'RTA victim, head trauma', 'kampala_jinja', 'Lugazi Town Clock', 200000, 'paid');

SELECT setval('bookings_id_seq', 12, true);


-- ============================================================
--  SECTION 6b — BOOKING STATUS HISTORY
--  Manual entries for completed/active bookings
-- ============================================================

INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_id, note)
VALUES
-- Booking 1
(1, 'requested',    'assigned',    1, 'Driver Ronald Mukasa auto-assigned'),
(1, 'assigned',     'en_route',    7, 'Driver confirmed and heading to pickup'),
(1, 'en_route',     'at_scene',    7, 'Driver arrived at Nakasero'),
(1, 'at_scene',     'transporting',7, 'Patient loaded'),
(1, 'transporting', 'completed',   7, 'Dropped at Mulago'),
-- Booking 2
(2, 'requested',    'assigned',    1, 'Driver Ivan Tendo assigned'),
(2, 'assigned',     'en_route',    8, NULL),
(2, 'en_route',     'at_scene',    8, NULL),
(2, 'at_scene',     'transporting',8, NULL),
(2, 'transporting', 'completed',   8, 'Dropped at Case Medical Centre'),
-- Booking 3
(3, 'requested',    'assigned',    1, 'Scheduled booking auto-confirmed'),
(3, 'assigned',     'en_route',    10, NULL),
(3, 'en_route',     'at_scene',    10, NULL),
(3, 'at_scene',     'transporting',10, NULL),
(3, 'transporting', 'completed',   10, 'Post-op transport completed'),
-- Booking 4
(4, 'requested',    'assigned',    1, 'Priority institutional booking'),
(4, 'assigned',     'en_route',    7, NULL),
(4, 'en_route',     'at_scene',    7, NULL),
(4, 'at_scene',     'transporting',7, 'Patient stabilised'),
(4, 'transporting', 'completed',   7, 'Delivered to Mulago'),
-- Booking 5
(5, 'requested',    'assigned',    1, 'Priority highway booking'),
(5, 'assigned',     'en_route',    8, NULL),
(5, 'en_route',     'at_scene',    8, 'Scene at Kajjansi'),
(5, 'at_scene',     'transporting',8, NULL),
(5, 'transporting', 'completed',   8, NULL),
-- Booking 6
(6, 'requested',    'cancelled',   2, 'Patient found own transport'),
-- Booking 7
(7, 'requested',    'assigned',    1, 'Driver Peter Nkosi assigned for neonatal-capable job'),
(7, 'assigned',     'en_route',    9, 'En route to Nakasero'),
-- Booking 8
(8, 'requested',    'assigned',    1, 'Priority assignment'),
(8, 'assigned',     'en_route',    10, NULL),
(8, 'en_route',     'at_scene',    10, 'At Makindye barracks gate'),
-- Booking 10
(10,'requested',    'assigned',    1, 'Scheduled transport pre-confirmed'),
-- Booking 11
(11,'requested',    'assigned',    1, 'Institutional booking IFC'),
(11,'assigned',     'en_route',    8, NULL),
(11,'en_route',     'at_scene',    8, NULL),
(11,'at_scene',     'transporting',8, NULL),
(11,'transporting', 'completed',   8, 'Anaphylaxis stabilised en route'),
-- Booking 12
(12,'requested',    'assigned',    1, 'Highway emergency'),
(12,'assigned',     'en_route',    10, NULL),
(12,'en_route',     'at_scene',    10, 'Scene at Lugazi junction'),
(12,'at_scene',     'transporting',10, NULL),
(12,'transporting', 'completed',   10, 'Delivered to Mulago after 90 min journey');


-- ============================================================
--  SECTION 7 — DRIVER RATINGS
-- ============================================================

INSERT INTO driver_ratings (booking_id, patient_id, driver_id, rating, comment)
VALUES
(1,  1,  1, 5, 'Ronald arrived very quickly and was calm throughout. Excellent driver.'),
(2,  2,  2, 4, 'Ivan was professional. The vehicle was clean and well-equipped.'),
(3,  3,  4, 4, 'Agnes was polite and got me there on time. Thank you!'),
(4,  4,  1, 5, 'Rapid response. Ronald reassured the whole team. Top marks.'),
(5,  6,  2, 5, 'Highway drive was scary but Ivan handled it perfectly. Lives saved.'),
(11, 7,  2, 4, 'Ivan handled the anaphylaxis situation with great care.'),
(12, 10, 4, 3, 'Long trip, Agnes was okay but the ambulance AC stopped working midway.');


-- ============================================================
--  SECTION 8 — NOTIFICATIONS
-- ============================================================

INSERT INTO notifications
    (user_id, event, channel, status, title, body, related_booking_id, is_read, read_at, sent_at)
VALUES
-- Patient notifications
(2, 'booking_created',   'in_app', 'delivered', 'Booking Confirmed',        'Your emergency booking AMB-20260508-0007 has been received.',              7,  TRUE,  NOW()-INTERVAL '8 minutes',  NOW()-INTERVAL '8 minutes'),
(2, 'driver_assigned',   'fcm',    'delivered', 'Driver Assigned',           'Peter Nkosi is on his way — ETA ~12 minutes. Plate: UAL 789C.',             7,  TRUE,  NOW()-INTERVAL '7 minutes',  NOW()-INTERVAL '7 minutes'),
(2, 'driver_en_route',   'sms',    'delivered', 'Driver En Route',           'Your driver has departed. Track on the AmbuLink app.',                      7,  FALSE,  NULL,                        NOW()-INTERVAL '7 minutes'),
(3, 'trip_completed',    'in_app', 'delivered', 'Trip Completed',            'Your ride with Ivan Tendo is complete. Please rate your experience.',        2,  TRUE,  NOW()-INTERVAL '15 days',    NOW()-INTERVAL '15 days'),
(4, 'booking_created',   'fcm',    'delivered', 'Priority Booking Received', 'Emergency booking AMB-20260120-0004 submitted with high priority.',          4,  TRUE,  NOW()-INTERVAL '8 days',     NOW()-INTERVAL '8 days'),
(9, 'booking_created',   'in_app', 'delivered', 'Booking Received',          'We received your emergency request. Finding the nearest driver now.',        9,  FALSE, NULL,                        NOW()-INTERVAL '2 minutes'),
-- Driver notifications
(7, 'booking_created',   'fcm',    'delivered', 'New Emergency Booking',     'Priority booking near Nakasero. Accept now.',                               7,  TRUE,  NOW()-INTERVAL '8 minutes',  NOW()-INTERVAL '8 minutes'),
(10,'booking_created',   'fcm',    'delivered', 'Booking at Makindye',        'Emergency at Makindye Police Barracks. En route.',                          8,  TRUE,  NOW()-INTERVAL '15 minutes', NOW()-INTERVAL '15 minutes'),
-- Admin alerts
(1, 'admin_alert',       'in_app', 'delivered', 'Unassigned Emergency',      'Booking AMB-20260510-0009 has been waiting for 2 minutes with no driver.',   9,  FALSE, NULL,                        NOW()-INTERVAL '1 minute'),
(1, 'admin_alert',       'in_app', 'delivered', 'Driver Suspended',          'Driver Moses Bogere (UAL 654E) has been suspended pending investigation.',   NULL, TRUE, NOW()-INTERVAL '5 days',    NOW()-INTERVAL '5 days'),
-- Institution rep notification
(12,'institution_booking','in_app', 'delivered', 'Institutional Booking Done','Booking for KCCA employee has been completed successfully.',                 4,  TRUE,  NOW()-INTERVAL '8 days',     NOW()-INTERVAL '8 days'),
-- Scheduled reminder
(10,'scheduled_reminder','fcm',    'delivered', 'Upcoming Scheduled Ride',   'Reminder: Your ambulance transport is scheduled for May 12. Driver: Ronald Mukasa.', 10, FALSE, NULL, NOW()-INTERVAL '1 hour');


-- ============================================================
--  SECTION 9 — AUDIT LOGS
-- ============================================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
VALUES
(1, 'CREATE',  'users',       7,    NULL,
    '{"role":"driver","email":"driver.mukasa@ambulink.ug"}',
    '41.210.20.1', 'Mozilla/5.0 Chrome/124 Windows 10'),
(1, 'VERIFY',  'drivers',     1,    '{"status":"pending"}',
    '{"status":"active","verified_at":"2025-11-14T09:00:00Z"}',
    '41.210.20.1', 'Mozilla/5.0 Chrome/124 Windows 10'),
(1, 'APPROVE', 'institutions',1,    '{"status":"pending"}',
    '{"status":"active","reviewed_at":"2025-11-14T10:00:00Z"}',
    '41.210.20.1', 'Mozilla/5.0 Chrome/124 Windows 10'),
(1, 'SUSPEND', 'drivers',     5,    '{"status":"active"}',
    '{"status":"suspended","suspended_reason":"Multiple patient complaints about reckless driving."}',
    '41.210.20.1', 'Mozilla/5.0 Chrome/124 Windows 10'),
(7, 'UPDATE',  'driver_locations', 1, '{"latitude":0.3200,"longitude":32.5800}',
    '{"latitude":0.3476,"longitude":32.5825}',
    '41.210.20.55', 'Dart/3.3 Flutter/3.19'),
(2, 'CANCEL',  'bookings',    6,    '{"status":"requested"}',
    '{"status":"cancelled","cancellation_reason":"Patient found own transport before driver arrived"}',
    '41.210.20.15', 'Dart/3.3 Flutter/3.19'),
(1, 'DELETE',  'sessions',    NULL, '{"reason":"expired_sessions_cleanup"}',
    NULL, '41.210.20.1', 'cron/cleanup_expired_sessions');


-- ============================================================
--  SYNC ALL REMAINING SEQUENCES
-- ============================================================

SELECT setval('sessions_id_seq',            6,  true);
SELECT setval('driver_locations_id_seq',    5,  true);
SELECT setval('institution_reps_id_seq',    4,  true);
SELECT setval('booking_status_history_id_seq', 44, true);
SELECT setval('driver_ratings_id_seq',      7,  true);
SELECT setval('notifications_id_seq',       12, true);
SELECT setval('audit_logs_id_seq',          7,  true);

COMMIT;

-- ============================================================
--  QUICK VERIFICATION QUERIES (run after seeding)
-- ============================================================

-- SELECT COUNT(*) FROM users;               -- expect 20
-- SELECT COUNT(*) FROM patients;            -- expect 10
-- SELECT COUNT(*) FROM drivers;             -- expect 5
-- SELECT COUNT(*) FROM institutions;        -- expect 5
-- SELECT COUNT(*) FROM bookings;            -- expect 12
-- SELECT COUNT(*) FROM driver_ratings;      -- expect 7
-- SELECT COUNT(*) FROM notifications;       -- expect 12
-- SELECT * FROM vw_online_drivers;          -- expect drivers 1,2,4 (active+online)
-- SELECT * FROM vw_booking_overview LIMIT 5;
-- SELECT * FROM vw_daily_stats LIMIT 7;
-- SELECT * FROM sp_find_nearest_driver(0.3476, 32.5825, 20);
-- SELECT * FROM sp_driver_performance(1);

-- ============================================================
--  END OF SEED — AmbuLink v2.0
-- ============================================================