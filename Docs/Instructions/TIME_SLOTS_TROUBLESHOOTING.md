# Time Slots Not Showing - Complete Diagnostic & Fix

## Problem Analysis

When users try to book appointments, they get:
- ❌ "No available time slots for this service yet."
- ❌ "No available time slots for this date."

## Root Causes & Solutions

### Cause 1: Empty Database (Most Likely) ✅
**Symptoms:** Time slots table is completely empty  
**Solution:** Run the SQL data population script below

### Cause 2: DataLoader Didn't Run
**Symptoms:** App started but database still empty  
**Reason:** DataLoader only runs on first app startup when DB is empty  
**Solution:** Run SQL script OR delete all data and restart backend

### Cause 3: Time Slots in the Past
**Symptoms:** Time slots exist but are hidden  
**Reason:** Frontend filters out past dates, backend filters old slots  
**Solution:** Ensure test slots are created 7+ days in the future

### Cause 4: All Time Slots are BOOKED
**Symptoms:** Time slots table has data, but all status='BOOKED'  
**Solution:** Check slot table, update status to 'AVAILABLE'

---

## Quick Fix: Populate Sample Data via SQL

### Step 1: Get Your Service IDs First

Run this query in Supabase to see what services exist:

```sql
SELECT id, name FROM dental_services LIMIT 10;
```

**Expected Output:**
```
id  | name
----|----------
1   | Cleaning
2   | Filling
3   | Root Canal
4   | Whitening
```

If empty, create sample services first (see Step 2A below).

### Step 2A: Create Sample Services (Only if needed)

```sql
INSERT INTO dental_services (name, description, duration, price, icon, created_at) VALUES
('Cleaning', 'Professional dental cleaning', '30 min', '$75', '🪥', NOW()),
('Filling', 'Tooth filling procedure', '45 min', '$150', '🔧', NOW()),
('Root Canal', 'Root canal treatment', '60 min', '$300', '🦷', NOW()),
('Whitening', 'Teeth whitening service', '45 min', '$200', '✨', NOW())
ON CONFLICT DO NOTHING;
```

### Step 2B: Create Sample Clinic Hours (Set Operating Hours)

```sql
-- Clear existing hours (if any)
DELETE FROM clinic_hours;

-- Insert standard hours: Mon-Fri 9-12 & 14-17, Sat 9-13, Sun closed
INSERT INTO clinic_hours (day_of_week, is_operating, morning_start, morning_end, afternoon_start, afternoon_end, updated_at) VALUES
(0, true,  '09:00', '12:00', '14:00', '17:00', NOW()),  -- Monday
(1, true,  '09:00', '12:00', '14:00', '17:00', NOW()),  -- Tuesday
(2, true,  '09:00', '12:00', '14:00', '17:00', NOW()),  -- Wednesday
(3, true,  '09:00', '12:00', '14:00', '17:00', NOW()),  -- Thursday
(4, true,  '09:00', '12:00', '14:00', '17:00', NOW()),  -- Friday
(5, true,  '09:00', '13:00', NULL,    NULL,    NOW()),  -- Saturday (morning only)
(6, false, NULL,    NULL,    NULL,    NULL,    NOW());  -- Sunday (closed)
```

### Step 2C: Create 14 Days of Available Time Slots

**Important:** Replace `CURRENT_DATE + INTERVAL '1 day'` with actual future dates if needed.

```sql
-- Delete existing slots (optional - only if starting fresh)
DELETE FROM time_slots;

-- Create time slots: 14 days ahead, for each service
-- Morning: 9:00-10:00, Afternoon: 14:00-15:00
-- FOR EACH SERVICE ID (assuming 1,2,3,4)

WITH service_ids AS (
  SELECT id FROM dental_services ORDER BY id LIMIT 4
),
date_range AS (
  SELECT CURRENT_DATE + i::interval AS slot_date
  FROM GENERATE_SERIES(1, 14) AS i
)
INSERT INTO time_slots (service_id, date, start_time, end_time, status, created_at)
SELECT
  s.id,
  d.slot_date::date,
  '09:00'::time,
  '10:00'::time,
  'AVAILABLE',
  NOW()
FROM service_ids s
CROSS JOIN date_range d
WHERE EXTRACT(DOW FROM d.slot_date) != 0  -- Exclude Sundays (0)
UNION ALL
SELECT
  s.id,
  d.slot_date::date,
  '14:00'::time,
  '15:00'::time,
  'AVAILABLE',
  NOW()
FROM service_ids s
CROSS JOIN date_range d
WHERE EXTRACT(DOW FROM d.slot_date) != 0;  -- Exclude Sundays (0)
```

### Verification Query

After running the above, verify with:

```sql
-- Check services exist
SELECT COUNT(*) as service_count FROM dental_services;

-- Check clinic hours are configured
SELECT day_of_week, is_operating, morning_start FROM clinic_hours ORDER BY day_of_week;

-- Check time slots exist and count them
SELECT 
  ds.name,
  COUNT(*) as available_count
FROM time_slots ts
JOIN dental_services ds ON ts.service_id = ds.id
WHERE ts.status = 'AVAILABLE'
GROUP BY ds.name;

-- Check upcoming available slots for specific service
SELECT 
  date,
  start_time,
  end_time,
  status
FROM time_slots
WHERE service_id = 1 AND date >= CURRENT_DATE AND status = 'AVAILABLE'
ORDER BY date, start_time
LIMIT 10;
```

**Expected Output:**
```
Cleaning:  12 available slots
Filling:   12 available slots
Root Canal: 12 available slots
Whitening: 12 available slots
```

---

## Backend Verification

### Check that Backend is Starting Data Loader

Look at your backend console output when starting the app:

✅ **Good Output (expect to see):**
```
╔══════════════════════════════════════════════════════════╗
║         SMILE CARE - DATA LOADER STARTING               ║
╚══════════════════════════════════════════════════════════╝

✓ Test user created successfully
✓ Clinic hours already configured
📊 Current database state:
    Services: 4
    Time Slots: 56
✓ Services already exist, skipping creation
╔══════════════════════════════════════════════════════════╗
║             DATA LOADER COMPLETED                       ║
╚══════════════════════════════════════════════════════════╝
```

❌ **Bad Output (problematic):**
```
0 Services created
0 Time Slots created
```

If you see bad output, the DataLoader didn't run properly. Check:
1. Is Spring Boot actually starting?
2. Are there any errors in the console?
3. Is the database connection working?

### Force DataLoader to Run

If DataLoader didn't populate data:

**Option A: Manual Clear (Warning: Deletes all data)**
```sql
DELETE FROM appointments;
DELETE FROM time_slots;
DELETE FROM dental_services;
DELETE FROM clinic_hours;
DELETE FROM users WHERE role = 'ADMIN';
```

Then restart the backend - DataLoader will detect empty DB and repopulate.

**Option B: Run SQL Script Manually**
Run the SQL script above directly in Supabase without clearing.

---

## Frontend Debugging

### Check Browser Console for API Calls

1. Open DevTools: **Press F12**
2. Go to **Console** tab
3. As a logged-in user, select a service
4. You should see:

✅ **Good logs:**
```
🔍 Fetching from URL: http://localhost:8085/api/v1/time-slots/available?serviceId=1
📡 Response status: 200
✅ Time slots received: Array(12)
  [
    { id: 1, date: "2026-04-03", startTime: "09:00", endTime: "10:00", status: "AVAILABLE", ... },
    { id: 2, date: "2026-04-03", startTime: "14:00", endTime: "15:00", status: "AVAILABLE", ... },
    ...
  ]
```

❌ **Bad logs:**
```
🔍 Fetching from URL: http://localhost:8085/api/v1/time-slots/available?serviceId=1
📡 Response status: 200
✅ Time slots received: Array(0)  ← EMPTY!
```

### Check Network Tab for API Response

1. Open DevTools: **Press F12**
2. Go to **Network** tab
3. Select a service
4. Look for request to `time-slots/available`
5. Click it and check **Response** tab
6. Should show time slot array, not empty

---

## Complete End-to-End Test

### Test Sequence

1. **Start Backend**
   ```bash
   cd smilecare-backend
   ./mvnw spring-boot:run
   # Or: mvn spring-boot:run
   ```
   Wait for "DATA LOADER COMPLETED"

2. **Check Backend Data**
   ```bash
   # In another terminal, call API directly:
   curl http://localhost:8085/api/v1/time-slots/available
   # Should return JSON array with time slots
   ```

3. **Start Frontend**
   ```bash
   cd smilecare-frontend
   npm run dev
   ```

4. **Login as User**
   - Email: `test@smilecare.com` (or any registered user)
   - Password: `123456`

5. **Navigate to Book Appointment**
   - Click "Book Appointment" tab
   - Select a service (e.g., "Cleaning")
   - **Expected:** See time slots displayed
   - **If not:** Check browser console (F12)

6. **Select Date & Time**
   - Click a date in the calendar
   - **Expected:** Time slots for that date appear
   - **If empty:** Console will show why

7. **Confirm Booking**
   - Select a time slot
   - Click "Confirm Booking"
   - **Expected:** Success screen

---

## SQL Script to Run in Supabase Console

Copy-paste this entire script into Supabase > SQL Editor and execute:

```sql
-- ============ ENSURE SERVICES EXIST ============
INSERT INTO dental_services (name, description, duration, price, icon, created_at) VALUES
('Cleaning', 'Professional dental cleaning', '30 min', '$75', '🪥', NOW()),
('Filling', 'Tooth filling procedure', '45 min', '$150', '🔧', NOW()),
('Root Canal', 'Root canal treatment', '60 min', '$300', '🦷', NOW()),
('Whitening', 'Teeth whitening service', '45 min', '$200', '✨', NOW())
ON CONFLICT DO NOTHING;

-- ============ SET UP CLINIC HOURS ============
DELETE FROM clinic_hours;

INSERT INTO clinic_hours (day_of_week, is_operating, morning_start, morning_end, afternoon_start, afternoon_end, updated_at) VALUES
(0, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Monday
(1, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Tuesday
(2, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Wednesday
(3, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Thursday
(4, true,  '09:00'::time, '12:00'::time, '14:00'::time, '17:00'::time, NOW()),  -- Friday
(5, true,  '09:00'::time, '13:00'::time, NULL, NULL, NOW()),  -- Saturday (morning only)
(6, false, NULL, NULL, NULL, NULL, NOW());  -- Sunday (closed)

-- ============ CREATE TIME SLOTS ============
DELETE FROM time_slots;

-- Generate 14 days of slots for each service
WITH service_ids AS (
  SELECT id FROM dental_services ORDER BY id
),
dates AS (
  SELECT (CURRENT_DATE + (i * '1 day'::interval))::date AS slot_date
  FROM GENERATE_SERIES(1, 14) AS i
  WHERE EXTRACT(DOW FROM CURRENT_DATE + (i * '1 day'::interval)) != 0  -- No Sundays
)
INSERT INTO time_slots (service_id, date, start_time, end_time, status, created_at)
SELECT s.id, d.slot_date, '09:00'::time, '10:00'::time, 'AVAILABLE', NOW()
FROM service_ids s CROSS JOIN dates d
UNION ALL
SELECT s.id, d.slot_date, '14:00'::time, '15:00'::time, 'AVAILABLE', NOW()
FROM service_ids s CROSS JOIN dates d;

-- ============ VERIFICATION ============
SELECT 'Services' AS check_type, COUNT(*) AS count FROM dental_services
UNION ALL
SELECT 'Clinic Hours', COUNT(*) FROM clinic_hours
UNION ALL
SELECT 'Time Slots (Available)', COUNT(*) FROM time_slots WHERE status = 'AVAILABLE'
UNION ALL
SELECT 'Time Slots (All)', COUNT(*) FROM time_slots;
```

---

## If Still Not Working

### Debug Checklist

- [ ] Clinic Hours table has 7 rows (one per day)
- [ ] All clinic hours for Mon-Sat have is_operating = true
- [ ] Time Slots table has entries (expect 80+ for 4 services × 10 days × 2 slots/day)
- [ ] Time Slot status = 'AVAILABLE' (not 'BOOKED')
- [ ] Time Slot dates are >= today
- [ ] Backend is running and no errors in console
- [ ] Frontend can connect to backend (check Network tab)
- [ ] You're logged in as a user with a valid session token
- [ ] Browser console shows successful API response with time slots

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "No time slots yet" | Empty DB | Run SQL script above |
| Time slots appear then disappear | Async loading issue | Frontend filtering correctly |
| "Clinic closed" but it shouldn't be | Day mapping issue | Verify clinic_hours day_of_week values |
| Can see slots in API but not UI | Frontend not displaying | Check browser console for errors |
| All slots are BOOKED | Test bookings created slots | Run DELETE FROM time_slots then repopulate |

---

## Success Indicators

✅ **You'll know it's working when:**
1. Backend logs show "DATA LOADER COMPLETED"
2. Supabase shows rows in time_slots table
3. Browser console shows "✅ Time slots received: Array(N)" with N > 0
4. Calendar shows dates as enabled/disabled correctly
5. Clicking a date shows available time slots
6. Can select a slot and book appointment
7. New appointment appears in admin panel

---

## Next Steps

1. **Immediate:** Run the SQL script in Supabase
2. **Verify:** Check all verification queries
3. **Test:** Follow the end-to-end test sequence
4. **Debug:** If still failing, check the debug checklist
5. **Report:** If issues persist, provide:
   - Backend console output
   - Browser console error messages
   - Network tab responses
   - Database query results from verification queries
