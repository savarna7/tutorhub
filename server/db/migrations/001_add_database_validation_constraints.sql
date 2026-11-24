
BEGIN;

-- 1. Validate tutor experience
ALTER TABLE public.tutors
ADD CONSTRAINT tutors_experience_years_check
CHECK (experience_years >= 0 AND experience_years <= 60);

-- 2. Restrict booking durations
ALTER TABLE public.bookings
DROP CONSTRAINT bookings_duration_minutes_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_duration_minutes_check
CHECK (duration_minutes IN (30, 60, 90, 120));

-- 3. Ensure booking end time matches duration
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_session_time_check
CHECK (
    session_end > session_start
    AND session_end = session_start
        + duration_minutes * INTERVAL '1 minute'
);

COMMIT;
