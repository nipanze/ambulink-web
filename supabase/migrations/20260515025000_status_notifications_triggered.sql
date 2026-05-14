-- ============================================================
-- AMBULINK — Real-time Booking Status Notifications
-- ============================================================

-- Function to handle automated notifications on booking status changes
CREATE OR REPLACE FUNCTION public.fn_trig_booking_notifications()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    v_patient_user_id INT;
BEGIN
    -- Get the User ID of the patient
    v_patient_user_id := NEW.patient_id;

    -- Only notify on status changes
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
                -- No specific notification for other statuses
        END CASE;

    END IF;

    RETURN NEW;
END;
$$;

-- Apply the trigger to the bookings table
DROP TRIGGER IF EXISTS trg_booking_status_notifications ON public.bookings;
CREATE TRIGGER trg_booking_status_notifications
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_trig_booking_notifications();
