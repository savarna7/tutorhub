
BEGIN;

-- Limit tutor biography to 1000 characters.
ALTER TABLE public.tutors
ADD CONSTRAINT tutors_bio_length_check
CHECK (
    bio IS NULL OR CHAR_LENGTH(BTRIM(bio)) <= 1000
);

-- Limit student learning goals to 1000 characters.
ALTER TABLE public.students
ADD CONSTRAINT students_learning_goals_length_check
CHECK (
    learning_goals IS NULL
    OR CHAR_LENGTH(BTRIM(learning_goals)) <= 1000
);

COMMIT;
