-- ================================================================
-- SMILE CARE SYSTEM - POPULATE SAMPLE DATA FOR BOOKING
-- Run this in Supabase SQL Editor to populate test data
-- ================================================================

-- Step 1: Clear any existing sample data (OPTIONAL - only if starting fresh)
-- DELETE FROM appointments;
-- DELETE FROM time_slots;
-- DELETE FROM dental_services;
-- DELETE FROM clinic_hours;

-- ================================================================
-- CREATE SAMPLE SERVICES (if not already present)
-- ================================================================
INSERT INTO dental_services (name, description, duration, price, icon, created_at) 
VALUES
  ('Cleaning', 'Professional dental cleaning and hygiene', '30 min', '$75', '🪥', NOW()),
  ('Filling', 'Tooth filling procedure', '45 min', '$150', '🔧', NOW()),
  ('Root Canal', 'Root canal treatment', '60 min', '$300', '🦷', NOW()),
  ('Whitening', 'Professional teeth whitening service', '45 min', '$200', '✨', NOW())
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- SET UP CLINIC OPERATING HOURS
-- Days: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
-- ================================================================
DELETE FROM clinic_hours;

INSERT INTO clinic_hours 
(day_of_week, is_operating, morning_start, morning_end, afternoon_start, afternoon_end, updated_at) 
VALUES
  (0, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Monday: Open
  (1, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Tuesday: Open
  (2, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Wednesday: Open
  (3, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Thursday: Open
  (4, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Friday: Open
  (5, true,  '09:00'::time, '13:00'::time, NULL, NULL, NOW()),                    -- Saturday: Morning Only (9am-1pm)
  (6, false, NULL, NULL, NULL, NULL, NOW());                                       -- Sunday: Closed

-- ================================================================
-- CREATE AVAILABLE TIME SLOTS (14 days ahead)
-- Slots are created for:
--   - Morning: 9:00-10:00
--   - Afternoon: 14:00-15:00
-- Sundays are excluded (day_of_week = 0 in ISO standard)
-- ================================================================

-- First, get all service IDs
WITH service_ids AS (
  SELECT id FROM dental_services ORDER BY id
),
-- Generate 14 days starting tomorrow
dates AS (
  SELECT (CURRENT_DATE + (i * interval '1 day'))::date AS slot_date
  FROM GENERATE_SERIES(1, 14) AS i
  -- Exclude Sundays (EXTRACT(DOW) = 0 means Sunday in ISO 8601)
  WHERE EXTRACT(DOW FROM CURRENT_DATE + (i * interval '1 day')) != 0
)
-- Insert morning slots (9:00-10:00)
INSERT INTO time_slots (service_id, date, start_time, end_time, status, created_at)
SELECT s.id, d.slot_date, '09:00'::time, '10:00'::time, 'AVAILABLE'::varchar, NOW()
FROM service_ids s CROSS JOIN dates d

UNION ALL

-- Insert afternoon slots (14:00-15:00)
SELECT s.id, d.slot_date, '14:00'::time, '15:00'::time, 'AVAILABLE'::varchar, NOW()
FROM service_ids s CROSS JOIN dates d;

-- ================================================================
-- VERIFICATION QUERIES - Run these to confirm data was created
-- ================================================================

-- View 1: Count total services
SELECT 'SERVICES' AS section, COUNT(*) AS total FROM dental_services;

-- View 2: Verify clinic hours are configured
SELECT 
  day_of_week,
  CASE 
    WHEN day_of_week = 0 THEN 'Monday'
    WHEN day_of_week = 1 THEN 'Tuesday'
    WHEN day_of_week = 2 THEN 'Wednesday'
    WHEN day_of_week = 3 THEN 'Thursday'
    WHEN day_of_week = 4 THEN 'Friday'
    WHEN day_of_week = 5 THEN 'Saturday'
    WHEN day_of_week = 6 THEN 'Sunday'
  END AS day_name,
  is_operating,
  morning_start,
  morning_end,
  afternoon_start,
  afternoon_end
FROM clinic_hours
ORDER BY day_of_week;

-- View 3: Time slots summary by service
SELECT 
  'TIME SLOTS' AS section,
  ds.name AS service_name,
  COUNT(*) AS available_slots,
  MIN(ts.date) AS first_date,
  MAX(ts.date) AS last_date
FROM time_slots ts
JOIN dental_services ds ON ts.service_id = ds.id
WHERE ts.status = 'AVAILABLE' 
  AND ts.date >= CURRENT_DATE
GROUP BY ds.name
ORDER BY ds.name;

-- View 4: Sample of available time slots (next 10)
SELECT 
  ds.name AS service,
  ts.date,
  ts.start_time,
  ts.end_time,
  ts.status,
  CASE 
    WHEN EXTRACT(DOW FROM ts.date) = 0 THEN 'Sunday'
    WHEN EXTRACT(DOW FROM ts.date) = 1 THEN 'Monday'
    WHEN EXTRACT(DOW FROM ts.date) = 2 THEN 'Tuesday'
    WHEN EXTRACT(DOW FROM ts.date) = 3 THEN 'Wednesday'
    WHEN EXTRACT(DOW FROM ts.date) = 4 THEN 'Thursday'
    WHEN EXTRACT(DOW FROM ts.date) = 5 THEN 'Friday'
    WHEN EXTRACT(DOW FROM ts.date) = 6 THEN 'Saturday'
  END AS day_name
FROM time_slots ts
JOIN dental_services ds ON ts.service_id = ds.id
WHERE ts.status = 'AVAILABLE' AND ts.date >= CURRENT_DATE
ORDER BY ts.date, ts.start_time
LIMIT 10;

-- ================================================================
-- EXPECTED OUTPUT
-- ================================================================
-- Clinic should have:
--   Services: 4 (Cleaning, Filling, Root Canal, Whitening)
--   Total Time Slots: 104+ (14 days × 4 services × 2 slots/day, minus Sundays and Saturday afternoons)
--   Each service: 26 available slots (13 days × 2 slots, with Saturday having 1 slot)
