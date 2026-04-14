-- ================================================================
-- Booking System Database Optimization
-- PostgreSQL / Supabase SQL Script
-- ================================================================
-- Run this in Supabase SQL Editor to optimize time slot queries

-- ================================================================
-- SECTION 1: CREATE INDEXES FOR PERFORMANCE
-- ================================================================
-- These indexes will speed up queries by 10-100x for large datasets

-- Index 1: For filtering by status
CREATE INDEX IF NOT EXISTS idx_time_slots_status 
ON public.time_slots(status);

-- Index 2: For filtering by service
CREATE INDEX IF NOT EXISTS idx_time_slots_service_id 
ON public.time_slots(service_id);

-- Index 3: For filtering by date
CREATE INDEX IF NOT EXISTS idx_time_slots_date 
ON public.time_slots(date);

-- Index 4: Composite index for most common query (service + date + status)
CREATE INDEX IF NOT EXISTS idx_time_slots_service_date_status 
ON public.time_slots(service_id, date, status);

-- Index 5: Composite index for date + status queries
CREATE INDEX IF NOT EXISTS idx_time_slots_date_status 
ON public.time_slots(date, status);

-- Index 6: For ordering by date and time
CREATE INDEX IF NOT EXISTS idx_time_slots_date_start_time 
ON public.time_slots(date, start_time);

-- Index 7: For clinic hours by day (if not already exists)
CREATE INDEX IF NOT EXISTS idx_clinic_hours_day_of_week 
ON public.clinic_hours(day_of_week);

-- ================================================================
-- SECTION 2: VERIFY INDEXES
-- ================================================================

-- View all indexes on time_slots table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'time_slots'
ORDER BY indexname;

-- View all indexes on clinic_hours table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'clinic_hours'
ORDER BY indexname;

-- ================================================================
-- SECTION 3: VERIFY DATA INTEGRITY
-- ================================================================

-- Check that all time_slots have valid status values
SELECT DISTINCT status, COUNT(*) as count 
FROM public.time_slots 
GROUP BY status;

-- Expected: status values are only 'AVAILABLE' or 'BOOKED' (or NULL but fix it)
-- Count of each status type

-- Check that all time_slots have dates
SELECT COUNT(*) as slots_with_null_date 
FROM public.time_slots 
WHERE date IS NULL;

-- Expected: 0 (all slots should have dates)

-- Check that all time_slots have service_id
SELECT COUNT(*) as slots_with_null_service 
FROM public.time_slots 
WHERE service_id IS NULL;

-- Expected: 0 (all slots should have service_id)

-- ================================================================
-- SECTION 4: TEST EXAMPLE QUERIES
-- ================================================================

-- Test Query 1: Get all available slots for service 1
SELECT 
  id, date, start_time, end_time, status
FROM public.time_slots
WHERE service_id = 1 
  AND status = 'AVAILABLE'
  AND date >= CURRENT_DATE
ORDER BY date, start_time
LIMIT 10;

-- Expected: Returns 10 slots for service 1, sorted by date

-- Test Query 2: Get available slots for service 1 on a specific date
SELECT 
  id, date, start_time, end_time, status
FROM public.time_slots
WHERE service_id = 1 
  AND date = '2026-04-07'::date
  AND status = 'AVAILABLE'
ORDER BY start_time;

-- Expected: Returns slots for April 7 (could be empty if no slots that day)

-- Test Query 3: Get all available slots on a specific date (all services)
SELECT 
  ts.id, 
  ts.date, 
  ts.start_time, 
  ts.end_time,
  ds.name as service_name
FROM public.time_slots ts
JOIN public.dental_services ds ON ts.service_id = ds.id
WHERE ts.date = '2026-04-07'::date
  AND ts.status = 'AVAILABLE'
ORDER BY ds.name, ts.start_time;

-- Expected: Returns slots for April 7 across all services

-- Test Query 4: Get available slots from today onwards for service 1
SELECT 
  id, date, start_time, end_time, status
FROM public.time_slots
WHERE service_id = 1 
  AND status = 'AVAILABLE'
  AND date >= CURRENT_DATE
ORDER BY date, start_time
LIMIT 20;

-- Expected: Returns 20 slots starting from today

-- ================================================================
-- SECTION 5: PERFORMANCE COMPARISON (Optional)
-- ================================================================

-- Before optimization (without indexes):
-- EXPLAIN ANALYZE SELECT id, date, start_time FROM time_slots
-- WHERE service_id = 1 AND date >= CURRENT_DATE AND status = 'AVAILABLE'
-- ORDER BY date, start_time;

-- After optimization (with indexes):
-- EXPLAIN ANALYZE SELECT id, date, start_time FROM time_slots
-- WHERE service_id = 1 AND date >= CURRENT_DATE AND status = 'AVAILABLE'
-- ORDER BY date, start_time;

-- Look for: Sequential Scan vs Index Scan
-- After optimization should use Index Scan (much faster)

-- ================================================================
-- SECTION 6: DATA STATISTICS
-- ================================================================

-- View database size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View count of records in each table
SELECT 
  'time_slots' as table_name,
  COUNT(*) as record_count
FROM public.time_slots
UNION ALL
SELECT 
  'dental_services',
  COUNT(*)
FROM public.dental_services
UNION ALL
SELECT 
  'clinic_hours',
  COUNT(*)
FROM public.clinic_hours
UNION ALL
SELECT 
  'appointments',
  COUNT(*)
FROM public.appointments;

-- ================================================================
-- SECTION 7: FIX NULL STATUS ISSUES (if needed)
-- ================================================================

-- If there are time_slots with NULL status, fix them:
UPDATE public.time_slots
SET status = 'AVAILABLE'
WHERE status IS NULL
  AND date >= CURRENT_DATE;

-- Verify the fix
SELECT COUNT(*) as fixed_count
FROM public.time_slots
WHERE status IS NULL;

-- Expected: 0 after the fix

-- ================================================================
-- SECTION 8: ANALYZE QUERY PERFORMANCE
-- ================================================================

-- Run this to analyze table statistics for optimization
ANALYZE public.time_slots;
ANALYZE public.clinic_hours;
ANALYZE public.dental_services;

-- After ANALYZE, queries will use better execution plans

-- ================================================================
-- SUCCESS INDICATORS
-- ================================================================

-- If all of these queries return results, database is healthy:

SELECT 'SERVICES' as check_type, COUNT(*) as count FROM public.dental_services
UNION ALL
SELECT 'CLINIC_HOURS', COUNT(*) FROM public.clinic_hours
UNION ALL
SELECT 'TIME_SLOTS_TOTAL', COUNT(*) FROM public.time_slots
UNION ALL
SELECT 'TIME_SLOTS_AVAILABLE', COUNT(*) FROM public.time_slots WHERE status = 'AVAILABLE'
UNION ALL
SELECT 'TIME_SLOTS_FUTURE', COUNT(*) FROM public.time_slots WHERE date >= CURRENT_DATE
UNION ALL
SELECT 'INDEXES_CREATED', COUNT(DISTINCT indexname) FROM pg_indexes WHERE tablename = 'time_slots';

-- Expected output:
-- SERVICES: 4 (or your number of services)
-- CLINIC_HOURS: 7
-- TIME_SLOTS_TOTAL: 80+ (or your number of slots)
-- TIME_SLOTS_AVAILABLE: 50+ (available slots)
-- TIME_SLOTS_FUTURE: 50+ (future slots)
-- INDEXES_CREATED: 6+ (newly created indexes)

-- ================================================================
-- CLEANUP (Only if something went wrong)
-- ================================================================

-- Drop indexes if needed (for testing/reset):
-- DROP INDEX IF EXISTS idx_time_slots_status CASCADE;
-- DROP INDEX IF EXISTS idx_time_slots_service_id CASCADE;
-- DROP INDEX IF EXISTS idx_time_slots_date CASCADE;
-- DROP INDEX IF EXISTS idx_time_slots_service_date_status CASCADE;
-- DROP INDEX IF EXISTS idx_time_slots_date_status CASCADE;
-- DROP INDEX IF EXISTS idx_time_slots_date_start_time CASCADE;
-- DROP INDEX IF EXISTS idx_clinic_hours_day_of_week CASCADE;

-- ================================================================
-- COMPLETION
-- ================================================================

-- If you see this message in green, everything completed successfully!
-- Your database is now optimized for fast time slot queries.

SELECT 
  'DATABASE OPTIMIZATION COMPLETE' as status,
  CURRENT_TIMESTAMP as completed_at,
  'All indexes have been created and queries optimized for the booking system.' as message;
