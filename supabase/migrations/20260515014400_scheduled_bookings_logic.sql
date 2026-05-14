-- ============================================================
-- AMBULINK — Scheduled Booking Processing Logic
-- ============================================================

-- Function to process scheduled bookings that are due for dispatch.
-- This can be called by a CRON job or manually by an admin.
CREATE OR REPLACE FUNCTION public.fn_process_scheduled_bookings()
RETURNS TABLE (processed_booking_id INT, processed_booking_ref VARCHAR, action_taken TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    r RECORD;
    v_driver_id INT;
    v_patient_user_id INT;
BEGIN
    FOR r IN 
        SELECT b.id, b.booking_ref, b.pickup_latitude, b.pickup_longitude, p.user_id as patient_user_id
        FROM public.bookings b
        JOIN public.patients p ON b.patient_id = p.id
        WHERE b.type = 'scheduled' 
          AND b.status = 'requested' 
          AND b.scheduled_at <= (NOW() + INTERVAL '30 minutes')
          AND b.driver_id IS NULL
          AND b.deleted_at IS NULL
    LOOP
        -- Attempt to find the nearest online driver
        -- We use a limit of 50km for matching
        SELECT sp.driver_id INTO v_driver_id 
        FROM public.sp_find_nearest_driver(r.pickup_latitude, r.pickup_longitude, 50.0) sp
        LIMIT 1;

        IF v_driver_id IS NOT NULL THEN
            -- Assign the driver and update status
            UPDATE public.bookings 
            SET driver_id = v_driver_id, 
                status = 'assigned', 
                assigned_at = NOW(),
                updated_at = NOW()
            WHERE id = r.id;
            
            -- Create a notification for the patient
            INSERT INTO public.notifications (user_id, event, title, body, related_booking_id, status)
            VALUES (r.patient_user_id, 'driver_assigned', 'Scheduled Ambulance Assigned', 
                    'A driver has been assigned for your scheduled trip (' || r.booking_ref || '). They are moving to your location.', 
                    r.id, 'pending');
            
            processed_booking_id := r.id;
            processed_booking_ref := r.booking_ref;
            action_taken := 'AUTO_ASSIGNED';
            RETURN NEXT;
        ELSE
            -- No driver found yet, maybe notify admins?
            processed_booking_id := r.id;
            processed_booking_ref := r.booking_ref;
            action_taken := 'NO_DRIVER_AVAILABLE';
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- View to see upcoming scheduled bookings for the Admin Dashboard
CREATE OR REPLACE VIEW public.vw_upcoming_scheduled_bookings AS
SELECT 
    b.id,
    b.booking_ref,
    b.scheduled_at,
    u.first_name || ' ' || u.last_name as patient_name,
    b.pickup_address,
    b.destination_name,
    b.status
FROM public.bookings b
JOIN public.patients p ON b.patient_id = p.id
JOIN public.users u ON p.user_id = u.id
WHERE b.type = 'scheduled' 
  AND b.status = 'requested'
  AND b.scheduled_at > NOW()
  AND b.deleted_at IS NULL
ORDER BY b.scheduled_at ASC;
