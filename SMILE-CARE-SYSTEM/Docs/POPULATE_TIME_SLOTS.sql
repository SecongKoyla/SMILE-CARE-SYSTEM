-- SMILE CARE - Populate Time Slots Database
-- Run this SQL script in your Supabase SQL Editor to create test time slots

-- First, verify services exist
SELECT id, name FROM public.dental_services LIMIT 5;

-- Check current time slots
SELECT COUNT(*) as total_slots, 
       COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_slots,
       COUNT(CASE WHEN date >= CURRENT_DATE THEN 1 END) as future_slots
FROM public.time_slots;

-- Delete any old/past time slots to test fresh
DELETE FROM public.time_slots 
WHERE date < CURRENT_DATE;

-- =====================================================
-- INSERT SAMPLE TIME SLOTS FOR NEXT 30 DAYS
-- =====================================================

-- Insert 4 slots per day for Service 1 (Cleaning)
-- For the next 30 days (excluding Sundays)
INSERT INTO public.time_slots (date, start_time, end_time, status, service_id, created_at)
SELECT 
  d.date,
  s.start_time::time,
  s.end_time::time,
  'AVAILABLE',
  1,  -- Service ID 1 = Cleaning
  NOW()
FROM (
  -- Generate dates for next 30 days
  SELECT CURRENT_DATE + GENERATE_SERIES(0, 30) * INTERVAL '1 day' as date
) d,
(
  -- Morning and afternoon slots
  SELECT '09:00' as start_time, '10:00' as end_time UNION
  SELECT '10:00' as start_time, '11:00' as end_time UNION
  SELECT '14:00' as start_time, '15:00' as end_time UNION
  SELECT '15:00' as start_time, '16:00' as end_time
) s
WHERE 
  -- Exclude Sundays (EXTRACT(DOW FROM date) = 0 is Sunday)
  EXTRACT(DOW FROM d.date) != 0
  -- Exclude duplicates (in case this runs multiple times)
  AND NOT EXISTS (
    SELECT 1 FROM public.time_slots ts 
    WHERE ts.date = d.date 
    AND ts.start_time = s.start_time::time
    AND ts.service_id = 1
  )
ON CONFLICT DO NOTHING;

-- Insert 4 slots per day for Service 2 (Dental Check-up)
INSERT INTO public.time_slots (date, start_time, end_time, status, service_id, created_at)
SELECT 
  d.date,
  s.start_time::time,
  s.end_time::time,
  'AVAILABLE',
  2,  -- Service ID 2 = Dental Check-up
  NOW()
FROM (
  SELECT CURRENT_DATE + GENERATE_SERIES(0, 30) * INTERVAL '1 day' as date
) d,
(
  SELECT '09:00' as start_time, '10:00' as end_time UNION
  SELECT '10:00' as start_time, '11:00' as end_time UNION
  SELECT '14:00' as start_time, '15:00' as end_time UNION
  SELECT '15:00' as start_time, '16:00' as end_time
) s
WHERE 
  EXTRACT(DOW FROM d.date) != 0
  AND NOT EXISTS (
    SELECT 1 FROM public.time_slots ts 
    WHERE ts.date = d.date 
    AND ts.start_time = s.start_time::time
    AND ts.service_id = 2
  )
ON CONFLICT DO NOTHING;

-- Insert 4 slots per day for Service 3 (Root Canal)
INSERT INTO public.time_slots (date, start_time, end_time, status, service_id, created_at)
SELECT 
  d.date,
  s.start_time::time,
  s.end_time::time,
  'AVAILABLE',
  3,  -- Service ID 3 = Root Canal
  NOW()
FROM (
  SELECT CURRENT_DATE + GENERATE_SERIES(0, 30) * INTERVAL '1 day' as date
) d,
(
  SELECT '09:00' as start_time, '10:00' as end_time UNION
  SELECT '10:00' as start_time, '11:00' as end_time UNION
  SELECT '14:00' as start_time, '15:00' as end_time UNION
  SELECT '15:00' as start_time, '16:00' as end_time
) s
WHERE 
  EXTRACT(DOW FROM d.date) != 0
  AND NOT EXISTS (
    SELECT 1 FROM public.time_slots ts 
    WHERE ts.date = d.date 
    AND ts.start_time = s.start_time::time
    AND ts.service_id = 3
  )
ON CONFLICT DO NOTHING;

-- Insert 4 slots per day for Service 4 (Orthodontics)
INSERT INTO public.time_slots (date, start_time, end_time, status, service_id, created_at)
SELECT 
  d.date,
  s.start_time::time,
  s.end_time::time,
  'AVAILABLE',
  4,  -- Service ID 4 = Orthodontics
  NOW()
FROM (
  SELECT CURRENT_DATE + GENERATE_SERIES(0, 30) * INTERVAL '1 day' as date
) d,
(
  SELECT '09:00' as start_time, '10:00' as end_time UNION
  SELECT '10:00' as start_time, '11:00' as end_time UNION
  SELECT '14:00' as start_time, '15:00' as end_time UNION
  SELECT '15:00' as start_time, '16:00' as end_time
) s
WHERE 
  EXTRACT(DOW FROM d.date) != 0
  AND NOT EXISTS (
    SELECT 1 FROM public.time_slots ts 
    WHERE ts.date = d.date 
    AND ts.start_time = s.start_time::time
    AND ts.service_id = 4
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Count total slots created
SELECT COUNT(*) as total_slots_created FROM public.time_slots;

-- Show slots by service
SELECT 
  s.name,
  COUNT(*) as slot_count,
  MIN(ts.date) as earliest_date,
  MAX(ts.date) as latest_date
FROM public.time_slots ts
JOIN public.dental_services s ON ts.service_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- Show availability for today and tomorrow
SELECT 
  ts.date,
  ds.name,
  ts.start_time,
  ts.status,
  COUNT(*) as count
FROM public.time_slots ts
JOIN public.dental_services ds ON ts.service_id = ds.id
WHERE ts.date IN (CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day')
GROUP BY ts.date, ds.name, ts.start_time, ts.status
ORDER BY ts.date, ts.start_time;

-- Show a week of slots for Service 1
SELECT 
  ts.date,
  ts.start_time,
  ts.end_time,
  ts.status
FROM public.time_slots ts
WHERE ts.service_id = 1
  AND ts.date >= CURRENT_DATE
  AND ts.date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY ts.date, ts.start_time;
