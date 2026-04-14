# Backend Time Slot Service - Data Flow Analysis

## System Architecture

```
Frontend (BookPage.jsx)
    ↓
    Fetches available time slots
    ↓
API: GET /api/v1/time-slots/available?serviceId={id}
    ↓
TimeSlotController.getAvailableTimeSlots()
    ↓
TimeSlotService.getAvailableTimeSlotsByService(serviceId)
    ↓
[FILTER 1] Status must be AVAILABLE
[FILTER 2] Clinic must be open on slot's day
    ↓
Converts to DTOs
    ↓
Returns JSON to Frontend
```

## Backend Code Flow Analysis

### 1. TimeSlotController (Entry Point)
**File:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/timeslot/controller/TimeSlotController.java`

```java
@GetMapping("/available")
public ResponseEntity<?> getAvailableTimeSlots(@RequestParam(required = false) Long serviceId) {
    List<TimeSlotDTO> slots;
    if (serviceId != null) {
        slots = service.getAvailableTimeSlotsByService(serviceId);  // ← Filter by service
    } else {
        slots = service.getAvailableTimeSlots();  // Get all available across all services
    }
    return ResponseEntity.ok(slots);
}
```

**Expected Behavior:**
- If `serviceId` provided: Returns only available slots for that service
- If `serviceId` not provided: Returns all available slots

### 2. TimeSlotService (Business Logic)
**File:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/timeslot/service/TimeSlotService.java`

#### Method: getAvailableTimeSlotsByService
```java
public List<TimeSlotDTO> getAvailableTimeSlotsByService(Long serviceId) {
    return timeSlotRepository.findAll().stream()
            .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE)        // FILTER 1
            .filter(ts -> ts.getService().getId().equals(serviceId))          // FILTER 2
            .filter(this::isTimeSlotDayOpen)                                  // FILTER 3
            .map(TimeSlotDTO::new)
            .collect(Collectors.toList());
}
```

**Filters Applied (IN ORDER):**
1. **Status Filter:** `status == AVAILABLE` 
   - ✓ Must be AVAILABLE (not BOOKED, CANCELLED, etc.)
   
2. **Service Filter:** Matches the requested serviceId
   - ✓ Only return slots for requested service
   
3. **Clinic Hours Filter:** Day must be open
   - ✓ Calls `isTimeSlotDayOpen()` to check

#### Method: isTimeSlotDayOpen (Critical Logic)
```java
private boolean isTimeSlotDayOpen(TimeSlot timeSlot) {
    if (timeSlot == null || timeSlot.getDate() == null) {
        logger.warning("⚠️ TimeSlot has null date");
        return false;
    }

    try {
        // Convert Java's DayOfWeek (Mon=1, Sun=7) to clinic format (Mon=0, Sun=6)
        int javaDayOfWeek = timeSlot.getDate().getDayOfWeek().getValue();
        int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1;
        
        // Check if clinic is operating on this day
        Boolean isOpen = clinicHoursService.isClinicOpenOnDay(clinicDayOfWeek);
        return isOpen;
    } catch (Exception e) {
        logger.warning("⚠️ Error checking clinic hours: " + e.getMessage());
        return true;  // DEFAULT: Allow if there's an error fetching clinic hours
    }
}
```

**Day Mapping:**
```
Java LocalDate.getDayOfWeek().getValue():
  Monday    = 1
  Tuesday   = 2
  Wednesday = 3
  Thursday  = 4
  Friday    = 5
  Saturday  = 6
  Sunday    = 7

Converted to Clinic Format (database):
  Monday    = 0
  Tuesday   = 1
  Wednesday = 2
  Thursday  = 3
  Friday    = 4
  Saturday  = 5
  Sunday    = 6
```

### 3. ClinicHoursService (Availability Check)
**File:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/common/service/ClinicHoursService.java`

```java
public Boolean isClinicOpenOnDay(Integer dayOfWeek) {
    return repository.findByDayOfWeek(dayOfWeek)
            .map(ClinicHours::getIsOperating)
            .orElse(true);  // DEFAULT: true (open if not configured)
}
```

**Important:** If a day has no clinic_hours row, it **defaults to OPEN**

---

## Why Time Slots Might Not Show

### ✗ Cause 1: No Time Slots in Database
**Symptoms:** 
- Backend logs show empty query results
- API returns `[]` empty array

**Check:**
```sql
SELECT COUNT(*) FROM time_slots;
-- If this returns 0, database is empty
```

**Fix:** Run the SQL population script

---

### ✗ Cause 2: Time Slots Have Wrong Status
**Symptoms:**
- Time slots exist but have status 'BOOKED' instead of 'AVAILABLE'
- API returns empty array even with slots in DB

**Check:**
```sql
SELECT DISTINCT status FROM time_slots;
-- Should return: ['AVAILABLE']
-- If returns: ['BOOKED', 'AVAILABLE'], mix is OK, but some need to be available
```

**Fix:**
```sql
UPDATE time_slots SET status = 'AVAILABLE' WHERE status IS NULL OR status = '';
-- Or restore clear slots:
DELETE FROM time_slots;
-- Then re-run population script
```

---

### ✗ Cause 3: Clinic Hours Not Configured
**Symptoms:**
- Clinic hours table is empty
- All time slots filtered out because isClinicOpenOnDay() fails

**Check:**
```sql
SELECT COUNT(*) FROM clinic_hours;
-- Should return 7 (one for each day of week)
```

**Fix:**
```sql
-- Delete empty clinic hours
DELETE FROM clinic_hours;
-- Re-run the clinic_hours INSERT statements from population script
```

---

### ✗ Cause 4: Time Slots Are in the Past
**Symptoms:**
- Time slots exist but are dated yesterday or earlier
- Frontend filters them out before display

**Check:**
```sql
SELECT COUNT(*) FROM time_slots WHERE date >= CURRENT_DATE AND status = 'AVAILABLE';
-- Should return > 0
```

**Fix:** Clear and recreate time slots with future dates using population script

---

### ✗ Cause 5: Clinic Day is Marked as Closed
**Symptoms:**
- Time slots exist for that day
- But clinic_hours.is_operating = false for that day

**Example Problem:**
```sql
-- Clinic hours has:
day_of_week = 0 (Monday), is_operating = false

-- Time slots exist for Monday, but all get filtered out
```

**Check:**
```sql
SELECT day_of_week, is_operating FROM clinic_hours ORDER BY day_of_week;
-- Mon-Sat should have is_operating = true
-- Sun should have is_operating = false
```

**Fix:**
```sql
UPDATE clinic_hours SET is_operating = true WHERE day_of_week IN (0,1,2,3,4,5);
UPDATE clinic_hours SET is_operating = false WHERE day_of_week = 6;
```

---

## Data Flow Debugging Guide

### Test 1: Check Database State

```sql
-- Are there any time slots at all?
SELECT COUNT(*) as total_slots FROM time_slots;

-- How many are AVAILABLE (not BOOKED)?
SELECT COUNT(*) as available_slots FROM time_slots WHERE status = 'AVAILABLE';

-- How many are in the future?
SELECT COUNT(*) as future_slots FROM time_slots WHERE date >= CURRENT_DATE;

-- How many past + available?
SELECT COUNT(*) as valid_slots 
FROM time_slots 
WHERE date >= CURRENT_DATE 
  AND status = 'AVAILABLE'
  AND date != NULL;

-- Is clinic hours configured?
SELECT COUNT(*) as clinic_hours_count FROM clinic_hours;

-- Which days are marked as open?
SELECT day_of_week, is_operating FROM clinic_hours ORDER BY day_of_week;
```

### Test 2: Check API Response

```bash
# In terminal, test API directly:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available"

# For specific service:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "date": "2026-04-03",
    "startTime": "09:00",
    "endTime": "10:00",
    "status": "AVAILABLE",
    "service": { "id": 1, "name": "Cleaning", ... }
  },
  ...
]
```

### Test 3: Check Backend Logs

When requesting available slots, look for console output:

```
📅 Fetching available time slots for service 1
✅ Found 12 available time slots
```

Or if there's a problem:

```
📅 Fetching available time slots for service 1
✓ Found 0 available time slots
← This means all slots were filtered out!
```

### Test 4: Trace Filtering

Add debug log to TimeSlotService:

**Before filtering:**
```java
logger.info("📊 Total slots in DB for service " + serviceId + ": " + 
    timeSlotRepository.findAll().stream()
        .filter(ts -> ts.getService().getId().equals(serviceId))
        .count());
```

**After each filter:**
```java
long beforeStatus = timeSlotRepository.findAll().stream()
    .filter(ts -> ts.getService().getId().equals(serviceId))
    .count();
long afterStatus = timeSlotRepository.findAll().stream()
    .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE)
    .filter(ts -> ts.getService().getId().equals(serviceId))
    .count();
logger.info("Status filter removed: " + (beforeStatus - afterStatus) + " slots");

long beforeClinic = afterStatus;
long afterClinic = timeSlotRepository.findAll().stream()
    .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE)
    .filter(ts -> ts.getService().getId().equals(serviceId))
    .filter(this::isTimeSlotDayOpen)
    .count();
logger.info("Clinic hours filter removed: " + (beforeClinic - afterClinic) + " slots");
```

---

## Quick Fix Checklist

Run these SQL queries in order to diagnose:

```sql
-- 1. Check services exist
SELECT COUNT(*) as "Services" FROM dental_services;

-- 2. Check clinic hours exist
SELECT COUNT(*) as "Clinic Hours" FROM clinic_hours;

-- 3. Check time slots exist
SELECT COUNT(*) as "Total Time Slots" FROM time_slots;

-- 4. Check AVAILABLE time slots
SELECT COUNT(*) as "Available Slots" FROM time_slots WHERE status = 'AVAILABLE';

-- 5. Check future AVAILABLE time slots
SELECT COUNT(*) as "Future Available" FROM time_slots 
WHERE status = 'AVAILABLE' AND date >= CURRENT_DATE;

-- 6. List what's open
SELECT day_of_week, is_operating FROM clinic_hours ORDER BY day_of_week;

-- 7. Show sample slots
SELECT id, service_id, date, start_time, status FROM time_slots LIMIT 5;
```

**Expected Results:**
- Services: 4
- Clinic Hours: 7
- Total Time Slots: 100+
- Available Slots: 100+
- Future Available: 100+
- Open days: Mon-Sat = true, Sun = false
- Sample slots: Should show dates and AVAILABLE status

---

## Solution Summary

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty array returned | No slots in DB | Run population SQL script |
| Still empty | All slots BOOKED | Reset slots to AVAILABLE |
| Still empty | Clinic closed all days | Verify clinic_hours.is_operating |
| Still empty | Slots in past | Verify slot dates > today |
| Still empty | Service doesn't exist | Check dental_services table |
| API error | Backend not running | Start backend with mvn spring-boot:run |
| API 404 | Wrong endpoint | Verify URL is /api/v1/time-slots/available |
| Frontend shows empty | Check browser console | Look for API/filter errors |

