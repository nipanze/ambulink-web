-- Fix booking inserts on schemas where bookings.patient_id references patients.id.
-- The trigger runs on INSERT and UPDATE, so it must not read OLD on INSERT.
CREATE OR REPLACE FUNCTION public.fn_update_patient_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
        UPDATE public.patients SET
            total_bookings  = (SELECT COUNT(*) FROM public.bookings WHERE patient_id = NEW.patient_id AND deleted_at IS NULL),
            total_completed = (SELECT COUNT(*) FROM public.bookings WHERE patient_id = NEW.patient_id AND status = 'completed' AND deleted_at IS NULL),
            total_cancelled = (SELECT COUNT(*) FROM public.bookings WHERE patient_id = NEW.patient_id AND status = 'cancelled' AND deleted_at IS NULL)
        WHERE id = NEW.patient_id;
    END IF;
    RETURN NEW;
END;
$$;
