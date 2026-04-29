# Booking System Step 2 - Pre-Testing Checklist

## Pre-Test Setup (Do First!)

### Backend Setup
- [ ] Pull latest code from repository
- [ ] Run `mvn clean compile` in `smilecare-backend`
- [ ] Verify: No compilation errors
- [ ] Run `mvn spring-boot:run` or start via IDE
- [ ] Wait 10-15 seconds for startup
- [ ] Check backend console for:
  - [ ] ✓ Test user created successfully
  - [ ] ✓ Clinic hours already configured
  - [ ] ✓ Current database state shows 4 services, 50+ time slots

**If backend won't start:**
- Error about database? → Check Supabase credentials in `application.properties`
- Compilation error? → Pull latest code again
- Port already in use? → Run on different port: `mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8086"`

### Frontend Setup
- [ ] Pull latest code from repository
- [ ] Run `npm install` in `smilecare-frontend`
- [ ] Run `npm run dev`
- [ ] Browser opens to `http://localhost:5173`
- [ ] **Clear browser cache:** 
  - Windows: Ctrl+Shift+Delete
  - Mac: Cmd+Shift+Delete
- [ ] Close and reopen the application

**If frontend shows old code:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear cache and reload

### Database Check
- [ ] Open Supabase dashboard
- [ ] Navigate to SQL editor
- [ ] Run query:
  ```sql
  SELECT COUNT(*) as available_slots FROM time_slots 
  WHERE status = 'AVAILABLE' AND date >= CURRENT_DATE;
  ```
- [ ] Result should show: **50 or more** available slots
- [ ] If result is 0 or very low → Database is empty, proceed to "Database Population" section below

---

## Testing Flow (Follow in Order)

### Test 1: Login
- [ ] Go to `http://localhost:5173`
- [ ] Click "Login"
- [ ] Username: `testuser`
- [ ] Password: `Test@123`
- [ ] Click "Login"
- [ ] **Expected:** Dashboard appears with "Book Appointment" button
- [ ] **Common issue:** "Invalid credentials" → Try default admin: Username `admin`, Password `admin@123`

**Troubleshooting:**
- Page blank? → Hard refresh (Ctrl+Shift+R)
- Network error? → Backend stopped, restart it
- "Server error occurred"? → Check backend console for 500 errors

---

### Test 2: Start Booking Flow
- [ ] Click "Book Appointment"
- [ ] **Step 1: Choose Service** page appears
- [ ] Open browser DevTools: Press **F12**
- [ ] Go to **Console** tab
- [ ] Click "Cleaning" service
- [ ] **Expected Logs in Console:**
  ```
  🔍 Service ID: 1
  🔍 Fetching from URL: http://localhost:8085/api/v1/time-slots/available?serviceId=1
  📡 Response status: 200
  ✅ Time slots received: Array(26)    ← Shows slots found!
  ```
- [ ] **Calendar appears** with dates

**If Console shows:**
- `Response status: 500` → Backend error, check backend logs
- `Time slots received: Array(0)` → No slots for this service, check database
- `API Error: Network request failed` → Backend not running

---

### Test 3: Select Date
- [ ] Look at calendar
- [ ] Dates should appear: "1", "2", "3", etc. for April 2026
- [ ] **Sundays should be grayed out** (not selectable):
  - April 6, 13, 20, 27 should appear lighter/disabled
- [ ] **Past dates should be grayed out** (before today)
- [ ] Click date **April 7** (Monday)
- [ ] **Expected:**
  - [ ] Time slots appear below calendar: "🕐 09:00", "🕐 14:00", etc.
  - [ ] Slots are clickable buttons
  - [ ] No error messages

**If Error: "No available time slots for this date"**
→ This means database has no slots for April 7. Follow **Database Population** section below.

**If Sundays are NOT grayed out**
→ Clinic configuration issue, check admin settings.

**If NO time slots appear (calendar is empty)**
→ Check database has time slots (use SQL query above).

---

### Test 4: Select Time Slot
- [ ] Click a time slot (e.g., "🕐 09:00")
- [ ] **Expected:**
  - [ ] Button highlights with mint/teal border
  - [ ] Status shows: "✅ 09:00 - 10:00 with Cleaning"
- [ ] **Confirm Booking button appears**

**If slot doesn't highlight:**
- Refresh page and try again
- Check browser console for errors (F12 → Console)

---

### Test 5: Confirm Booking
- [ ] Click "Confirm Booking" button
- [ ] **Expected:**
  - [ ] Success page appears
  - [ ] Message: "✅ Appointment booked successfully!"
  - [ ] Option to "View My Appointments" or "Book Another"

**If Page shows error:**
- "Appointment could not be booked" → Backend error, check logs
- Fields invalid → Fill in missing information

---

### Test 6: Verify Appointment Was Created
- [ ] Click "View My Appointments"
- [ ] **Expected:**
  - [ ] New appointment appears in list
  - [ ] Shows date, time, service name
  - [ ] Status shows: "Confirmed" (not "Approved")

**If appointment NOT in list:**
- Refresh page (F5)
- Logout and login again
- Check database: `SELECT * FROM appointments WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1;`

---

## Error Resolution

### Backend Errors

#### 500 Error on Time-Slots Endpoint
**Backend console shows error:**
```
❌ Error fetching available time slots: ...
```

**Resolution Steps:**
1. Pull latest code
2. Check that TimeSlotService has `@Transactional(readOnly = true)` on methods
3. Check that TimeSlotRepository has 6 `@Query` methods
4. Check that TimeSlotController has date parameter handling
5. Rebuild: `mvn clean compile`
6. Restart backend

#### Database Connection Error
**Backend console shows:**
```
Connection refused: connect
```

**Resolution Steps:**
1. Verify Supabase is accessible: `ping supabase.com`
2. Check credentials in `application.properties`:
   - URL should be: `jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres`
   - Username: `postgres`
   - Password: Check your Supabase dashboard
3. Restart backend

#### Bad SQL Grammar
**Backend console shows:**
```
ERROR: bad SQL grammar: ...
```

**Resolution Steps:**
1. Most likely: Old code without custom @Query methods
2. Pull latest code
3. Check TimeSlotRepository for:
   ```java
   @Query("SELECT ts FROM TimeSlot ts WHERE ...")
   ```
4. Rebuild and restart

---

### Frontend Errors

#### "No available time slots for this date" (when slots exist)
**Resolution Steps:**

1. **Check if clinic is open that day:**
   - Open Supabase SQL Editor
   - Run: `SELECT * FROM clinic_hours WHERE day_of_week = 1;` (for Tuesday)
   - If `is_operating = false`, update: `UPDATE clinic_hours SET is_operating = true WHERE day_of_week IN (0,1,2,3,4,5);`

2. **Check if database has slots for that date:**
   - Run: `SELECT COUNT(*) FROM time_slots WHERE date = '2026-04-07' AND status = 'AVAILABLE';`
   - If 0, populate database (see section below)

3. **Check date format:**
   - Open DevTools Console (F12)
   - Run:
     ```javascript
     const d = new Date(2026, 3, 7);
     const y = d.getFullYear();
     const m = String(d.getMonth() + 1).padStart(2, '0');
     const day = String(d.getDate()).padStart(2, '0');
     console.log(`${y}-${m}-${day}`);  // Should be: 2026-04-07
     ```

4. **Check API response:**
   - DevTools → Network tab
   - Click date in calendar
   - Look for request to `time-slots/available?...`
   - Click it
   - Check Response tab for slots

#### "Can't load time slots" / API Error
**Resolution Steps:**

1. Backend not running?
   - Check backend terminal
   - If stopped, restart it: `mvn spring-boot:run`

2. Check backend response:
   - DevTools → Network tab
   - Look for failed request
   - Check status code:
     - 401 = Not authenticated, logout and login again
     - 500 = Backend error, check backend console
     - Other = Network issue, restart backend

3. Check browser console (F12 → Console):
   - Look for red error messages
   - Paste error in browser search: might have docs about it

#### Calendar not showing any dates
**Resolution Steps:**

1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Clear browser cache:
   - Windows: Ctrl+Shift+Delete
   - Mac: Cmd+Shift+Delete
   - Select "All time", check "Cached images and files"
   - Click Clear
3. Close browser completely
4. Reopen and test again

---

## Database Population

### If You Have 0 Available Slots

**Recommended:** Use the pre-population SQL file (if available)

**Manual Steps:**

1. Open Supabase dashboard
2. Go to SQL Editor
3. Run this query to create slots for next 30 days:

```sql
-- Create time slots for all services for next 30 days
INSERT INTO time_slots (date, start_time, end_time, status, service_id)
SELECT 
  d.date,
  s.start_time,
  s.end_time,
  'AVAILABLE',
  1  -- Service ID (1=Cleaning, 2=Dental Check, etc.)
FROM (
  SELECT CURRENT_DATE + GENERATE_SERIES(1, 30) * INTERVAL '1 day' as date
) d,
(
  SELECT CAST('09:00' AS TIME) as start_time, CAST('10:00' AS TIME) as end_time UNION
  SELECT '10:00', '11:00' UNION
  SELECT '14:00', '15:00' UNION
  SELECT '15:00', '16:00'
) s
WHERE EXTRACT(DOW FROM d.date) NOT IN (0)  -- Exclude Sundays
ORDER BY d.date, s.start_time;
```

4. Run for each service ID (1, 2, 3, 4)
   - Change the `WHERE` clause for service 2 to check its operating hours
   - Or modify the query to insert for all services in one go

**Verify:**
```sql
SELECT COUNT(*) FROM time_slots WHERE status = 'AVAILABLE' AND date >= CURRENT_DATE;
```

Should now show: 50+

---

## Performance Check

### Response Time Should Be

- **After first backend startup:** 200-500ms (initializing)
- **After stabilizing:** 50-150ms per request
- **With database indexes (optional):** 20-50ms

### To Measure:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by: XHR/Fetch
4. Click date in calendar
5. Find request to `time-slots/available`
6. Check **Time** column

**All three categories should take less than 1 second total.**

---

## Final Success Indicators

### All Green (System Working)
- ✅ Can login successfully
- ✅ When selecting service, console shows "✅ Time slots received"
- ✅ Calendar appears with clickable dates
- ✅ Clicking date shows time slots
- ✅ Can select time and click "Confirm"
- ✅ Booking success page appears
- ✅ Appointment appears in "My Appointments"
- ✅ No 500 errors in backend
- ✅ No red errors in browser console

### Issues Found (Need Fixing)
- ❌ Backend won't start → Check database credentials and Java version
- ❌ No time slots appear → Database is empty, populate it
- ❌ 500 errors from API → Pull latest code, rebuild, restart
- ❌ Frontend shows old code → Hard refresh and clear cache
- ❌ "No slots available" on dates that should have slots → Check clinic hours and database

---

## One-Command Test

If you want to quickly verify everything is working:

**In browser console (F12 → Console):**

```javascript
async function quickTest() {
  const token = localStorage.getItem("accessToken");
  if (!token) { console.log("❌ Not logged in"); return; }
  
  const res = await fetch("http://localhost:8085/api/v1/time-slots/available?serviceId=1", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const slots = await res.json();
  
  if (res.status === 200 && slots.length > 0) {
    console.log(`✅ SYSTEM WORKING: ${slots.length} slots available`);
  } else {
    console.log(`❌ ISSUES FOUND: Status ${res.status}, ${slots.length} slots`);
  }
}

quickTest();
```

**Expected:** `✅ SYSTEM WORKING: 26 slots available`

**If error:** Follow the debugging steps above.

---

## Support Info

**Need help? Collect this info:**

1. Backend console output (first 50 lines after startup)
2. Browser console output (F12, all error lines)
3. DevTools Network tab (screenshot of failed request)
4. Database query result (how many slots: `SELECT COUNT(*) FROM time_slots;`)
5. Date you were testing with (e.g., "April 7, 2026")
6. What you expected vs what you got

With this info, issues can be diagnosed and fixed quickly!
