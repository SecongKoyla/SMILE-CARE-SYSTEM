# 🚨 URGENT: Fix 500 Error - Clinic Hours Endpoint

**Status:** Critical  
**Priority:** HIGH - Fix immediately before deploying any further changes  
**Time to Fix:** 5-10 minutes  

---

## Problem

```
GET /api/v1/clinic-hours → 500 Internal Server Error
Error: Hibernate transaction: Unable to commit against JDBC Connection; bad SQL grammar []
```

## Root Cause

The `getAllClinicHours()` method in `ClinicHoursService.java` is **missing** the `@Transactional(readOnly = true)` annotation. This causes Hibernate to:
1. Open and close a database transaction immediately
2. Attempt DTO conversion AFTER the session closes
3. Fail when accessing lazy-loaded data

---

## Solution (2 Files to Edit)

### File 1: ClinicHoursService.java

**Location:** `src/main/java/com/smilecare/smilecare_backend/common/service/ClinicHoursService.java`

**Find these methods:**

```java
public List<ClinicHoursDTO> getAllClinicHours() {
    return repository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
}

public ClinicHoursDTO getClinicHoursByDay(Integer dayOfWeek) {
    return repository.findByDayOfWeek(dayOfWeek)
            .map(this::toDTO)
            .orElse(null);
}
```

**Replace with:**

```java
@Transactional(readOnly = true)  // ← ADD THIS LINE
public List<ClinicHoursDTO> getAllClinicHours() {
    return repository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
}

@Transactional(readOnly = true)  // ← ADD THIS LINE
public ClinicHoursDTO getClinicHoursByDay(Integer dayOfWeek) {
    return repository.findByDayOfWeek(dayOfWeek)
            .map(this::toDTO)
            .orElse(null);
}
```

---

### File 2: application.properties

**Location:** `src/main/resources/application.properties`

**Find:**
```properties
# Spring Data JPA
spring.jpa.hibernate.ddl-auto=validate
```

**Add these lines after it:**
```properties
# Fix Hibernate lazy loading issues
spring.jpa.properties.hibernate.enable_lazy_load_no_trans=false
spring.jpa.open-in-view=false
```

**Full context should look like:**
```properties
# Spring Data JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false

# Fix Hibernate lazy loading issues
spring.jpa.properties.hibernate.enable_lazy_load_no_trans=false
spring.jpa.open-in-view=false
```

---

## Verification (Test the Fix)

### Step 1: Rebuild Backend

```bash
cd smilecare-backend/smilecare-backend
./mvnw clean compile
./mvnw spring-boot:run
```

**Expected log output:**
```
✅ Started SmileCareApplication
Tomcat initialized with port(s): 8085 (http)
```

---

### Step 2: Test the Endpoint

**Option A: Using curl**
```bash
curl -X GET http://localhost:8085/api/v1/clinic-hours \
  -H "Content-Type: application/json"
```

**Option B: Using browser**
Visit: `http://localhost:8085/api/v1/clinic-hours`

**Option C: Using VS Code REST Client**
```http
GET http://localhost:8085/api/v1/clinic-hours
Content-Type: application/json
```

---

### Step 3: Expected Response

**Status:** 200 OK

**Body:**
```json
[
  {
    "id": 1,
    "dayOfWeek": 0,
    "dayName": "Monday",
    "isOperating": true,
    "morningStart": "09:00:00",
    "morningEnd": "12:00:00",
    "afternoonStart": "14:00:00",
    "afternoonEnd": "17:00:00"
  },
  {
    "id": 2,
    "dayOfWeek": 1,
    "dayName": "Tuesday",
    "isOperating": true,
    "morningStart": "09:00:00",
    "morningEnd": "12:00:00",
    "afternoonStart": "14:00:00",
    "afternoonEnd": "17:00:00"
  },
  ...
]
```

**If you see this, the error is FIXED! ✅**

---

## Troubleshooting

### If Still Getting 500 Error

**1. Check logs for specific error:**
```bash
# Look for actual error message in console output
# Common issues:
# - "No sequence named clinic_hours_id_seq"
# - "Column not found"
# - "Cannot find table"
```

**2. Verify sequence exists:**
```sql
-- In Supabase SQL Editor:
SELECT EXISTS (
  SELECT 1 FROM information_schema.sequences 
  WHERE sequence_name = 'clinic_hours_id_seq'
);
```

If FALSE, create it:
```sql
CREATE SEQUENCE clinic_hours_id_seq;
SELECT setval('clinic_hours_id_seq', (SELECT MAX(id) FROM clinic_hours) + 1);
```

**3. Verify table exists:**
```sql
SELECT COUNT(*) FROM clinic_hours;
```

Should return ≥ 0 (not an error).

**4. Check annotations are imported:**
```java
// Top of ClinicHoursService.java should have:
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
```

---

## Before You Continue

✅ **Do NOT proceed with deployment until this endpoint returns 200 OK**

Once fixed, you can safely:
- Deploy frontend changes
- Implement admin panel
- Add hourly slot generation
- Deploy to production

---

## Checklist

- [ ] Added `@Transactional(readOnly = true)` to `getAllClinicHours()` method
- [ ] Added `@Transactional(readOnly = true)` to `getClinicHoursByDay()` method
- [ ] Updated `application.properties` with lazy loading fix
- [ ] Rebuilt backend: `./mvnw clean compile`
- [ ] Started backend: `./mvnw spring-boot:run`
- [ ] Tested endpoint: GET /api/v1/clinic-hours
- [ ] Received 200 OK with clinic hours array ✅

---

## Need Help?

If still getting the error, check:
1. Exact error message in backend logs
2. Database connectivity
3. PostgreSQL version compatibility
4. Sequence/table existence

Share the exact error from the console, and we can diagnose further.
