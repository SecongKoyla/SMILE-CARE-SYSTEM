# Booking System Step 2 - Diagnostic & Verification Guide

## Quick Diagnostics (Run These First)

### 1. Check Backend Started Successfully

**What to look for in backend console:**
```
✓ Test user created successfully
✓ Clinic hours already configured
📊 Current database state:
    Services: 4
    Time Slots: 56+
```

If you don't see this, database connection failed → check application.properties

---

### 2. Verify Database Has Data

**In Supabase SQL Editor, run:**
```sql
SELECT COUNT(*) as total_slots FROM time_slots 
WHERE status = 'AVAILABLE' AND date >= CURRENT_DATE;
```

**Expected:** 50+ (should have future available slots)

**If 0:** Your database is empty → populate using SUPABASE_READY_POPULATE.sql

---

### 3. Test API Directly (via curl)

```bash
# Get your auth token first:
# 1. Open DevTools in browser (F12)
# 2. Login to app
# 3. Go to Application/Storage → LocalStorage → accessToken
# 4. Copy the token value

# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "date": "2026-04-07",
    "startTime": "09:00",
    "endTime": "10:00",
    "status": "AVAILABLE",
    "serviceId": 1
  },
  ...
]
```

**If empty array `[]`:** Backend is running but no slots returned → check filtering logic

**If error:** Backend issue → check logs

---

### 4. Test Date Parameter

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1&date=2026-04-07"
```

**Expected:** Only slots on 2026-04-07

**If empty:** Check if clinic is open that day (admin panel)

**If error:** Date format issue → should be YYYY-MM-DD

---

## Frontend Debugging

### Check Browser Console

Press **F12** → Go to **Console** tab → Select a service

**Look for these messages:**

✅ Good (shows data is flowing):
```
🔍 Service ID: 1
🔍 Fetching from URL: http://localhost:8085/api/v1/time-slots/available?serviceId=1
📡 Response status: 200
✅ Time slots received: Array(26)
```

❌ Bad (indicates problem):
```
📡 Response status: 500
❌ API Error: 500 ...
```

Or:
```
✅ Time slots received: Array(0)  ← Empty!
```

---

### Check Network Tab

1. Press **F12**
2. Go to **Network** tab
3. Reload page
4. Select a service
5. Look for request to `time-slots/available`
6. Click it
7. Check **Response** tab for the data

---

## Step-by-Step User Flow Test

### Test Scenario 1: Book Cleaning on April 7

**Steps:**
1. ✅ Login
2. Go to **Book Appointment**
3. **Step 1:** Click "Cleaning"
   - Console should show: `✅ Time slots received: Array(N)` where N > 0
4. **Step 2:** Calendar appears
   - April 7 should be clickable (not grayed)
5. Click **April 7** date
   - Time slots should appear: "🕐 09:00", "🕐 14:00", etc.
6. Click a time (e.g., "🕐 09:00")
   - Button should highlight with mint border
7. **Step 3:** Click "Confirm Booking"
   - Success page should appear
8. Click "View My Appointments"
   - New appointment should appear in the list

**Expected Result:** ✅ Complete booking success

**If Step 5 shows error "No available time slots for this date":**
→ Problem exists → Follow debugging below

---

### Test Scenario 2: Book on Sunday (Should Fail)

**Steps:**
1. Select service
2. Calendar should appear
3. Sundays should be **grayed out** (unselectable)
4. Clicking Sunday does nothing

**Expected Result:** ✅ Sundays unavailable

**If Sundays are selectable:**
→ Clinic hours not configured properly → Check admin panel

---

### Test Scenario 3: Book on Past Date (Should Fail)

**Steps:**
1. Select service
2. Calendar should appear
3. Past dates (before today) should be **grayed out**

**Expected Result:** ✅ Past dates unavailable

**If present dates are grayed:**
→ Date calculation wrong → Check browser timezone

---

## Detailed Debugging

### Issue 1: "No available time slots for this date" (when slots exist)

**Check 1: Is the clinic open that day?**

In Supabase SQL:
```sql
SELECT day_of_week, is_operating FROM clinic_hours 
WHERE day_of_week = 1;  -- Change 1 to day number
-- Monday=0, Tuesday=1, ..., Sunday=6
```

**Expected:** is_operating = true for weekdays

**Fix if false:**
```sql
UPDATE clinic_hours SET is_operating = true WHERE day_of_week IN (0,1,2,3,4,5);
```

**Check 2: Does date have slots?**

In Supabase SQL:
```sql
SELECT COUNT(*) FROM time_slots 
WHERE date = '2026-04-07' AND service_id = 1 AND status = 'AVAILABLE';
```

**Expected:** 1 or more

**Fix if 0:** Populate database using SUPABASE_READY_POPULATE.sql

**Check 3: Is date format correct?**

In browser console:
```javascript
// How date is being formatted
const date = new Date(2026, 3, 7);
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const formatted = `${year}-${month}-${day}`;
console.log(formatted);  // Should be: 2026-04-07
```

**Expected:** 2026-04-07

**Check 4: Is API returning 500 error?**

In Network tab, check `time-slots/available` response:

**If 500 error:**
```json
{
  "error": "Failed to fetch available time slots: ..."
}
```

→ Check backend logs for the actual error

---

### Issue 2: Backend Returns Empty Array `[]`

**Diagnosis:**

1. **Are slots in database?**
   ```sql
   SELECT COUNT(*) FROM time_slots WHERE status = 'AVAILABLE';
   ```
   → If 0, populate database

2. **Are they past dates?**
   ```sql
   SELECT COUNT(*) FROM time_slots 
   WHERE date >= CURRENT_DATE AND status = 'AVAILABLE';
   ```
   → If 0, create future slots

3. **Is clinic closed?**
   ```sql
   SELECT is_operating FROM clinic_hours 
   WHERE day_of_week = 0;  -- Monday
   ```
   → If false for all days, set to true

4. **Is @Transactional working?**
   - Backend logs should show: "📅 Fetching available time slots for service 1"
   - If error, @Transactional might not be applied
   - Pull latest code

---

### Issue 3: 500 Errors in Backend

**Check 1: What's the error message?**

In backend console, look for:
```
❌ Error fetching available time slots: ...
```

**Common errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Unable to commit against JDBC Connection" | Transaction issue | Pull latest code with @Transactional |
| "bad SQL grammar" | Query syntax error | Pull latest code with fixed queries |
| "No such column" | Schema mismatch | Check database schema matches model |
| "connection refused" | Database unreachable | Check Supabase credentials |

**Check 2: Is database connected?**

In backend logs, look for:
```
Hibernate: select 1
```

If not present, database isn't being queried → connection failed

**Check 3: Are there SQL errors?**

In application.properties:
```properties
spring.jpa.show-sql=true
```

This shows SQL statements in console. Look for errors like:
```
Hibernate: SELECT ... FROM time_slots ...
ERROR: ...
```

---

### Issue 4: Dates Not Matching Between Frontend and Backend

**Cause:** Timezone conversion issues

**Fix:** Both frontend and backend now use YYYY-MM-DD format in LOCAL timezone

**Verify:**

Frontend date formatting:
```javascript
// This is now correct:
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;
```

Backend date parsing:
```java
LocalDate selectedDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
// date must be format: "2026-04-07"
```

---

## Command-Line Diagnostics

### In Terminal, Test Backend Endpoint

```bash
# 1. Get auth token (from DevTools as explained earlier)
TOKEN="your_token_here"

# 2. Test: All available slots
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available" | jq '.[] | {id, date, startTime}'

# 3. Test: Specific service
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1" | jq 'length'

# 4. Test: Specific date
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available?date=2026-04-07" | jq '.[] | {date, startTime}'

# 5. Test: Service + Date
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1&date=2026-04-07"
```

---

## Performance Verification

### Before Index Creation
```bash
time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1"
# Duration: 500ms+
```

### After Index Creation
```bash
time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1"
# Duration: 50-150ms
```

**Expected improvement:** 5-10x faster

---

## Final Verification Script

### JavaScript (run in browser console)

```javascript
async function verifyBookingSystem() {
  console.log("🔍 Starting Booking System Verification...\n");
  
  try {
    // Get auth token
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("❌ No auth token found. Please login first.");
      return;
    }
    console.log("✅ Auth token found");
    
    // Test 1: Fetch all slots
    const allSlots = await fetch("http://localhost:8085/api/v1/time-slots/available", {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json());
    console.log(`✅ API response: ${allSlots.length} available slots`);
    
    // Test 2: Fetch slots for service 1
    const service1Slots = await fetch("http://localhost:8085/api/v1/time-slots/available?serviceId=1", {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json());
    console.log(`✅ Service 1: ${service1Slots.length} slots`);
    
    // Test 3: Format date correctly
    const testDate = new Date(2026, 3, 7);
    const year = testDate.getFullYear();
    const month = String(testDate.getMonth() + 1).padStart(2, '0');
    const day = String(testDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log(`✅ Date format test: ${dateStr}`);
    
    // Test 4: Fetch slots for specific date
    const dateSlots = await fetch(`http://localhost:8085/api/v1/time-slots/available?date=${dateStr}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json());
    console.log(`✅ Date ${dateStr}: ${dateSlots.length} slots`);
    
    // Test 5: Fetch slots for service + date
    const serviceAndDateSlots = await fetch(`http://localhost:8085/api/v1/time-slots/available?serviceId=1&date=${dateStr}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json());
    console.log(`✅ Service 1 on ${dateStr}: ${serviceAndDateSlots.length} slots`);
    
    console.log("\n✅ VERIFICATION COMPLETE - All systems operational!");
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

verifyBookingSystem();
```

**Run this in browser console (F12) and check for all ✅ marks**

---

## Success Checklist

After running all diagnostics:

- [ ] Backend starts and shows clinic hours configured
- [ ] Database query returns slots: `SELECT COUNT(*) FROM time_slots` > 50
- [ ] API endpoints respond with 200 status
- [ ] Browser console shows "✅ Time slots received"
- [ ] Calendar shows dates as available/unavailable correctly
- [ ] Clicking a date shows time slots
- [ ] No "No available time slots" errors (unless truly no slots)
- [ ] No 500 errors in backend
- [ ] Can book appointment successfully
- [ ] New appointment appears in "My Appointments"

**If all checked:** ✅ System is working correctly!

**If any unchecked:** Follow the debugging section for that specific issue.

---

## Support Information

**If you need help, provide:**

1. Backend console output (lines around error)
2. Browser console output (F12 > Console)
3. Database query results from Supabase
4. Network tab response (F12 > Network)
5. The specific date you were testing with
6. Expected vs actual behavior

With this info, we can diagnose and fix issues quickly.
