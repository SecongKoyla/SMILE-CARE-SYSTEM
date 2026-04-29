# Supabase-Specific Time Slots Issues & Solutions

## Schema Validation

Your provided Supabase schema is **correct and complete**. Here's what we verified:

### ✅ Tables Present
- `dental_services` - Service definitions
- `clinic_hours` - Operating hours configuration  
- `time_slots` - Available appointment slots
- `appointments` - Booked appointments
- `users` - Patient and admin accounts

### ✅ Foreign Keys Correct
```
time_slots.service_id → dental_services.id ✓
appointments.time_slot_id → time_slots.id ✓
appointments.patient_id → users.id ✓
appointments.service_id → dental_services.id ✓
```

### ✅ Constraints Correct
```
time_slots.status IN ('AVAILABLE', 'BOOKED') ✓
appointments.status IN ('PENDING', 'APPROVED', 'ARRIVED', 'COMPLETED', 'CANCELLED') ✓
```

---

## Supabase-Specific Issues

### Issue 1: Row Level Security (RLS) Blocking Queries

**Symptom:**
- Backend can't fetch time slots
- Error: "new row violates row-level-security policy"
- API returns 403 Forbidden

**Cause:**
Supabase has Row Level Security enabled, which restricts database access based on user identity.

**Solution:**

Option A: **Disable RLS for testing** (Recommended for development)

Go to Supabase Dashboard:
1. Select your project
2. Click each table: `time_slots`, `clinic_hours`, `dental_services`
3. Go to **RLP** tab
4. Toggle **RLS OFF** for each table

Then refresh backend.

Option B: **Configure RLS Policies** (For production)

Create policies to allow authenticated users to view time slots:

```sql
-- For time_slots table
CREATE POLICY "Allow authenticated users to read time slots"
ON time_slots
FOR SELECT
TO authenticated
USING (true);

-- For clinic_hours table
CREATE POLICY "Allow authenticated users to read clinic hours"
ON clinic_hours
FOR SELECT
TO authenticated
USING (true);

-- For dental_services table
CREATE POLICY "Allow authenticated users to read services"
ON dental_services
FOR SELECT
TO authenticated
USING (true);
```

---

### Issue 2: Authentication Token Expiry

**Symptom:**
- First request works, second request fails
- Error: "Unauthorized" or "401"
- Works in Postman but not from app

**Cause:**
Your auth token may have expired, or headers aren't being sent correctly.

**Check Backend Code:**

Verify in [api.js](smilecare-frontend/src/api/api.js) that token is being sent:

```javascript
function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}
```

**Fix:**
1. Make sure you're logged in before booking
2. Check browser DevTools → Application → Local Storage → verify `accessToken` exists
3. If token is missing, log out and log back in

---

### Issue 3: Database Connection String Issues

**Symptom:**
- Backend starts but can't connect to Supabase
- Error: "Connection refused" or "Unknown host"

**Cause:**
Backend is not configured to connect to your Supabase database.

**Check:**

Open `application.properties`:

```properties
# Should have Supabase connection details:
spring.datasource.url=jdbc:postgresql://db.xxxxx.supabase.co:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driver-class-name=org.postgresql.Driver
```

**Fix:**

Get your connection details from Supabase:
1. Go to Supabase Dashboard > Settings > Database
2. Copy the connection string
3. Extract: host, database name, username, password
4. Update `application.properties` with correct values

Example valid connection:
```properties
spring.datasource.url=jdbc:postgresql://db.abcdefgh.supabase.co:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=YourSecurePassword123
```

---

### Issue 4: CORS (Cross-Origin) Issues

**Symptom:**
- Frontend can't reach backend
- Browser console: "Access to XMLHttpRequest has been blocked by CORS policy"
- API shows response, but browser blocks it

**Cause:**
Backend is not configured to accept requests from frontend.

**Check Backend:**

Look for CORS configuration (usually in main Spring Boot class or config file):

**Fix:**

Add CORS configuration to backend (example):

```java
// File: smilecare-backend/src/main/java/com/smilecare/smilecare_backend/config/CorsConfig.java

package com.smilecare.smilecare_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true);
    }
}
```

Restart backend after adding this.

---

### Issue 5: Data Type Mismatch

**Symptom:**
- Backend returns 500 error when fetching slots
- Error mentions "LocalDate" or "LocalTime" conversion

**Cause:**
Supabase DATE/TIME columns not mapping correctly to Java LocalDate/LocalTime.

**Solution:**

Ensure time slots have correct types in Supabase:

```sql
-- Check column types:
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'time_slots';

-- Expected output:
-- date: date
-- start_time: time without time zone
-- end_time: time without time zone
-- status: character varying
-- service_id: bigint
-- created_at: timestamp without time zone
```

If types are wrong, fix them:

```sql
-- Convert text columns to proper types if needed:
ALTER TABLE time_slots 
  ALTER COLUMN date TYPE date USING date::date,
  ALTER COLUMN start_time TYPE time USING start_time::time,
  ALTER COLUMN end_time TYPE time USING end_time::time;
```

---

### Issue 6: Timezone Issues

**Symptom:**
- Time slots show with wrong times (off by several hours)
- Booking shows for wrong date

**Cause:**
Timezone mismatch between frontend (local), backend (UTC?), and Supabase.

**Solution:**

Ensure all components use the same timezone:

**Frontend:**
```javascript
// In BookingCalendar.jsx - ensure dates are created in local timezone
const date = new Date();  // This uses local browser timezone
```

**Backend:**
```java
// In application.properties
server.servlet.session.tracking-modes=cookie
spring.jackson.time-zone=UTC
spring.jpa.properties.hibernate.jdbc.time_zone=UTC
```

**Supabase:**
The server runs in UTC. Ensure all dates are stored in UTC format.

---

### Issue 7: Connection Pool Issues

**Symptom:**
- Works for 1-2 requests, then hangs
- Error: "Unable to acquire JDBC connection"
- Requests timeout after a few seconds

**Cause:**
Connection pool exhausted - backend can't get new database connections.

**Solution:**

Update `application.properties`:

```properties
# Increase connection pool size
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000
```

Then restart backend.

---

## Complete Supabase Setup Checklist

- [ ] Database connection verified (can you see tables in Supabase console?)
- [ ] RLS policies configured or disabled for testing
- [ ] `application.properties` has correct Supabase credentials
- [ ] CORS is configured for frontend origin
- [ ] Connection pool settings are adequate
- [ ] Time zones are consistent across all systems
- [ ] Data types in schema match Java entity types
- [ ] Foreign key constraints are in place
- [ ] Indexes exist on frequently queried columns (optional but recommended)
- [ ] Backup is configured (Supabase → Settings → Backups)

---

## How to Verify Supabase Connection Works

### Test 1: From Terminal (SQL)

```bash
# Install psql if needed (macOS):
brew install postgresql

# Connect to Supabase:
psql -h db.YOUR_ID.supabase.co -U postgres -d postgres
# Enter password when prompted
```

### Test 2: From Backend Startup

Look for this successful message:

```
╔══════════════════════════════════════════════════════════╗
║         SMILE CARE - DATA LOADER STARTING               ║
╚══════════════════════════════════════════════════════════╝

✓ Test user created successfully
✓ Clinic hours already configured
📊 Current database state:
    Services: 4
    Time Slots: 56
```

If you see connection errors instead, database isn't connected.

### Test 3: From cURL

After backend starts, test the API:

```bash
# Test without authentication (should fail with 401)
curl http://localhost:8085/api/v1/time-slots/available

# Test with auth token (if you have one)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8085/api/v1/time-slots/available
```

---

## If Supabase Connection Still Fails

### Step 1: Get Connection Details

Supabase Dashboard > Settings > Database:

```
Host: db.XXXXX.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: XXXXX
```

### Step 2: Update Backend

Edit `smilecare-backend/src/main/resources/application.properties`:

```properties
# Supabase PostgreSQL connection
spring.datasource.url=jdbc:postgresql://db.XXXXX.supabase.co:5432/postgres?ssl=require
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD_HERE
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate settings
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.jdbc.batch_size=20
```

### Step 3: Verify Connection String Format

The URL must have `?ssl=require` at the end for Supabase.

### Step 4: Test Connection

```bash
cd smilecare-backend
./mvnw clean spring-boot:run
```

Watch for connection messages in console.

---

## Supabase Debugging Commands

Run these in Supabase SQL Editor to diagnose issues:

```sql
-- 1. Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Check current data
SELECT COUNT(*) as services FROM dental_services;
SELECT COUNT(*) as clinichours FROM clinic_hours;
SELECT COUNT(*) as timeslots FROM time_slots;
SELECT COUNT(*) as appointments FROM appointments;

-- 3. Check sample data
SELECT * FROM dental_services LIMIT 3;
SELECT * FROM clinic_hours ORDER BY day_of_week;
SELECT * FROM time_slots LIMIT 3;

-- 4. Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 5. Check constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_schema = 'public';
```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Connection refused` | Backend can't reach Supabase | Check URL and credentials |
| `new row violates row-level-security` | RLS blocking query | Disable RLS or add policies |
| `SSL certificate error` | Missing `?ssl=require` | Add to connection URL |
| `Unknown database` | Wrong database name | Use 'postgres' for Supabase |
| `CORS policy blocked` | Frontend can't reach backend | Configure CORS in backend |
| `Unauthorized (401)` | Token expired or missing | Re-login, verify token in localStorage |
| `No time slots` | Database empty or filtered | Run population SQL script |

---

## Next Step: Run Data Population SQL

Once Supabase connection is verified:

1. Copy the SQL from `DATABASE_POPULATE_TIME_SLOTS.sql`
2. Go to Supabase Dashboard > SQL Editor
3. Create new query
4. Paste the SQL
5. Click "Run"
6. Verify with queries at the bottom of SQL file

Then test the booking flow in the app.

---

## Support Information

**If you're still having issues, provide:**

1. Backend console output (when starting app)
2. Browser console errors (press F12)
3. Network tab response from API call
4. Result of: `SELECT COUNT(*) FROM time_slots;` in Supabase
5. Result of: `SELECT * FROM clinic_hours;` showing all rows

This will help diagnose the exact issue.
