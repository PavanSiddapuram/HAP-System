-- ============================================================
-- Seed Data: Doctors and Slots
-- Uses ON CONFLICT DO NOTHING for idempotent re-runs.
-- Uses CURRENT_DATE for always-fresh slot dates.
-- ============================================================

-- Doctors
INSERT INTO doctors (id, name, specialization, is_active)
VALUES
    (1, 'Dr. Sarah Johnson', 'Cardiology', true),
    (2, 'Dr. Michael Chen', 'Dermatology', true),
    (3, 'Dr. Priya Sharma', 'General Medicine', true)
ON CONFLICT (id) DO NOTHING;

-- Reset the sequence so future inserts don't collide
SELECT setval('doctors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM doctors));

-- ============================================================
-- Slots: 6 per doctor × 3 days (today, tomorrow, day after)
-- We delete old unbooked slots and re-insert fresh ones daily.
-- Only unbooked slots from past dates are cleaned up.
-- ============================================================

-- Clean up unbooked slots from past dates
DELETE FROM slots
WHERE slot_date < CURRENT_DATE AND is_booked = false;

-- Doctor 1 - Today
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (1, CURRENT_DATE, '09:00', '09:30', false),
    (1, CURRENT_DATE, '09:30', '10:00', false),
    (1, CURRENT_DATE, '10:00', '10:30', false),
    (1, CURRENT_DATE, '10:30', '11:00', false),
    (1, CURRENT_DATE, '11:00', '11:30', false),
    (1, CURRENT_DATE, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 1 - Tomorrow
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (1, CURRENT_DATE + 1, '09:00', '09:30', false),
    (1, CURRENT_DATE + 1, '09:30', '10:00', false),
    (1, CURRENT_DATE + 1, '10:00', '10:30', false),
    (1, CURRENT_DATE + 1, '10:30', '11:00', false),
    (1, CURRENT_DATE + 1, '11:00', '11:30', false),
    (1, CURRENT_DATE + 1, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 1 - Day after tomorrow
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (1, CURRENT_DATE + 2, '09:00', '09:30', false),
    (1, CURRENT_DATE + 2, '09:30', '10:00', false),
    (1, CURRENT_DATE + 2, '10:00', '10:30', false),
    (1, CURRENT_DATE + 2, '10:30', '11:00', false),
    (1, CURRENT_DATE + 2, '11:00', '11:30', false),
    (1, CURRENT_DATE + 2, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 2 - Today
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (2, CURRENT_DATE, '09:00', '09:30', false),
    (2, CURRENT_DATE, '09:30', '10:00', false),
    (2, CURRENT_DATE, '10:00', '10:30', false),
    (2, CURRENT_DATE, '10:30', '11:00', false),
    (2, CURRENT_DATE, '11:00', '11:30', false),
    (2, CURRENT_DATE, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 2 - Tomorrow
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (2, CURRENT_DATE + 1, '09:00', '09:30', false),
    (2, CURRENT_DATE + 1, '09:30', '10:00', false),
    (2, CURRENT_DATE + 1, '10:00', '10:30', false),
    (2, CURRENT_DATE + 1, '10:30', '11:00', false),
    (2, CURRENT_DATE + 1, '11:00', '11:30', false),
    (2, CURRENT_DATE + 1, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 2 - Day after tomorrow
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (2, CURRENT_DATE + 2, '09:00', '09:30', false),
    (2, CURRENT_DATE + 2, '09:30', '10:00', false),
    (2, CURRENT_DATE + 2, '10:00', '10:30', false),
    (2, CURRENT_DATE + 2, '10:30', '11:00', false),
    (2, CURRENT_DATE + 2, '11:00', '11:30', false),
    (2, CURRENT_DATE + 2, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 3 - Today
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (3, CURRENT_DATE, '09:00', '09:30', false),
    (3, CURRENT_DATE, '09:30', '10:00', false),
    (3, CURRENT_DATE, '10:00', '10:30', false),
    (3, CURRENT_DATE, '10:30', '11:00', false),
    (3, CURRENT_DATE, '11:00', '11:30', false),
    (3, CURRENT_DATE, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 3 - Tomorrow
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (3, CURRENT_DATE + 1, '09:00', '09:30', false),
    (3, CURRENT_DATE + 1, '09:30', '10:00', false),
    (3, CURRENT_DATE + 1, '10:00', '10:30', false),
    (3, CURRENT_DATE + 1, '10:30', '11:00', false),
    (3, CURRENT_DATE + 1, '11:00', '11:30', false),
    (3, CURRENT_DATE + 1, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;

-- Doctor 3 - Day after tomorrow
INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
VALUES
    (3, CURRENT_DATE + 2, '09:00', '09:30', false),
    (3, CURRENT_DATE + 2, '09:30', '10:00', false),
    (3, CURRENT_DATE + 2, '10:00', '10:30', false),
    (3, CURRENT_DATE + 2, '10:30', '11:00', false),
    (3, CURRENT_DATE + 2, '11:00', '11:30', false),
    (3, CURRENT_DATE + 2, '11:30', '12:00', false)
ON CONFLICT (doctor_id, slot_date, start_time, end_time) DO NOTHING;
