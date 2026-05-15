-- Add 'fare_set' to the allowed notification events
ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'fare_set';
