-- ============================================================
--  AMBULINK — Smart Ambulance Booking System
--  PostgreSQL Schema v1.0
--  Kampala International University | © 2026
--  Team: Tumusiime Mahad · Mugisha Abdul · Kato Ashraf
--  Supervisor: Mr. Tumwebaze Wilson
-- ============================================================

SET client_encoding = 'UTF8';

-- ============================================================
--  CUSTOM ENUM TYPES
-- ============================================================

CREATE TYPE user_role            AS ENUM ('patient','driver','institution_rep','admin');
CREATE TYPE driver_status        AS ENUM ('pending','active','suspended','deactivated');
CREATE TYPE institution_type     AS ENUM ('hospital','clinic','school','ngo','government','corporate','other');
CREATE TYPE institution_status   AS ENUM ('pending','active','rejected','suspended');
CREATE TYPE booking_type         AS ENUM ('emergency','scheduled','institutional','highway');
CREATE TYPE booking_status       AS ENUM (
    'requested','assigned','en_route','at_scene',
    'transporting','completed','cancelled','expired'
);
CREATE TYPE payment_status       AS ENUM ('unpaid','paid','waived','refunded');
CREATE TYPE vehicle_type         AS ENUM ('basic','advanced','neonatal','bariatric','air');
CREATE TYPE notification_channel AS ENUM ('fcm','sms','in_app');
CREATE TYPE notification_status  AS ENUM ('pending','sent','delivered','failed');
CREATE TYPE notification_event   AS ENUM (
    'booking_created','driver_assigned','driver_en_route',
    'driver_at_scene','trip_completed','booking_cancelled',
    'scheduled_reminder','institution_booking','admin_alert','general'
);
CREATE TYPE road_corridor        AS ENUM (
    'kampala_jinja','kampala_masaka','kampala_mbarara',
    'kampala_gulu','kampala_fort_portal','kampala_mbale','other'
);
CREATE TYPE correction_status    AS ENUM ('pending','in_progress','submitted','verified');


-- ============================================================
--  UTILITY FUNCTION — updated_at auto-stamp
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ============================================================
--  SECTION 1 — USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE users (
    id              SERIAL        PRIMARY KEY,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    first_name      VARCHAR(100)  NOT NULL,
    last_name       VARCHAR(100)  NOT NULL,
    phone           VARCHAR(20)   NOT NULL UNIQUE,
    role            user_role     NOT NULL DEFAULT 'patient',
    fcm_token       TEXT,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    last_login      TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    deleted_by      INT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email   ON users (email);
CREATE INDEX idx_users_phone   ON users (phone);
CREATE INDEX idx_users_role    ON users (role);
CREATE INDEX idx_users_deleted ON users (deleted_at);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


CREATE TABLE sessions (
    id          SERIAL       PRIMARY KEY,
    session_id  VARCHAR(255) NOT NULL UNIQUE,
    user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_info TEXT,
    ip_address  VARCHAR(45),
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_session_id  ON sessions (session_id);
CREATE INDEX idx_sessions_user_expire ON sessions (user_id, expires_at);


-- ============================================================
--  SECTION 2 — DRIVER PROFILES
-- ============================================================

CREATE TABLE drivers (
    id                  SERIAL        PRIMARY KEY,
    user_id             INT           NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    license_number      VARCHAR(50)   NOT NULL UNIQUE,
    vehicle_plate       VARCHAR(20)   NOT NULL UNIQUE,
    vehicle_type        vehicle_type  NOT NULL DEFAULT 'basic',
    vehicle_model       VARCHAR(100),
    vehicle_color       VARCHAR(50),
    coverage_zone       VARCHAR(255),         -- Free-text or GeoJSON zone label
    status              driver_status NOT NULL DEFAULT 'pending',
    is_online           BOOLEAN       NOT NULL DEFAULT FALSE,
    total_trips         INT           NOT NULL DEFAULT 0,
    average_rating      NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
    verified_at         TIMESTAMPTZ,
    verified_by         INT           REFERENCES users(id) ON DELETE SET NULL,
    suspended_reason    TEXT,
    deleted_at          TIMESTAMPTZ,
    deleted_by          INT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_drivers_user_id    ON drivers (user_id);
CREATE INDEX idx_drivers_status     ON drivers (status);
CREATE INDEX idx_drivers_is_online  ON drivers (is_online);
CREATE INDEX idx_drivers_zone       ON drivers (coverage_zone);
CREATE INDEX idx_drivers_deleted    ON drivers (deleted_at);

CREATE TRIGGER trg_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- Real-time GPS positions (high-write, lightweight table)
CREATE TABLE driver_locations (
    id          SERIAL      PRIMARY KEY,
    driver_id   INT         NOT NULL UNIQUE REFERENCES drivers(id) ON DELETE CASCADE,
    latitude    NUMERIC(10,7) NOT NULL,
    longitude   NUMERIC(10,7) NOT NULL,
    heading     NUMERIC(5,2),
    speed_kmh   NUMERIC(6,2),
    accuracy_m  NUMERIC(8,2),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dl_driver    ON driver_locations (driver_id);
CREATE INDEX idx_dl_updated   ON driver_locations (updated_at);
CREATE INDEX idx_dl_online    ON driver_locations (driver_id) WHERE driver_id IS NOT NULL;


-- ============================================================
--  SECTION 3 — INSTITUTIONS
-- ============================================================

CREATE TABLE institutions (
    id              SERIAL             PRIMARY KEY,
    name            VARCHAR(255)       NOT NULL,
    type            institution_type   NOT NULL DEFAULT 'hospital',
    address         TEXT               NOT NULL,
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(255),
    website         VARCHAR(500),
    status          institution_status NOT NULL DEFAULT 'pending',
    reviewed_by     INT                REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    rejection_note  TEXT,
    deleted_at      TIMESTAMPTZ,
    deleted_by      INT,
    created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_institutions_type    ON institutions (type);
CREATE INDEX idx_institutions_status  ON institutions (status);
CREATE INDEX idx_institutions_deleted ON institutions (deleted_at);

CREATE TRIGGER trg_institutions_updated_at
    BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- Staff members who represent an institution on the platform
CREATE TABLE institution_reps (
    id             SERIAL      PRIMARY KEY,
    user_id        INT         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    institution_id INT         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    job_title      VARCHAR(100),
    is_primary     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ireps_user        ON institution_reps (user_id);
CREATE INDEX idx_ireps_institution ON institution_reps (institution_id);


-- ============================================================
--  SECTION 4 — BOOKINGS
-- ============================================================

CREATE TABLE bookings (
    id                  SERIAL          PRIMARY KEY,
    booking_ref         VARCHAR(20)     NOT NULL UNIQUE,       -- e.g. AMB-20260509-0001
    patient_id          INT             NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    driver_id           INT             REFERENCES drivers(id)           ON DELETE SET NULL,
    institution_id      INT             REFERENCES institutions(id)      ON DELETE SET NULL,
    type                booking_type    NOT NULL DEFAULT 'emergency',
    status              booking_status  NOT NULL DEFAULT 'requested',

    -- Pickup
    pickup_latitude     NUMERIC(10,7)   NOT NULL,
    pickup_longitude    NUMERIC(10,7)   NOT NULL,
    pickup_address      TEXT,
    pickup_landmark     TEXT,

    -- Destination
    destination_name    VARCHAR(255),
    destination_latitude  NUMERIC(10,7),
    destination_longitude NUMERIC(10,7),
    destination_address TEXT,

    -- Scheduling
    scheduled_at        TIMESTAMPTZ,                           -- NULL = immediate emergency
    assigned_at         TIMESTAMPTZ,
    pickup_at           TIMESTAMPTZ,                           -- driver arrived at scene
    dropoff_at          TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,

    -- Metrics
    distance_km         NUMERIC(8,3),
    duration_minutes    INT,
    is_priority         BOOLEAN         NOT NULL DEFAULT FALSE,
    patient_notes       TEXT,

    -- Highway-specific
    road_corridor       road_corridor,
    highway_landmark    VARCHAR(255),

    -- Payment
    fare_amount         NUMERIC(10,2),
    payment_status      payment_status  NOT NULL DEFAULT 'unpaid',

    -- Metadata
    version             INT             NOT NULL DEFAULT 1,
    deleted_at          TIMESTAMPTZ,
    deleted_by          INT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bookings_ref         ON bookings (booking_ref);
CREATE INDEX idx_bookings_patient     ON bookings (patient_id);
CREATE INDEX idx_bookings_driver      ON bookings (driver_id);
CREATE INDEX idx_bookings_institution ON bookings (institution_id);
CREATE INDEX idx_bookings_type        ON bookings (type);
CREATE INDEX idx_bookings_status      ON bookings (status);
CREATE INDEX idx_bookings_scheduled   ON bookings (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_bookings_priority    ON bookings (is_priority) WHERE is_priority = TRUE;
CREATE INDEX idx_bookings_created     ON bookings (created_at);
CREATE INDEX idx_bookings_deleted     ON bookings (deleted_at);
CREATE INDEX idx_bookings_status_type ON bookings (status, type);

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- Full status-transition history (audit trail)
CREATE TABLE booking_status_history (
    id            SERIAL          PRIMARY KEY,
    booking_id    INT             NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_status   booking_status,
    to_status     booking_status  NOT NULL,
    actor_id      INT             REFERENCES users(id) ON DELETE SET NULL,
    note          TEXT,
    metadata      JSONB,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_bsh_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) IS NOT NULL)
);
CREATE INDEX idx_bsh_booking    ON booking_status_history (booking_id);
CREATE INDEX idx_bsh_to_status  ON booking_status_history (to_status);
CREATE INDEX idx_bsh_created    ON booking_status_history (created_at);


-- ============================================================
--  SECTION 5 — DRIVER RATINGS
-- ============================================================

CREATE TABLE driver_ratings (
    id          SERIAL      PRIMARY KEY,
    booking_id  INT         NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    patient_id  INT         NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    driver_id   INT         NOT NULL REFERENCES drivers(id)  ON DELETE CASCADE,
    rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dr_driver  ON driver_ratings (driver_id);
CREATE INDEX idx_dr_patient ON driver_ratings (patient_id);
CREATE INDEX idx_dr_rating  ON driver_ratings (rating);


-- ============================================================
--  SECTION 6 — NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id              SERIAL               PRIMARY KEY,
    user_id         INT                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event           notification_event   NOT NULL DEFAULT 'general',
    channel         notification_channel NOT NULL DEFAULT 'in_app',
    status          notification_status  NOT NULL DEFAULT 'pending',
    title           VARCHAR(255)         NOT NULL,
    body            TEXT                 NOT NULL,
    related_booking_id INT               REFERENCES bookings(id) ON DELETE SET NULL,
    fcm_message_id  VARCHAR(255),
    is_read         BOOLEAN              NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    failed_reason   TEXT,
    action_url      VARCHAR(500),
    created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user_unread ON notifications (user_id, is_read, created_at);
CREATE INDEX idx_notif_booking     ON notifications (related_booking_id) WHERE related_booking_id IS NOT NULL;
CREATE INDEX idx_notif_event       ON notifications (event);
CREATE INDEX idx_notif_status      ON notifications (status);


-- ============================================================
--  SECTION 7 — AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id          SERIAL       PRIMARY KEY,
    user_id     INT          REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50)  NOT NULL,
    entity_id   INT,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_al_old CHECK (old_values IS NULL OR jsonb_typeof(old_values) IS NOT NULL),
    CONSTRAINT chk_al_new CHECK (new_values IS NULL OR jsonb_typeof(new_values) IS NOT NULL)
);
CREATE INDEX idx_al_user       ON audit_logs (user_id);
CREATE INDEX idx_al_entity     ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_al_action     ON audit_logs (action);
CREATE INDEX idx_al_created_at ON audit_logs (created_at);


-- ============================================================
--  SECTION 8 — VIEWS
-- ============================================================

-- Full booking overview for admin dispatch
CREATE VIEW vw_booking_overview AS
SELECT
    b.id                                                    AS booking_id,
    b.booking_ref,
    b.type                                                  AS booking_type,
    b.status,
    b.is_priority,
    b.scheduled_at,
    b.assigned_at,
    b.pickup_at,
    b.dropoff_at,
    b.distance_km,
    b.fare_amount,
    b.payment_status,
    b.road_corridor,
    b.highway_landmark,
    -- Patient
    p.id                                                    AS patient_id,
    p.first_name || ' ' || p.last_name                     AS patient_name,
    p.phone                                                 AS patient_phone,
    p.email                                                 AS patient_email,
    -- Pickup
    b.pickup_latitude,
    b.pickup_longitude,
    b.pickup_address,
    -- Destination
    b.destination_name,
    b.destination_address,
    -- Driver
    d.id                                                    AS driver_id,
    du.first_name || ' ' || du.last_name                   AS driver_name,
    du.phone                                                AS driver_phone,
    d.vehicle_plate,
    d.vehicle_type,
    d.vehicle_model,
    dl.latitude                                             AS driver_lat,
    dl.longitude                                            AS driver_lng,
    -- Institution
    i.name                                                  AS institution_name,
    i.type                                                  AS institution_type,
    b.created_at
FROM bookings b
JOIN  users             p  ON b.patient_id    = p.id
LEFT JOIN drivers       d  ON b.driver_id     = d.id
LEFT JOIN users         du ON d.user_id       = du.id
LEFT JOIN driver_locations dl ON d.id         = dl.driver_id
LEFT JOIN institutions  i  ON b.institution_id = i.id
WHERE b.deleted_at IS NULL
ORDER BY b.is_priority DESC, b.created_at DESC;


-- Live online drivers for matching engine
CREATE VIEW vw_online_drivers AS
SELECT
    d.id                                    AS driver_id,
    du.first_name || ' ' || du.last_name   AS driver_name,
    du.phone                                AS driver_phone,
    du.fcm_token,
    d.vehicle_type,
    d.vehicle_plate,
    d.vehicle_model,
    d.coverage_zone,
    d.average_rating,
    d.total_trips,
    dl.latitude,
    dl.longitude,
    dl.heading,
    dl.speed_kmh,
    dl.updated_at                           AS location_updated_at
FROM drivers d
JOIN users           du ON d.user_id  = du.id
JOIN driver_locations dl ON d.id      = dl.driver_id
WHERE d.is_online  = TRUE
  AND d.status     = 'active'
  AND d.deleted_at IS NULL
  AND du.is_active  = TRUE;


-- Patient's own booking history
CREATE VIEW vw_patient_booking_history AS
SELECT
    b.id,
    b.booking_ref,
    b.type,
    b.status,
    b.pickup_address,
    b.destination_name,
    b.destination_address,
    b.scheduled_at,
    b.assigned_at,
    b.pickup_at,
    b.dropoff_at,
    b.distance_km,
    b.fare_amount,
    b.payment_status,
    b.cancellation_reason,
    du.first_name || ' ' || du.last_name  AS driver_name,
    du.phone                               AS driver_phone,
    d.vehicle_plate,
    d.vehicle_type,
    dr.rating                              AS patient_rating,
    dr.comment                             AS patient_comment,
    b.patient_id,
    b.created_at
FROM bookings b
LEFT JOIN drivers d  ON b.driver_id  = d.id
LEFT JOIN users   du ON d.user_id    = du.id
LEFT JOIN driver_ratings dr ON b.id  = dr.booking_id
WHERE b.deleted_at IS NULL
ORDER BY b.created_at DESC;


-- Driver's own trip history and earnings
CREATE VIEW vw_driver_trip_history AS
SELECT
    b.id,
    b.booking_ref,
    b.type,
    b.status,
    b.pickup_address,
    b.destination_name,
    b.pickup_at,
    b.dropoff_at,
    b.distance_km,
    b.duration_minutes,
    b.fare_amount,
    pu.first_name || ' ' || pu.last_name  AS patient_name,
    pu.phone                               AS patient_phone,
    dr.rating                              AS patient_rating,
    dr.comment                             AS patient_comment,
    b.driver_id                            AS booking_driver_id,
    d.user_id                              AS driver_user_id,
    b.created_at
FROM bookings b
JOIN  drivers d  ON b.driver_id = d.id
JOIN  users   pu ON b.patient_id = pu.id
LEFT JOIN driver_ratings dr ON b.id = dr.booking_id
WHERE b.status    = 'completed'
  AND b.deleted_at IS NULL
ORDER BY b.dropoff_at DESC;


-- Pending institution approvals
CREATE VIEW vw_pending_institutions AS
SELECT
    i.id,
    i.name,
    i.type,
    i.address,
    i.contact_phone,
    i.contact_email,
    i.status,
    i.created_at,
    COUNT(ir.id)  AS rep_count
FROM institutions i
LEFT JOIN institution_reps ir ON i.id = ir.institution_id
WHERE i.status    = 'pending'
  AND i.deleted_at IS NULL
GROUP BY i.id
ORDER BY i.created_at;


-- Admin analytics summary (daily)
CREATE VIEW vw_daily_stats AS
SELECT
    DATE(created_at)                                        AS stat_date,
    COUNT(*)                                                AS total_bookings,
    COUNT(*) FILTER (WHERE type = 'emergency')              AS emergency_count,
    COUNT(*) FILTER (WHERE type = 'scheduled')              AS scheduled_count,
    COUNT(*) FILTER (WHERE type = 'institutional')          AS institutional_count,
    COUNT(*) FILTER (WHERE type = 'highway')                AS highway_count,
    COUNT(*) FILTER (WHERE status = 'completed')            AS completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled')            AS cancelled_count,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (assigned_at - created_at)) / 60
    ) FILTER (WHERE assigned_at IS NOT NULL), 2)            AS avg_assignment_minutes,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (dropoff_at - created_at)) / 60
    ) FILTER (WHERE dropoff_at IS NOT NULL), 2)             AS avg_response_minutes,
    ROUND(AVG(distance_km) FILTER (WHERE distance_km IS NOT NULL), 2) AS avg_distance_km,
    ROUND(SUM(fare_amount) FILTER (WHERE payment_status = 'paid'), 2) AS total_revenue
FROM bookings
WHERE deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY stat_date DESC;


-- ============================================================
--  SECTION 9 — TRIGGERS
-- ============================================================

-- Auto-increment booking ref: AMB-YYYYMMDD-NNNN
CREATE OR REPLACE FUNCTION fn_generate_booking_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_date   TEXT;
    v_seq    INT;
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COUNT(*) + 1
    INTO v_seq
    FROM bookings
    WHERE DATE(created_at) = CURRENT_DATE;
    NEW.booking_ref := 'AMB-' || v_date || '-' || LPAD(v_seq::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_ref
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.booking_ref IS NULL OR NEW.booking_ref = '')
EXECUTE FUNCTION fn_generate_booking_ref();


-- Record every status change into booking_status_history
CREATE OR REPLACE FUNCTION fn_booking_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO booking_status_history (booking_id, from_status, to_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_status_history
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_booking_status_history();


-- Increment driver total_trips on completion
CREATE OR REPLACE FUNCTION fn_increment_driver_trips()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.driver_id IS NOT NULL THEN
        UPDATE drivers SET total_trips = total_trips + 1 WHERE id = NEW.driver_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_driver_trips
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_increment_driver_trips();


-- Recalculate driver average_rating after each new rating
CREATE OR REPLACE FUNCTION fn_recalculate_driver_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE drivers
    SET average_rating = (
        SELECT ROUND(AVG(rating)::NUMERIC, 2)
        FROM driver_ratings
        WHERE driver_id = NEW.driver_id
    )
    WHERE id = NEW.driver_id;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_driver_rating_recalc
AFTER INSERT OR UPDATE ON driver_ratings
FOR EACH ROW EXECUTE FUNCTION fn_recalculate_driver_rating();


-- Set driver_id on booking triggers driver to en_route
CREATE OR REPLACE FUNCTION fn_booking_assign_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.driver_id IS NOT NULL AND OLD.driver_id IS NULL THEN
        NEW.assigned_at = NOW();
        NEW.status      = 'assigned';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_assign_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_booking_assign_timestamp();


-- ============================================================
--  SECTION 10 — STORED PROCEDURES & FUNCTIONS
-- ============================================================

-- Clean up expired sessions
CREATE OR REPLACE PROCEDURE cleanup_expired_sessions()
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$;


-- Archive read notifications older than 90 days
CREATE OR REPLACE PROCEDURE archive_old_notifications()
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM notifications
    WHERE is_read  = TRUE
      AND created_at < NOW() - INTERVAL '90 days';
END;
$$;


-- Nearest online driver using Haversine distance (returns driver_id + distance_km)
CREATE OR REPLACE FUNCTION sp_find_nearest_driver(
    p_lat        NUMERIC,
    p_lng        NUMERIC,
    p_max_km     NUMERIC DEFAULT 50
)
RETURNS TABLE (
    driver_id    INT,
    driver_name  TEXT,
    driver_phone VARCHAR,
    fcm_token    TEXT,
    vehicle_type vehicle_type,
    vehicle_plate VARCHAR,
    latitude     NUMERIC,
    longitude    NUMERIC,
    distance_km  NUMERIC
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        vod.driver_id,
        vod.driver_name,
        vod.driver_phone,
        vod.fcm_token,
        vod.vehicle_type,
        vod.vehicle_plate,
        vod.latitude,
        vod.longitude,
        ROUND(
            (6371 * ACOS(
                COS(RADIANS(p_lat)) * COS(RADIANS(vod.latitude)) *
                COS(RADIANS(vod.longitude) - RADIANS(p_lng)) +
                SIN(RADIANS(p_lat)) * SIN(RADIANS(vod.latitude))
            ))::NUMERIC, 3
        ) AS distance_km
    FROM vw_online_drivers vod
    WHERE
        -- Quick bounding-box pre-filter (avoids full table trig on every row)
        vod.latitude  BETWEEN p_lat - (p_max_km / 110.574)
                          AND p_lat + (p_max_km / 110.574)
    AND vod.longitude BETWEEN p_lng - (p_max_km / (111.320 * COS(RADIANS(p_lat))))
                          AND p_lng + (p_max_km / (111.320 * COS(RADIANS(p_lat))))
    -- Exclude drivers already on an active booking
    AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.driver_id = vod.driver_id
          AND b.status IN ('assigned','en_route','at_scene','transporting')
    )
    ORDER BY distance_km ASC
    LIMIT 1;
END;
$$;


-- Full booking details by booking_id
CREATE OR REPLACE FUNCTION sp_get_booking_details(p_booking_id INT)
RETURNS TABLE (
    booking_id          INT,
    booking_ref         VARCHAR,
    type                booking_type,
    status              booking_status,
    is_priority         BOOLEAN,
    pickup_address      TEXT,
    pickup_latitude     NUMERIC,
    pickup_longitude    NUMERIC,
    destination_name    VARCHAR,
    destination_address TEXT,
    scheduled_at        TIMESTAMPTZ,
    assigned_at         TIMESTAMPTZ,
    pickup_at           TIMESTAMPTZ,
    dropoff_at          TIMESTAMPTZ,
    distance_km         NUMERIC,
    fare_amount         NUMERIC,
    payment_status      payment_status,
    patient_name        TEXT,
    patient_phone       VARCHAR,
    driver_name         TEXT,
    driver_phone        VARCHAR,
    vehicle_plate       VARCHAR,
    vehicle_type        vehicle_type,
    institution_name    VARCHAR,
    road_corridor       road_corridor,
    created_at          TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.booking_ref,
        b.type,
        b.status,
        b.is_priority,
        b.pickup_address,
        b.pickup_latitude,
        b.pickup_longitude,
        b.destination_name,
        b.destination_address,
        b.scheduled_at,
        b.assigned_at,
        b.pickup_at,
        b.dropoff_at,
        b.distance_km,
        b.fare_amount,
        b.payment_status,
        pu.first_name || ' ' || pu.last_name,
        pu.phone,
        du.first_name || ' ' || du.last_name,
        du.phone,
        d.vehicle_plate,
        d.vehicle_type,
        i.name,
        b.road_corridor,
        b.created_at
    FROM bookings b
    JOIN  users         pu ON b.patient_id     = pu.id
    LEFT JOIN drivers   d  ON b.driver_id      = d.id
    LEFT JOIN users     du ON d.user_id        = du.id
    LEFT JOIN institutions i ON b.institution_id = i.id
    WHERE b.id = p_booking_id
      AND b.deleted_at IS NULL;
END;
$$;


-- Driver performance summary
CREATE OR REPLACE FUNCTION sp_driver_performance(p_driver_id INT)
RETURNS TABLE (
    driver_id       INT,
    driver_name     TEXT,
    vehicle_plate   VARCHAR,
    vehicle_type    vehicle_type,
    coverage_zone   VARCHAR,
    total_trips     INT,
    average_rating  NUMERIC,
    completed_trips BIGINT,
    cancelled_trips BIGINT,
    total_distance  NUMERIC,
    total_revenue   NUMERIC,
    avg_trip_duration_minutes NUMERIC
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        u.first_name || ' ' || u.last_name,
        d.vehicle_plate,
        d.vehicle_type,
        d.coverage_zone,
        d.total_trips,
        d.average_rating,
        COUNT(b.id) FILTER (WHERE b.status = 'completed'),
        COUNT(b.id) FILTER (WHERE b.status = 'cancelled'),
        ROUND(SUM(b.distance_km) FILTER (WHERE b.status = 'completed'), 2),
        ROUND(SUM(b.fare_amount) FILTER (WHERE b.payment_status = 'paid'), 2),
        ROUND(AVG(b.duration_minutes) FILTER (WHERE b.status = 'completed'), 1)
    FROM drivers d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN bookings b ON b.driver_id = d.id AND b.deleted_at IS NULL
    WHERE d.id = p_driver_id
    GROUP BY d.id, u.first_name, u.last_name, d.vehicle_plate,
             d.vehicle_type, d.coverage_zone, d.total_trips, d.average_rating;
END;
$$;


-- ============================================================
--  RPC HELPERS — Next.js query layer (matches UEMS pattern)
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_query(
    p_sql    TEXT,
    p_params JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_result JSONB;
    n        INTEGER;
BEGIN
    n := COALESCE(jsonb_array_length(p_params), 0);
    IF n = 0 THEN
        EXECUTE 'SELECT COALESCE(jsonb_agg(t),''[]''::jsonb) FROM (' || p_sql || ') t'
        INTO v_result;
    ELSIF n = 1 THEN
        EXECUTE 'SELECT COALESCE(jsonb_agg(t),''[]''::jsonb) FROM (' || p_sql || ') t'
        INTO v_result USING (p_params->>0);
    ELSIF n = 2 THEN
        EXECUTE 'SELECT COALESCE(jsonb_agg(t),''[]''::jsonb) FROM (' || p_sql || ') t'
        INTO v_result USING (p_params->>0),(p_params->>1);
    ELSIF n = 3 THEN
        EXECUTE 'SELECT COALESCE(jsonb_agg(t),''[]''::jsonb) FROM (' || p_sql || ') t'
        INTO v_result USING (p_params->>0),(p_params->>1),(p_params->>2);
    ELSIF n = 4 THEN
        EXECUTE 'SELECT COALESCE(jsonb_agg(t),''[]''::jsonb) FROM (' || p_sql || ') t'
        INTO v_result USING (p_params->>0),(p_params->>1),(p_params->>2),(p_params->>3);
    ELSIF n = 5 THEN
        EXECUTE 'SELECT COALESCE(jsonb_agg(t),''[]''::jsonb) FROM (' || p_sql || ') t'
        INTO v_result USING (p_params->>0),(p_params->>1),(p_params->>2),(p_params->>3),(p_params->>4);
    ELSE
        RAISE EXCEPTION 'execute_query supports up to 5 parameters, got %', n;
    END IF;
    RETURN COALESCE(v_result, '[]'::JSONB);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'execute_query [%]: %', SQLSTATE, SQLERRM;
END;
$function$;


CREATE OR REPLACE FUNCTION public.execute_write(
    p_sql    TEXT,
    p_params JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    n              INTEGER;
    v_result       JSONB;
    has_returning  BOOLEAN;
BEGIN
    n             := COALESCE(jsonb_array_length(p_params), 0);
    has_returning := p_sql ~* '\bRETURNING\b';
    IF has_returning THEN
        IF n = 0 THEN EXECUTE p_sql INTO v_result;
        ELSIF n = 1 THEN EXECUTE p_sql INTO v_result USING (p_params->>0)::text;
        ELSIF n = 2 THEN EXECUTE p_sql INTO v_result USING (p_params->>0)::text,(p_params->>1)::text;
        ELSIF n = 3 THEN EXECUTE p_sql INTO v_result USING (p_params->>0)::text,(p_params->>1)::text,(p_params->>2)::text;
        ELSIF n = 4 THEN EXECUTE p_sql INTO v_result USING (p_params->>0)::text,(p_params->>1)::text,(p_params->>2)::text,(p_params->>3)::text;
        ELSIF n = 5 THEN EXECUTE p_sql INTO v_result USING (p_params->>0)::text,(p_params->>1)::text,(p_params->>2)::text,(p_params->>3)::text,(p_params->>4)::text;
        END IF;
    ELSE
        IF n = 0 THEN EXECUTE p_sql;
        ELSIF n = 1 THEN EXECUTE p_sql USING (p_params->>0)::text;
        ELSIF n = 2 THEN EXECUTE p_sql USING (p_params->>0)::text,(p_params->>1)::text;
        ELSIF n = 3 THEN EXECUTE p_sql USING (p_params->>0)::text,(p_params->>1)::text,(p_params->>2)::text;
        ELSIF n = 4 THEN EXECUTE p_sql USING (p_params->>0)::text,(p_params->>1)::text,(p_params->>2)::text,(p_params->>3)::text;
        ELSIF n = 5 THEN EXECUTE p_sql USING (p_params->>0)::text,(p_params->>1)::text,(p_params->>2)::text,(p_params->>3)::text,(p_params->>4)::text;
        ELSE RAISE EXCEPTION 'execute_write supports up to 5 parameters, got %', n;
        END IF;
    END IF;
    RETURN COALESCE(v_result, '[]'::JSONB);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'execute_write [%]: %', SQLSTATE, SQLERRM;
END;
$function$;


-- ============================================================
--  END OF SCHEMA — AmbuLink v1.0 (PostgreSQL)
--  Kampala International University | © 2026
--  Tumusiime Mahad · Mugisha Abdul · Kato Ashraf
-- ============================================================
