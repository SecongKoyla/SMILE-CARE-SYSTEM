-- =====================================================
-- PHASE 1: DYNAMIC BOOKING SYSTEM - COMPLETE SQL SCHEMA
-- =====================================================
-- Instructions: Copy and paste ALL of this into Supabase SQL Editor
-- Then execute each statement one by one
-- =====================================================

-- =======================
-- STEP 1: BACKUP EXISTING DATA (OPTIONAL)
-- =======================
-- Save current appointments (optional but recommended)
-- CREATE TABLE appointment_backup AS SELECT * FROM appointments;
-- CREATE TABLE time_slots_backup_old AS SELECT * FROM time_slots;

-- =======================
-- STEP 2: ALTER dental_services TABLE - ADD DURATION
-- =======================
ALTER TABLE public.dental_services 
ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;

-- Add constraint to ensure duration is positive
ALTER TABLE public.dental_services
DROP CONSTRAINT IF EXISTS duration_positive_check;

ALTER TABLE public.dental_services
ADD CONSTRAINT duration_positive_check CHECK (duration_minutes > 0);

-- Update existing services with appropriate durations
UPDATE public.dental_services 
SET duration_minutes = CASE 
  WHEN name LIKE '%Cleaning%' THEN 30
  WHEN name LIKE '%Cleaning%' THEN 30
  WHEN name LIKE '%Checkup%' THEN 30
  WHEN name LIKE '%Filling%' THEN 60
  WHEN name LIKE '%Root%' THEN 90
  WHEN name LIKE '%Crown%' THEN 90
  WHEN name LIKE '%Extraction%' THEN 60
  WHEN name LIKE '%Whitening%' THEN 60
  ELSE 30
END
WHERE duration_minutes = 30 AND name NOT LIKE '%Cleaning%';

-- =======================
-- STEP 3: CREATE NEW time_slots TABLE
-- =======================
DROP TABLE IF EXISTS public.time_slots CASCADE;

CREATE TABLE public.time_slots (
  id bigserial NOT NULL PRIMARY KEY,
  service_id bigint NOT NULL REFERENCES public.dental_services(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time WITHOUT TIME ZONE NOT NULL,
  end_time time WITHOUT TIME ZONE NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'AVAILABLE',
  status_updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  locked_by_user_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  lock_expires_at timestamp WITHOUT TIME ZONE,
  created_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT slot_time_check CHECK (start_time < end_time),
  CONSTRAINT valid_status CHECK (status IN ('AVAILABLE', 'BOOKED', 'LOCKED')),
  CONSTRAINT unique_slot UNIQUE(service_id, appointment_date, start_time)
);

-- Create indexes for performance
CREATE INDEX idx_time_slots_service_date ON public.time_slots(service_id, appointment_date);
CREATE INDEX idx_time_slots_date ON public.time_slots(appointment_date);
CREATE INDEX idx_time_slots_status ON public.time_slots(status);
CREATE INDEX idx_time_slots_lock_expires ON public.time_slots(lock_expires_at) WHERE lock_expires_at IS NOT NULL;

-- =======================
-- STEP 4: UPDATE appointments TABLE - ADD START/END TIMES
-- =======================
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS start_time time WITHOUT TIME ZONE;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS end_time time WITHOUT TIME ZONE;

-- Add constraints
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointment_time_check;

ALTER TABLE public.appointments
ADD CONSTRAINT appointment_time_check CHECK (start_time < end_time);

-- If appointments already exist, estimate start/end times (or update manually)
-- This assumes appointments start at reasonable times - adjust as needed
UPDATE public.appointments
SET 
  start_time = COALESCE(start_time, '09:00'::time),
  end_time = COALESCE(end_time, '09:30'::time)
WHERE start_time IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(appointment_date, start_time, end_time);

-- =======================
-- STEP 5: CREATE slot_locks TABLE (Audit Trail)
-- =======================
DROP TABLE IF EXISTS public.slot_locks CASCADE;

CREATE TABLE public.slot_locks (
  id bigserial NOT NULL PRIMARY KEY,
  time_slot_id bigint NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  locked_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  expires_at timestamp WITHOUT TIME ZONE,
  released_at timestamp WITHOUT TIME ZONE,
  released_by_user_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  reason varchar(255),
  
  CONSTRAINT lock_unique UNIQUE(time_slot_id, expires_at)
);

CREATE INDEX idx_slot_locks_user ON public.slot_locks(user_id);
CREATE INDEX idx_slot_locks_expires ON public.slot_locks(expires_at);
CREATE INDEX idx_slot_locks_active ON public.slot_locks(expires_at) WHERE released_at IS NULL;

-- =======================
-- STEP 6: CREATE appointment_conflicts TABLE (Audit Trail)
-- =======================
DROP TABLE IF EXISTS public.appointment_conflicts CASCADE;

CREATE TABLE public.appointment_conflicts (
  id bigserial NOT NULL PRIMARY KEY,
  patient_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  attempted_service_id bigint REFERENCES public.dental_services(id) ON DELETE SET NULL,
  attempted_date date,
  attempted_start_time time WITHOUT TIME ZONE,
  attempted_end_time time WITHOUT TIME ZONE,
  conflict_reason varchar(255),
  detected_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  resolved_at timestamp WITHOUT TIME ZONE
);

CREATE INDEX idx_conflicts_patient ON public.appointment_conflicts(patient_id);
CREATE INDEX idx_conflicts_date ON public.appointment_conflicts(attempted_date);

-- =======================
-- STEP 7: CREATE clinic_hours TABLE (If not exists)
-- =======================
DROP TABLE IF EXISTS public.clinic_hours CASCADE;

CREATE TABLE public.clinic_hours (
  id bigserial NOT NULL PRIMARY KEY,
  day_of_week integer NOT NULL,
  is_operating boolean NOT NULL DEFAULT true,
  morning_start time WITHOUT TIME ZONE DEFAULT '08:00',
  morning_end time WITHOUT TIME ZONE DEFAULT '12:00',
  afternoon_start time WITHOUT TIME ZONE DEFAULT '14:00',
  afternoon_end time WITHOUT TIME ZONE DEFAULT '18:00',
  updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT clinic_hours_unique_day UNIQUE(day_of_week),
  CONSTRAINT day_range CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

-- Insert default clinic hours (0=Sunday, 1=Monday, ..., 6=Saturday)
INSERT INTO public.clinic_hours (day_of_week, is_operating, morning_start, morning_end, afternoon_start, afternoon_end) 
VALUES 
  (0, false, '08:00', '12:00', '14:00', '18:00'),  -- Sunday (closed)
  (1, true,  '08:00', '12:00', '14:00', '18:00'),  -- Monday
  (2, true,  '08:00', '12:00', '14:00', '18:00'),  -- Tuesday
  (3, true,  '08:00', '12:00', '14:00', '18:00'),  -- Wednesday
  (4, true,  '08:00', '12:00', '14:00', '18:00'),  -- Thursday
  (5, true,  '08:00', '12:00', '14:00', '18:00'),  -- Friday
  (6, false, '08:00', '12:00', '14:00', '18:00')   -- Saturday (closed)
ON CONFLICT (day_of_week) DO UPDATE 
SET is_operating = EXCLUDED.is_operating;

-- =======================
-- STEP 8: VERIFY SCHEMA
-- =======================
-- Run this query to verify all tables exist and have correct columns:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
-- AND table_name IN ('time_slots', 'appointments', 'slot_locks', 'appointment_conflicts', 'clinic_hours', 'dental_services');

-- =======================
-- STEP 9: GENERATE INITIAL TIME SLOTS (Optional - Backend will do this)
-- =======================
-- This procedure generates slots for dentists/clinics
-- We'll let the backend generate slots dynamically, but here's an example:

-- Example: Generate slots for Service ID 5 (Teeth Cleaning - 30 min) for next 7 days
-- For Monday-Friday only (day_of_week 1-5)

-- Run this After step 8 to generate some initial test slots:
INSERT INTO public.time_slots (service_id, appointment_date, start_time, end_time, status)
SELECT 
  5 as service_id,
  CURRENT_DATE + (day_offset * '1 day'::interval) as appointment_date,
  time_slots_table.start_time,
  time_slots_table.start_time + '30 minutes'::interval as end_time,
  'AVAILABLE' as status
FROM (
  SELECT 0 as day_offset UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) dates,
(
  SELECT '08:00'::time as start_time UNION ALL
  SELECT '08:30'::time UNION ALL
  SELECT '09:00'::time UNION ALL
  SELECT '09:30'::time UNION ALL
  SELECT '10:00'::time UNION ALL
  SELECT '10:30'::time UNION ALL
  SELECT '11:00'::time UNION ALL
  SELECT '11:30'::time UNION ALL
  SELECT '14:00'::time UNION ALL
  SELECT '14:30'::time UNION ALL
  SELECT '15:00'::time UNION ALL
  SELECT '15:30'::time UNION ALL
  SELECT '16:00'::time UNION ALL
  SELECT '16:30'::time UNION ALL
  SELECT '17:00'::time UNION ALL
  SELECT '17:30'::time
) time_slots_table
WHERE EXTRACT(dow FROM (CURRENT_DATE + (day_offset * '1 day'::interval))) BETWEEN 1 AND 5  -- Monday-Friday only
ON CONFLICT (service_id, appointment_date, start_time) DO NOTHING;

-- =======================
-- STEP 10: TEST DATA (Optional - for testing)
-- =======================
-- Verify by checking:
SELECT COUNT(*) as total_slots FROM public.time_slots;
SELECT * FROM public.dental_services LIMIT 5;
SELECT * FROM public.clinic_hours ORDER BY day_of_week;

-- =======================
-- SUCCESS! 🎉
-- =======================
-- All tables created successfully!
-- You can now:
-- 1. Check Phase 2 (Java models)
-- 2. Check Phase 3 (Repositories)
-- 3. Check Phase 4 (Services)
-- 4. Check Phase 5 (Controllers)
