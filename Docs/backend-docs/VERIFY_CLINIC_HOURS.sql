-- ========================================
-- VERIFY & POPULATE CLINIC HOURS
-- ========================================
-- Run this script to ensure clinic_hours table is properly populated
-- This is critical for time slot generation
-- NOTE: The table needs a UNIQUE constraint on (day_of_week) - add after this

-- Step 1: Check current clinic hours and count duplicates
SELECT 'Current clinic_hours status:' as info;
SELECT 
  day_of_week,
  COUNT(*) as count,
  MAX(is_operating) as is_operating,
  MAX(morning_start) as morning_start,
  MAX(morning_end) as morning_end,
  MAX(afternoon_start) as afternoon_start,
  MAX(afternoon_end) as afternoon_end
FROM clinic_hours
GROUP BY day_of_week
ORDER BY day_of_week;

-- Step 2: Find and remove duplicate entries, keeping only the last one
DELETE FROM clinic_hours WHERE id NOT IN (
  SELECT MAX(id) FROM clinic_hours GROUP BY day_of_week
);

-- Step 3: Clear any invalid entries
DELETE FROM clinic_hours WHERE day_of_week IS NULL OR day_of_week < 0 OR day_of_week > 6;

-- Step 4: Truncate and repopulate to ensure clean state
TRUNCATE TABLE clinic_hours;

-- Step 5: Insert proper clinic hours (0=Monday, 1=Tuesday, ..., 6=Sunday)
INSERT INTO clinic_hours (day_of_week, is_operating, morning_start, morning_end, afternoon_start, afternoon_end, updated_at)
VALUES
  (0, true, '09:00:00'::time, '12:00:00'::time, '14:00:00'::time, '17:00:00'::time, NOW()),  -- Monday
  (1, true, '09:00:00'::time, '12:00:00'::time, '14:00:00'::time, '17:00:00'::time, NOW()),  -- Tuesday
  (2, true, '09:00:00'::time, '12:00:00'::time, '14:00:00'::time, '17:00:00'::time, NOW()),  -- Wednesday
  (3, true, '09:00:00'::time, '12:00:00'::time, '14:00:00'::time, '17:00:00'::time, NOW()),  -- Thursday
  (4, true, '09:00:00'::time, '12:00:00'::time, '14:00:00'::time, '17:00:00'::time, NOW()),  -- Friday
  (5, true, '09:00:00'::time, '13:00:00'::time, NULL::time, NULL::time, NOW()),              -- Saturday (morning only)
  (6, false, NULL::time, NULL::time, NULL::time, NULL::time, NOW());                         -- Sunday (closed)

-- Step 6: Add UNIQUE constraint if not exists (optional - helps prevent duplicates)
-- ALTER TABLE clinic_hours ADD CONSTRAINT clinic_hours_day_of_week_unique UNIQUE (day_of_week);

-- Step 7: Verify after populate
SELECT '✅ After populate - clinic_hours:' as info;
SELECT 
  id,
  day_of_week,
  CASE day_of_week 
    WHEN 0 THEN 'Monday'
    WHEN 1 THEN 'Tuesday'
    WHEN 2 THEN 'Wednesday'
    WHEN 3 THEN 'Thursday'
    WHEN 4 THEN 'Friday'
    WHEN 5 THEN 'Saturday'
    WHEN 6 THEN 'Sunday'
  END as day_name,
  is_operating,
  morning_start,
  morning_end,
  afternoon_start,
  afternoon_end
FROM clinic_hours
ORDER BY day_of_week;

-- Step 8: Check services
SELECT '📋 Services:' as info;
SELECT COUNT(*) as services_count FROM dental_services;
SELECT id, name, price FROM dental_services LIMIT 10;

-- Step 9: Check time slots
SELECT '⏰ Time slots:' as info;
SELECT COUNT(*) as total_time_slots FROM time_slots;
SELECT 
  service_id,
  COUNT(*) as count_for_service,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM time_slots
GROUP BY service_id
LIMIT 10;
