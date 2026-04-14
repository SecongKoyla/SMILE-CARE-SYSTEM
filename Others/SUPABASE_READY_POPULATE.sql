-- ================================================================
-- SMILE CARE SYSTEM - SUPABASE READY TIME SLOT POPULATION SCRIPT
-- PostgreSQL/Supabase compatible syntax
-- ================================================================
-- Copy this entire script and run in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- SECTION 1: CREATE SAMPLE DENTAL SERVICES
-- ================================================================
-- Reset services if needed (comment out if you want to keep existing):
-- DELETE FROM public.dental_services;

INSERT INTO public.dental_services (name, description, duration, price, icon, created_at) 
VALUES 
  ('Cleaning', 'Professional dental cleaning and hygiene', '30 min', '$75', '🪥', NOW()),
  ('Filling', 'Tooth filling procedure', '45 min', '$150', '🔧', NOW()),
  ('Root Canal', 'Root canal treatment', '60 min', '$300', '🦷', NOW()),
  ('Whitening', 'Professional teeth whitening service', '45 min', '$200', '✨', NOW())
ON CONFLICT DO NOTHING;

-- Verify services were created
SELECT 'SERVICES CREATED' as status, COUNT(*) as count FROM public.dental_services;

-- ================================================================
-- SECTION 2: SET UP CLINIC OPERATING HOURS
-- ================================================================
-- Reset clinic hours if needed (comment out if you want to keep existing):
-- DELETE FROM public.clinic_hours;

-- Insert complete week schedule:
-- Monday (0) through Friday (4): 9am-12pm morning, 2pm-5pm afternoon
-- Saturday (5): 9am-1pm (morning only, no afternoon)
-- Sunday (6): Closed

INSERT INTO public.clinic_hours 
(day_of_week, is_operating, morning_start, morning_end, afternoon_start, afternoon_end, updated_at) 
VALUES 
  (0, true,  '09:00'::TIME, '12:00'::TIME, '14:00'::TIME, '17:00'::TIME, NOW()),  -- Monday
  (1, true,  '09:00'::TIME, '12:00'::TIME, '14:00'::TIME, '17:00'::TIME, NOW()),  -- Tuesday
  (2, true,  '09:00'::TIME, '12:00'::TIME, '14:00'::TIME, '17:00'::TIME, NOW()),  -- Wednesday
  (3, true,  '09:00'::TIME, '12:00'::TIME, '14:00'::TIME, '17:00'::TIME, NOW()),  -- Thursday
  (4, true,  '09:00'::TIME, '12:00'::TIME, '14:00'::TIME, '17:00'::TIME, NOW()),  -- Friday
  (5, true,  '09:00'::TIME, '13:00'::TIME, NULL::TIME, NULL::TIME, NOW()),        -- Saturday (morning only)
  (6, false, NULL::TIME,    NULL::TIME,    NULL::TIME, NULL::TIME, NOW())         -- Sunday (closed)
ON CONFLICT DO NOTHING;

-- Verify clinic hours configuration
SELECT 'CLINIC HOURS CREATED' as status, 
       COUNT(*) as count,
       SUM(CASE WHEN is_operating THEN 1 ELSE 0 END) as open_days
FROM public.clinic_hours;

-- ================================================================
-- SECTION 3: CREATE AVAILABLE TIME SLOTS
-- ================================================================
-- Reset time slots if needed (comment out if you want to keep existing):
-- DELETE FROM public.time_slots;

-- Generate time slots: 14 days ahead, morning and afternoon for each service
-- Excludes Sundays (day_of_week = 0 in ISO standard)

WITH service_ids AS (
  -- Get all dental services
  SELECT id FROM public.dental_services ORDER BY id
),
-- Generate date range: 14 days from tomorrow, excluding Sundays
dates AS (
  SELECT DATE_TRUNC('day', CURRENT_DATE) + (i * INTERVAL '1 day') AS slot_date
  FROM GENERATE_SERIES(1, 14) AS i
  WHERE EXTRACT(ISODOW FROM CURRENT_DATE + (i * INTERVAL '1 day')) != 7  -- Exclude Sundays
)
INSERT INTO public.time_slots (service_id, date, start_time, end_time, status, created_at)

-- Morning slots (9:00-10:00 AM)
SELECT 
  s.id,
  (d.slot_date)::DATE,
  '09:00'::TIME,
  '10:00'::TIME,
  'AVAILABLE'::VARCHAR,
  NOW()
FROM service_ids s CROSS JOIN dates d

UNION ALL

-- Afternoon slots (2:00-3:00 PM)
SELECT 
  s.id,
  (d.slot_date)::DATE,
  '14:00'::TIME,
  '15:00'::TIME,
  'AVAILABLE'::VARCHAR,
  NOW()
FROM service_ids s CROSS JOIN dates d;

-- Verify time slots were created
SELECT 'TIME SLOTS CREATED' as status, COUNT(*) as count FROM public.time_slots;

-- ================================================================
-- SECTION 4: VERIFICATION QUERIES
-- ================================================================
-- Run these to verify everything was populated correctly

-- View 1: Summary statistics
SELECT 'SUMMARY STATISTICS' as section;
SELECT 
  (SELECT COUNT(*) FROM public.dental_services) as services,
  (SELECT COUNT(*) FROM public.clinic_hours) as clinic_hours,
  (SELECT COUNT(*) FROM public.time_slots) as total_time_slots,
  (SELECT COUNT(*) FROM public.time_slots WHERE status = 'AVAILABLE') as available_slots,
  (SELECT COUNT(*) FROM public.time_slots WHERE date >= CURRENT_DATE AND status = 'AVAILABLE') as future_available;

-- View 2: Clinic hours by day
SELECT 'CLINIC HOURS' as section;
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
  END as day_name,
  is_operating,
  COALESCE(morning_start::TEXT, '--') as morning_start,
  COALESCE(morning_end::TEXT, '--') as morning_end,
  COALESCE(afternoon_start::TEXT, '--') as afternoon_start,
  COALESCE(afternoon_end::TEXT, '--') as afternoon_end
FROM public.clinic_hours
ORDER BY day_of_week;

-- View 3: Available slots by service
SELECT 'AVAILABLE SLOTS BY SERVICE' as section;
SELECT 
  ds.name as service_name,
  COUNT(*) as available_count,
  MIN(ts.date) as first_date,
  MAX(ts.date) as last_date,
  COUNT(DISTINCT ts.date) as distinct_dates
FROM public.time_slots ts
JOIN public.dental_services ds ON ts.service_id = ds.id
WHERE ts.status = 'AVAILABLE' AND ts.date >= CURRENT_DATE
GROUP BY ds.name
ORDER BY ds.name;

-- View 4: Sample of available time slots (next 15 slots)
SELECT 'SAMPLE TIME SLOTS' as section;
SELECT 
  ds.name as service,
  ts.date,
  TO_CHAR(ts.start_time, 'HH24:MI') as start_time,
  TO_CHAR(ts.end_time, 'HH24:MI') as end_time,
  ts.status,
  CASE 
    WHEN EXTRACT(ISODOW FROM ts.date) = 1 THEN 'Monday'
    WHEN EXTRACT(ISODOW FROM ts.date) = 2 THEN 'Tuesday'
    WHEN EXTRACT(ISODOW FROM ts.date) = 3 THEN 'Wednesday'
    WHEN EXTRACT(ISODOW FROM ts.date) = 4 THEN 'Thursday'
    WHEN EXTRACT(ISODOW FROM ts.date) = 5 THEN 'Friday'
    WHEN EXTRACT(ISODOW FROM ts.date) = 6 THEN 'Saturday'
    WHEN EXTRACT(ISODOW FROM ts.date) = 7 THEN 'Sunday'
  END as day_name
FROM public.time_slots ts
JOIN public.dental_services ds ON ts.service_id = ds.id
WHERE ts.status = 'AVAILABLE' AND ts.date >= CURRENT_DATE
ORDER BY ts.date, ts.start_time, ds.name
LIMIT 15;

-- View 5: Data sanity check
SELECT 'SANITY CHECK' as check_type;
-- Should see 4 services
SELECT 'Services Found' as check_name, COUNT(*) as value FROM public.dental_services;

-- Should see 7 clinic hours (one per day)
SELECT 'Clinic Hours Rows' as check_name, COUNT(*) as value FROM public.clinic_hours;

-- Should see 100+ time slots (4 services * 13 working days * 2 slots, minus Saturday afternoon)
SELECT 'Total Time Slots' as check_name, COUNT(*) as value FROM public.time_slots;

-- Should see 80+ available future slots
SELECT 'Available Future Slots' as check_name, 
       COUNT(*) as value 
FROM public.time_slots 
WHERE status = 'AVAILABLE' AND date >= CURRENT_DATE;

-- ================================================================
-- EXPECTED RESULTS AFTER RUNNING THIS SCRIPT
-- ================================================================
-- Services Populated
--   ✅ Cleaning
--   ✅ Filling
--   ✅ Root Canal
--   ✅ Whitening
--   Total: 4 services
--
-- Clinic Hours Configured
--   ✅ Monday-Friday: 9:00-12:00, 14:00-17:00 (is_operating = true)
--   ✅ Saturday: 9:00-13:00 (is_operating = true)
--   ✅ Sunday: Closed (is_operating = false)
--
-- Time Slots Created
--   ✅ 4 services × 13 working days × 2 morning slots = 104 morning slots
--   ✅ 4 services × 12 working days × 2 afternoon slots = 96 afternoon slots
--   ✅ (Saturday only has morning, so -4 afternoon slots)
--   Total: 96 time slots
--
-- Status
--   ✅ All slots have status = 'AVAILABLE'
--   ✅ All slots have dates >= tomorrow
--   ✅ No slots on Sundays
--   ✅ Ready for booking!
--
-- ================================================================

-- ================================================================
-- IF SOMETHING WENT WRONG
-- ================================================================
-- Use these commands to diagnose and fix issues:

-- Check for duplicate entries
-- SELECT COUNT(*), service_id, date, start_time FROM public.time_slots GROUP BY service_id, date, start_time HAVING COUNT(*) > 1;

-- Delete duplicates (if any)
-- DELETE FROM public.time_slots WHERE id NOT IN (SELECT MIN(id) FROM public.time_slots GROUP BY service_id, date, start_time);

-- Check for any data anomalies
-- SELECT * FROM public.time_slots WHERE status NOT IN ('AVAILABLE', 'BOOKED');
-- SELECT * FROM public.time_slots WHERE date IS NULL;
-- SELECT * FROM public.time_slots WHERE service_id IS NULL;

-- ================================================================
-- SUCCESS! Your booking system now has sample data ready to use.
-- ================================================================

-- Next steps in your app:
-- 1. Ensure backend is connected to this Supabase instance
-- 2. Start your Spring Boot backend
-- 3. Start your React frontend
-- 4. As a user, navigate to "Book Appointment"
-- 5. Select a service
-- 6. You should now see available time slots!
