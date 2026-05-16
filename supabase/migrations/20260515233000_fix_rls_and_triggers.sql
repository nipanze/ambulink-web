-- ============================================================
-- AMBULINK — Fix RLS Policies and Triggers
-- ============================================================

-- 1. Utility function to get public user role from auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS public.user_role AS $$
    SELECT role FROM public.users 
    WHERE email = (SELECT email FROM auth.users WHERE id = p_user_id);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;


-- 2. Update Booking Status History Trigger (Fixes RLS violation on dispatch)
-- Adding SECURITY DEFINER ensures the trigger can write to the history table 
-- even if the session user has restricted RLS access.
CREATE OR REPLACE FUNCTION public.fn_booking_status_history()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            INSERT INTO public.booking_status_history (booking_id, from_status, to_status)
            VALUES (NEW.id, OLD.status, NEW.status);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


-- 3. Fix Notification Trigger (Fixes column mismatch 'type' -> 'event')
CREATE OR REPLACE FUNCTION public.fn_trig_booking_notifications()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_patient_user_id INT;
BEGIN
    -- Get the User ID of the patient
    v_patient_user_id := NEW.patient_id;

    -- 1. Notify on status changes
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        CASE NEW.status
            WHEN 'assigned' THEN
                INSERT INTO public.notifications (user_id, event, title, body, related_booking_id)
                VALUES (v_patient_user_id, 'driver_assigned', 'Driver Assigned!', 'A driver has been assigned to your request (' || NEW.booking_ref || ') and is now heading your way.', NEW.id);
            WHEN 'en_route' THEN
                INSERT INTO public.notifications (user_id, event, title, body, related_booking_id)
                VALUES (v_patient_user_id, 'driver_en_route', 'Ambulance on the Way', 'Your ambulance is moving towards your location. Please stay reachable.', NEW.id);
            WHEN 'at_scene' THEN
                INSERT INTO public.notifications (user_id, event, title, body, related_booking_id)
                VALUES (v_patient_user_id, 'driver_at_scene', 'Ambulance Arrived!', 'Your ambulance has arrived at the pickup location. Please gather your essentials.', NEW.id);
            WHEN 'completed' THEN
                INSERT INTO public.notifications (user_id, event, title, body, related_booking_id)
                VALUES (v_patient_user_id, 'trip_completed', 'Trip Finished', 'We hope you are safe. Your trip has been marked as completed. Thank you for choosing AmbuLink.', NEW.id);
            WHEN 'cancelled' THEN
                INSERT INTO public.notifications (user_id, event, title, body, related_booking_id)
                VALUES (v_patient_user_id, 'booking_cancelled', 'Booking Cancelled', 'Your booking has been cancelled. Reason: ' || COALESCE(NEW.cancellation_reason, 'Not specified'), NEW.id);
            ELSE
                -- No action for other statuses
        END CASE;
    END IF;

    -- 2. Notify on fare changes (from NULL to a value)
    IF (OLD.fare_amount IS NULL AND NEW.fare_amount IS NOT NULL) THEN
        INSERT INTO public.notifications (user_id, event, title, body, related_booking_id)
        VALUES (v_patient_user_id, 'fare_set', 'Price Updated! 💰', 'Your trip price has been set to UGX ' || NEW.fare_amount || '. Please review and confirm your booking.', NEW.id);
    END IF;

    RETURN NEW;
END;
$$;


-- 4. Enable RLS and define Policies for booking_status_history
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all status history" ON public.booking_status_history;
CREATE POLICY "Admins can view all status history"
ON public.booking_status_history FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can insert status history" ON public.booking_status_history;
CREATE POLICY "Admins can insert status history"
ON public.booking_status_history FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Also allow the system/postgres user (bypass RLS is default, but for clarity)
-- Note: Security Definer triggers bypass RLS by running as the owner.


-- 5. Ensure Bookings has proper RLS for admins
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
CREATE POLICY "Admins can manage all bookings"
ON public.bookings FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Add policy for patients to read their own bookings
DROP POLICY IF EXISTS "Patients can view own bookings" ON public.bookings;
CREATE POLICY "Patients can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'))
);
