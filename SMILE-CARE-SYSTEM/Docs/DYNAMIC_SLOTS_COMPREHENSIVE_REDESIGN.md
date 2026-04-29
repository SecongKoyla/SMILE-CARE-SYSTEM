# Dynamic Hourly Time Slots - Complete System Redesign

**Date:** April 2, 2026  
**Status:** Production-Ready Solution  
**Problem:** Limited, hardcoded time slots; 500 error on clinic hours endpoint; lack of hourly flexibility

---

## TABLE OF CONTENTS

1. **Root Cause Analysis: 500 Error**
2. **Database Schema Redesign**
3. **Backend Implementation**
4. **API Endpoints**
5. **Frontend Integration**
6. **Admin Panel UI/UX**
7. **Complete Implementation Guide**

---

## PART 1: ROOT CAUSE ANALYSIS - 500 Error (Hibernate Transaction)

### Error Symptom
```
GET http://localhost:8085/api/v1/clinic-hours → 500 (Internal Server Error)
Failed to fetch clinic hours: Hibernate transaction: Unable to commit against JDBC Connection; bad SQL grammar []
```

### Root Causes (Diagnose Your Specific Issue)

#### **Cause 1: Missing @Transactional on SELECT queries** ⚠️ LIKELY
**Problem:**
```java
@Cacheable(value = "clinicHoursCache", cacheManager = "cacheManager")
@Transactional(readOnly = true)  // ← This must be present
public Map<Integer, ClinicHours> getAllClinicHoursCached() {
    List<ClinicHours> hoursList = repository.findAll();  // ← Lazy loading outside tx
    // ...
}
```

**Solution:** Ensure `@Transactional(readOnly = true)` decorates the method.

**Verification:**
```bash
# Check if method has @Transactional annotation:
grep -A 2 "@Cacheable" ClinicHoursService.java | grep -i "@Transactional"
# Should show: @Transactional(readOnly = true)
```

---

#### **Cause 2: Lazy Loading After Transaction Ends** ⚠️ LIKELY
**Problem:**
```java
@GetMapping
public ResponseEntity<?> getAllClinicHours() {
    List<ClinicHoursDTO> hours = service.getAllClinicHours();  // ← Service method
    // At this point, Hibernate session closed, lazy loading fails
    return ResponseEntity.ok(hours);
}
```

**Why it happens:**
- `getAllClinicHours()` doesn't have `@Transactional`
- Calls `repository.findAll()` which opens/closes session immediately
- If DTO conversion triggers lazy loading → BOOM

**Solution:** Add `@Transactional(readOnly = true)` to service method:
```java
@Transactional(readOnly = true)  // ← ADD THIS
public List<ClinicHoursDTO> getAllClinicHours() {
    return repository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
}
```

---

#### **Cause 3: Missing JOIN FETCH** ⚠️ IF YOU HAVE RELATIONSHIPS
**Problem:** If ClinicHours had relationships (which it doesn't), lazy loading fails:
```java
// DO NOT DO THIS (ClinicHours has no relationships, so this isn't your issue)
@Query("SELECT ch FROM ClinicHours ch")  // Missing JOIN FETCH if has relations
List<ClinicHours> findAll();
```

---

#### **Cause 4: JDBC Connection Pool Issues** ⚠️ CHECK application.properties
**Problem:**
```properties
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/smilecare
# Missing connection pool settings
```

**Solution:** Add proper pool config:
```properties
# Connection pooling
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000

# Hibernate config
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.jdbc.fetch_size=50
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
```

---

#### **Cause 5: Sequence Generator Not Found** ⚠️ IF USING SEQUENCE
**Problem:** In `ClinicHours.java`:
```java
@SequenceGenerator(name = "clinic_hours_seq", 
                   sequenceName = "clinic_hours_id_seq",  // ← Sequence doesn't exist
                   allocationSize = 1)
```

**Why:** PostgreSQL doesn't have sequence named `clinic_hours_id_seq`.

**Solution:** Check if sequence exists:
```sql
-- In Supabase SQL Editor
SELECT EXISTS (
  SELECT 1 FROM information_schema.sequences 
  WHERE sequence_name = 'clinic_hours_id_seq'
);
-- If FALSE, create it:
CREATE SEQUENCE IF NOT EXISTS clinic_hours_id_seq START 1;
```

---

### **IMMEDIATE FIX: The 500 Error**

**Add this to ClinicHoursService.java (before getAllClinicHours method):**

```java
@Transactional(readOnly = true)  // ← ADD THIS LINE
public List<ClinicHoursDTO> getAllClinicHours() {
    return repository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
}
```

**Also verify application.properties has:**
```properties
# Ensure transaction support
spring.jpa.properties.hibernate.enable_lazy_load_no_trans=false
```

---

---

## PART 2: DATABASE SCHEMA REDESIGN

### Current Schema (Limited)
```sql
CREATE TABLE clinic_hours (
  id BIGSERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL,
  is_operating BOOLEAN NOT NULL,
  morning_start TIME,
  morning_end TIME,
  afternoon_start TIME,
  afternoon_end TIME,
  updated_at TIMESTAMP
);
-- Problem: No hour-by-hour control, no booking tracking
```

### Redesigned Schema (Production-Ready)

```sql
-- ============================================================
-- TABLE 1: clinic_hours (NO CHANGES - Keep existing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinic_hours (
  id BIGSERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_operating BOOLEAN NOT NULL DEFAULT true,
  morning_start TIME,
  morning_end TIME,
  afternoon_start TIME,
  afternoon_end TIME,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_of_week)
);

COMMENT ON TABLE clinic_hours IS 'Clinic operating hours by day of week (0=Mon, 6=Sun)';
COMMENT ON COLUMN clinic_hours.day_of_week IS '0=Monday, 1=Tuesday, ..., 6=Sunday';


-- ============================================================
-- TABLE 2: time_slots (KEEP EXISTING - Pre-generate all slots)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.time_slots (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL,
  "date" DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'DISABLED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES dental_service(id) ON DELETE CASCADE,
  UNIQUE(service_id, "date", start_time)
);

CREATE INDEX idx_time_slots_service_date ON time_slots(service_id, "date");
CREATE INDEX idx_time_slots_date_status ON time_slots("date", status);
CREATE INDEX idx_time_slots_service_status ON time_slots(service_id, status);

COMMENT ON TABLE time_slots IS 'Available appointment time slots generated from clinic hours';
COMMENT ON COLUMN time_slots.status IS 'AVAILABLE=can book, BOOKED=taken, DISABLED=admin disabled';


-- ============================================================
-- TABLE 3: appointments (TRACK BOOKINGS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  time_slot_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES app_user(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES dental_service(id) ON DELETE CASCADE,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  UNIQUE(time_slot_id)
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_service ON appointments(service_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_timeslot ON appointments(time_slot_id);

COMMENT ON TABLE appointments IS 'Patient appointments linked to time slots';


-- ============================================================
-- TABLE 4: availability_overrides (ADMIN CONTROL - NEW)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.availability_overrides (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT,
  "date" DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  is_available BOOLEAN NOT NULL DEFAULT false,
  reason VARCHAR(255),
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES dental_service(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES app_user(id),
  UNIQUE(service_id, "date", hour)
);

CREATE INDEX idx_availability_overrides_date ON availability_overrides("date");
CREATE INDEX idx_availability_overrides_service_date ON availability_overrides(service_id, "date");

COMMENT ON TABLE availability_overrides IS 'Admin overrides for specific hours (disable/enable slots)';
COMMENT ON COLUMN availability_overrides.is_available IS 'FALSE=slot disabled, TRUE=slot enabled despite booking';


-- ============================================================
-- TABLE 5: slot_generation_log (AUDIT - OPTIONAL)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.slot_generation_log (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  slots_generated INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES dental_service(id) ON DELETE CASCADE
);

CREATE INDEX idx_slot_generation_log_date ON slot_generation_log(generated_at);

COMMENT ON TABLE slot_generation_log IS 'Audit trail for time slot generation';


-- ============================================================
-- VIEWS SECTION: Helper Views for Easy Querying
-- ============================================================

-- View 1: Hourly availability with bookings and overrides
CREATE OR REPLACE VIEW available_slots_detailed AS
SELECT 
  ts.id,
  ts.service_id,
  ts."date",
  ts.start_time,
  ts.end_time,
  EXTRACT(HOUR FROM ts.start_time)::INTEGER AS hour_of_day,
  ts.status,
  CASE 
    WHEN ts.status = 'BOOKED' THEN false
    WHEN ts.status = 'DISABLED' THEN false
    WHEN ao.is_available = false THEN false
    WHEN EXTRACT(DOW FROM ts."date") = 0 THEN (
      SELECT is_operating FROM clinic_hours WHERE day_of_week = 6
    )
    ELSE (
      SELECT is_operating FROM clinic_hours 
      WHERE day_of_week = (EXTRACT(DOW FROM ts."date")::INTEGER - 1) % 7
    )
  END AS is_available,
  COALESCE(ao.reason, '') AS override_reason,
  a.id IS NOT NULL AS is_booked
FROM time_slots ts
LEFT JOIN availability_overrides ao 
  ON ts.service_id = ao.service_id 
  AND ts."date" = ao."date"
  AND EXTRACT(HOUR FROM ts.start_time)::INTEGER = ao.hour
LEFT JOIN appointments a 
  ON ts.id = a.time_slot_id 
  AND a.status IN ('PENDING', 'CONFIRMED');

COMMENT ON VIEW available_slots_detailed IS 'Comprehensive view of slot availability with all factors';


-- View 2: Daily clinic stats
CREATE OR REPLACE VIEW clinic_daily_stats AS
SELECT 
  ts."date",
  ts.service_id,
  COUNT(*) AS total_slots,
  COUNT(CASE WHEN ts.status = 'AVAILABLE' THEN 1 END) AS available_slots,
  COUNT(CASE WHEN ts.status = 'BOOKED' THEN 1 END) AS booked_slots,
  COUNT(CASE WHEN ts.status = 'DISABLED' THEN 1 END) AS disabled_slots
FROM time_slots ts
GROUP BY ts."date", ts.service_id;

COMMENT ON VIEW clinic_daily_stats IS 'Daily statistics for each service';

```

---

### Migration Script (If You Have Existing Data)

```sql
-- Step 1: Create new tables
-- (Run all CREATE TABLE statements above)

-- Step 2: Verify clinic_hours sequence exists
CREATE SEQUENCE IF NOT EXISTS clinic_hours_id_seq START 1;

-- Step 3: Add missing time_slots if needed
-- (Assuming time_slots table already exists from previous steps)

-- Step 4: Create missing tables
-- (availability_overrides, slot_generation_log, etc.)

-- Step 5: Verify sequences
SELECT setval('clinic_hours_id_seq', (SELECT MAX(id) FROM clinic_hours) + 1);

-- Step 6: Check data integrity
SELECT COUNT(*) FROM clinic_hours;
SELECT COUNT(*) FROM time_slots;
SELECT COUNT(*) FROM appointments;
```

---

---

## PART 3: BACKEND IMPLEMENTATION

### 3.1 New Entity: AvailabilityOverride.java

```java
package com.smilecare.smilecare_backend.timeslot.model;

import jakarta.persistence.*;
import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.user.model.User;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "availability_overrides", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"service_id", "date", "hour"}))
public class AvailabilityOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private DentalService service;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Integer hour; // 0-23

    @Column(nullable = false)
    private Boolean isAvailable; // false = disabled, true = force enabled

    private String reason;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DentalService getService() { return service; }
    public void setService(DentalService service) { this.service = service; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Integer getHour() { return hour; }
    public void setHour(Integer hour) { this.hour = hour; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
```

---

### 3.2 Repository: AvailabilityOverrideRepository.java

```java
package com.smilecare.smilecare_backend.timeslot.repository;

import com.smilecare.smilecare_backend.timeslot.model.AvailabilityOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilityOverrideRepository extends JpaRepository<AvailabilityOverride, Long> {

    /**
     * Get override for specific service, date, and hour
     */
    Optional<AvailabilityOverride> findByServiceIdAndDateAndHour(Long serviceId, LocalDate date, Integer hour);

    /**
     * Get all overrides for a specific date
     */
    @Query("SELECT ao FROM AvailabilityOverride ao WHERE ao.date = :date ORDER BY ao.hour ASC")
    List<AvailabilityOverride> findByDate(LocalDate date);

    /**
     * Get all overrides for service on specific date
     */
    @Query("SELECT ao FROM AvailabilityOverride ao WHERE ao.service.id = :serviceId AND ao.date = :date ORDER BY ao.hour ASC")
    List<AvailabilityOverride> findByServiceAndDate(Long serviceId, LocalDate date);

    /**
     * Get all overrides for service between dates
     */
    @Query("SELECT ao FROM AvailabilityOverride ao WHERE ao.service.id = :serviceId AND ao.date BETWEEN :fromDate AND :toDate ORDER BY ao.date, ao.hour")
    List<AvailabilityOverride> findByServiceAndDateRange(Long serviceId, LocalDate fromDate, LocalDate toDate);
}
```

---

### 3.3 Service: HourlySlotGenerationService.java

```java
package com.smilecare.smilecare_backend.timeslot.service;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.timeslot.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@Service
public class HourlySlotGenerationService {

    private final TimeSlotRepository timeSlotRepository;
    private final ClinicHoursService clinicHoursService;
    private static final Logger logger = Logger.getLogger(HourlySlotGenerationService.class.getName());

    public HourlySlotGenerationService(TimeSlotRepository timeSlotRepository,
                                       ClinicHoursService clinicHoursService) {
        this.timeSlotRepository = timeSlotRepository;
        this.clinicHoursService = clinicHoursService;
    }

    /**
     * Generate hourly time slots for a service between two dates
     * 
     * @param service       DentalService to generate slots for
     * @param fromDate      Start date (inclusive)
     * @param toDate        End date (inclusive)
     * @param intervalMins  Slot duration in minutes (e.g., 60 for hourly)
     * @return              Number of slots created
     */
    @Transactional
    public int generateSlotsForDateRange(DentalService service, LocalDate fromDate, 
                                         LocalDate toDate, int intervalMins) {
        logger.info("🔄 Starting slot generation for service " + service.getName() + 
                   " from " + fromDate + " to " + toDate);
        
        int totalCreated = 0;
        LocalDate currentDate = fromDate;

        while (!currentDate.isAfter(toDate)) {
            int slotsCreatedForDay = generateSlotsForDate(service, currentDate, intervalMins);
            totalCreated += slotsCreatedForDay;
            currentDate = currentDate.plusDays(1);
        }

        logger.info("✅ Slot generation complete. Created " + totalCreated + " slots");
        return totalCreated;
    }

    /**
     * Generate hourly slots for a specific date
     */
    @Transactional
    public int generateSlotsForDate(DentalService service, LocalDate date, int intervalMins) {
        try {
            // Get clinic hours for this day
            int javaDayOfWeek = date.getDayOfWeek().getValue(); // Mon=1, Sun=7
            int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1; // Mon=0, Sun=6

            ClinicHours clinicHours = clinicHoursService.getClinicHoursForDay(clinicDayOfWeek);

            if (clinicHours == null || !clinicHours.getIsOperating()) {
                logger.fine("ℹ️ Clinic closed on " + date);
                return 0;
            }

            List<TimeSlot> newSlots = new ArrayList<>();

            // Generate morning slots
            if (clinicHours.getMorningStart() != null && clinicHours.getMorningEnd() != null) {
                newSlots.addAll(generateSlotsForTimeRange(
                    service, date,
                    clinicHours.getMorningStart(),
                    clinicHours.getMorningEnd(),
                    intervalMins
                ));
            }

            // Generate afternoon slots
            if (clinicHours.getAfternoonStart() != null && clinicHours.getAfternoonEnd() != null) {
                newSlots.addAll(generateSlotsForTimeRange(
                    service, date,
                    clinicHours.getAfternoonStart(),
                    clinicHours.getAfternoonEnd(),
                    intervalMins
                ));
            }

            // Save only if not already exist
            int saved = 0;
            for (TimeSlot slot : newSlots) {
                try {
                    timeSlotRepository.save(slot);
                    saved++;
                } catch (Exception e) {
                    logger.fine("⚠️ Slot already exists for " + date + " " + slot.getStartTime());
                }
            }

            logger.info("✅ Generated " + saved + " slots for " + date);
            return saved;

        } catch (Exception e) {
            logger.warning("⚠️ Error generating slots for " + date + ": " + e.getMessage());
            return 0;
        }
    }

    /**
     * Generate slots for a time range (e.g., 09:00-12:00 → [09:00-10:00, 10:00-11:00, 11:00-12:00])
     */
    private List<TimeSlot> generateSlotsForTimeRange(DentalService service, LocalDate date,
                                                      LocalTime startTime, LocalTime endTime,
                                                      int intervalMins) {
        List<TimeSlot> slots = new ArrayList<>();
        LocalTime current = startTime;

        while (current.plusMinutes(intervalMins).isBefore(endTime) || 
               current.plusMinutes(intervalMins).equals(endTime)) {

            LocalTime slotEnd = current.plusMinutes(intervalMins);

            TimeSlot slot = new TimeSlot();
            slot.setService(service);
            slot.setDate(date);
            slot.setStartTime(current);
            slot.setEndTime(slotEnd);
            slot.setStatus(TimeSlotStatus.AVAILABLE);

            slots.add(slot);
            current = slotEnd;
        }

        return slots;
    }
}
```

---

### 3.4 Updated TimeSlotService (Add Admin Override Check)

```java
// In TimeSlotService.java, add this method:

@Transactional(readOnly = true)
public List<TimeSlotDTO> getAvailableTimeSlotsByServiceAndDateWithOverrides(
        Long serviceId, LocalDate date) {
    try {
        logger.info("📅 Fetching available slots for service " + serviceId + " on " + date + " (with overrides)");
        
        if (serviceId == null || serviceId <= 0) {
            throw new IllegalArgumentException("Invalid service ID");
        }
        if (date == null) {
            throw new IllegalArgumentException("Date cannot be null");
        }

        // Load clinic hours ONCE (cached)
        Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();

        // Get all time slots for date
        List<TimeSlot> slots = timeSlotRepository.findAvailableByServiceAndDate(serviceId, date);

        // Get admin overrides for this date
        List<AvailabilityOverride> overrides = availabilityOverrideRepository
            .findByServiceAndDate(serviceId, date);
        
        Map<Integer, AvailabilityOverride> overrideMap = new HashMap<>();
        for (AvailabilityOverride override : overrides) {
            overrideMap.put(override.getHour(), override);
        }

        // Filter slots considering clinic hours, bookings, and admin overrides
        List<TimeSlotDTO> result = slots.stream()
            .filter(slot -> {
                // Check if within clinic hours
                if (!isTimeSlotDayOpen(slot, cachedClinicHours)) {
                    return false;
                }

                // Check admin override
                int hour = slot.getStartTime().getHour();
                AvailabilityOverride override = overrideMap.get(hour);
                if (override != null && !override.getIsAvailable()) {
                    return false; // Admin disabled this hour
                }

                return true;
            })
            .map(TimeSlotDTO::new)
            .collect(Collectors.toList());

        logger.info("✅ Found " + result.size() + " available slots (after overrides)");
        return result;

    } catch (Exception e) {
        logger.severe("❌ Error: " + e.getMessage());
        throw new RuntimeException("Failed to fetch available slots: " + e.getMessage(), e);
    }
}

// Add field:
@Autowired
private AvailabilityOverrideRepository availabilityOverrideRepository;
```

---

### 3.5 FIX: ClinicHoursService - Add @Transactional

```java
// IMPORTANT: Add this annotations to getAllClinicHours method:

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

---

## PART 4: API ENDPOINTS

### 4.1 TimeSlot Endpoints

```
GET  /api/v1/time-slots/available?serviceId=1&date=2026-04-07
     → Returns hourly slots for date, respecting clinic hours & admin overrides
     Response: [{ id, service_id, date, startTime, endTime, status }, ...]

GET  /api/v1/time-slots/{id}
     → Get single slot details
     Response: { id, service_id, date, startTime, endTime, status }

PUT  /api/v1/time-slots/{id}/status
     → Update slot status (AVAILABLE, BOOKED, DISABLED)
     Body: { "status": "DISABLED", "reason": "Maintenance" }

GET  /api/v1/time-slots/generate?serviceId=1&fromDate=2026-04-01&toDate=2026-04-30
     → ADMIN ONLY: Pre-generate slots for date range
     Response: { success, slots_created, slots_failed }
```

### 4.2 Availability Override Endpoints

```
GET  /api/v1/availability-overrides?date=2026-04-07&serviceId=1
     → Get all overrides for a day/service
     Response: [{ id, service_id, date, hour, is_available, reason }, ...]

POST /api/v1/availability-overrides
     → Create override (admin disables specific hour)
     Body: {
       "service_id": 1,
       "date": "2026-04-07",
       "hour": 10,
       "is_available": false,
       "reason": "Staff meeting"
     }

DELETE /api/v1/availability-overrides/{id}
       → Remove override (admin re-enables hour)
```

### 4.3 Clinic Hours Endpoints

```
GET  /api/v1/clinic-hours
     → Get all clinic hours for week
     Response: [{ id, dayOfWeek, dayName, isOperating, morningStart, morningEnd, 
                  afternoonStart, afternoonEnd }, ...]

PUT  /api/v1/clinic-hours/{dayOfWeek}
     → Update clinic hours for a day
     Body: {
       "isOperating": true,
       "morningStart": "09:00",
       "morningEnd": "12:00",
       "afternoonStart": "14:00",
       "afternoonEnd": "17:00"
     }
     → Cache cleared automatically
```

---

---

## PART 5: FRONTEND INTEGRATION

### 5.1 Fetch Hourly Slots (React)

```jsx
// api/api.js - Add/Update:

export async function getAvailableTimeSlotsWithOverrides(serviceId, date) {
  try {
    const dateStr = formatDateToISO(date);
    const response = await fetch(
      `${BASE_URL}/api/v1/time-slots/available?serviceId=${serviceId}&date=${dateStr}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }

    const slots = await response.json();
    return slots || [];
  } catch (error) {
    console.error('❌ Failed to fetch slots:', error);
    throw error;
  }
}

export async function disableHourlySlot(serviceId, date, hour, reason = '') {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/availability-overrides`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          service_id: serviceId,
          date: date,
          hour: hour,
          is_available: false,
          reason: reason
        })
      }
    );

    if (!response.ok) throw new Error('Failed to disable slot');
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to disable slot:', error);
    throw error;
  }
}
```

---

### 5.2 Hourly Time Slot Display (React Component)

```jsx
// components/HourlyTimeSlotPicker.jsx

import React, { useState, useEffect } from 'react';
import { getAvailableTimeSlotsWithOverrides } from '../api/api.js';
import './HourlyTimeSlotPicker.css';

export default function HourlyTimeSlotPicker({ 
  serviceId, 
  date, 
  onSlotSelect, 
  selectedSlotId 
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!serviceId || !date) return;
    
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        const availableSlots = await getAvailableTimeSlotsWithOverrides(serviceId, date);
        setSlots(availableSlots);
      } catch (err) {
        setError('Failed to load time slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [serviceId, date]);

  if (loading) return <div className="loading">Loading slots...</div>;
  if (error) return <div className="error">⚠️ {error}</div>;
  if (slots.length === 0) return <div className="empty">No available slots</div>;

  return (
    <div className="hourly-slot-picker">
      <h3>Available Time Slots</h3>
      <div className="slots-grid">
        {slots.map(slot => (
          <button
            key={slot.id}
            className={`slot-button ${selectedSlotId === slot.id ? 'selected' : ''}`}
            onClick={() => onSlotSelect(slot.id)}
            title={slot.startTime + ' - ' + slot.endTime}
          >
            <div className="slot-time">{slot.startTime}</div>
            <div className="slot-duration">60 min</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

```css
/* components/HourlyTimeSlotPicker.css */

.hourly-slot-picker {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.hourly-slot-picker h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.slot-button {
  padding: 12px 8px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 12px;
  font-weight: 500;
}

.slot-button:hover {
  border-color: #007bff;
  background: #f0f7ff;
}

.slot-button.selected {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.slot-button.disabled {
  background: #f0f0f0;
  color: #999;
  border-color: #ccc;
  cursor: not-allowed;
}

.slot-time {
  font-weight: 600;
  font-size: 14px;
}

.slot-duration {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.loading, .error, .empty {
  padding: 12px;
  text-align: center;
  background: #f0f0f0;
  border-radius: 6px;
  color: #666;
  font-size: 13px;
}

.error {
  background: #ffe6e6;
  color: #c00;
}
```

---

---

## PART 6: ADMIN PANEL - HOURLY AVAILABILITY CONTROL

### 6.1 Admin UI Component

```jsx
// pages/AdminHourlyAvailabilityPage.jsx

import React, { useState, useEffect } from 'react';
import { getClinicHours, disableHourlySlot, getAvailabilityOverrides } from '../api/api.js';
import './AdminHourlyAvailabilityPage.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminHourlyAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedService, setSelectedService] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [clinicHours, setClinicHours] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedService]);

  const loadData = async () => {
    if (!selectedService) return;
    setLoading(true);
    try {
      const hours = await getClinicHours();
      setClinicHours(hours);

      const overridesData = await getAvailabilityOverrides(selectedDate, selectedService);
      const overrideMap = {};
      overridesData.forEach(o => {
        overrideMap[o.hour] = o;
      });
      setOverrides(overrideMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHour = async (hour) => {
    try {
      const isCurrentlyDisabled = overrides[hour];
      if (isCurrentlyDisabled) {
        // Enable (remove override)
        await fetch(`/api/v1/availability-overrides/${overrides[hour].id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
      } else {
        // Disable (create override)
        await disableHourlySlot(selectedService, selectedDate, hour, 'Disabled by admin');
      }
      loadData();
    } catch (error) {
      console.error('Failed to toggle hour:', error);
    }
  };

  const dayOfWeek = new Date(selectedDate).getDay();
  const dayHours = clinicHours.find(h => h.dayOfWeek === (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return (
    <div className="admin-hourly-availability">
      <h1>⚙️ Manage Hourly Availability</h1>

      <div className="controls">
        <div className="control-group">
          <label>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label>Service:</label>
          <select value={selectedService || ''} onChange={(e) => setSelectedService(Number(e.target.value))}>
            <option value="">Select a service</option>
            <option value="1">Cleaning</option>
            <option value="2">Filling</option>
            <option value="3">Root Canal</option>
          </select>
        </div>
      </div>

      {dayHours && (
        <div className="clinic-info">
          <p>Clinic hours for {DAYS[Math.abs(dayOfWeek - 1)]}:</p>
          <p>{dayHours.morningStart} - {dayHours.morningEnd} | {dayHours.afternoonStart} - {dayHours.afternoonEnd}</p>
        </div>
      )}

      <div className="hourly-grid">
        {HOURS.map(hour => {
          const isDisabled = overrides[hour];
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          return (
            <div
              key={hour}
              className={`hour-slot ${isDisabled ? 'disabled' : 'available'}`}
              onClick={() => handleToggleHour(hour)}
            >
              <div className="hour-time">{hourStr}</div>
              <div className="hour-status">{isDisabled ? '❌ Disabled' : '✅ Available'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

```css
/* AdminHourlyAvailabilityPage.css */

.admin-hourly-availability {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  display: flex;
  gap: 16px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-group label {
  font-weight: 600;
  font-size: 13px;
}

.control-group input,
.control-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.clinic-info {
  background: #f0f7ff;
  border-left: 4px solid #007bff;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 13px;
}

.clinic-info p {
  margin: 4px 0;
}

.hourly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.hour-slot {
  padding: 16px 8px;
  border: 2px solid #ddd;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
}

.hour-slot.available {
  background: #d4edda;
  border-color: #28a745;
}

.hour-slot.available:hover {
  background: #c3e6cb;
  transform: translateY(-2px);
}

.hour-slot.disabled {
  background: #f8d7da;
  border-color: #dc3545;
}

.hour-slot.disabled:hover {
  background: #f5c6cb;
  transform: translateY(-2px);
}

.hour-time {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
}

.hour-status {
  font-size: 11px;
  font-weight: 600;
  color: #555;
}
```

---

---

## PART 7: COMPLETE IMPLEMENTATION ROADMAP

### Phase 1: Fix the 500 Error (URGENT - 15 mins)

**Step 1:** Add `@Transactional(readOnly = true)` to ClinicHoursService methods
```java
@Transactional(readOnly = true)
public List<ClinicHoursDTO> getAllClinicHours() { ... }
```

**Step 2:** Verify `application.properties`:
```properties
spring.jpa.properties.hibernate.enable_lazy_load_no_trans=false
```

**Step 3:** Test:
```bash
curl -X GET http://localhost:8085/api/v1/clinic-hours
# Should return 200 with clinic hours array
```

---

### Phase 2: Database Schema Enhancement (30 mins)

**Step 1:** Run all CREATE TABLE statements from Part 2

**Step 2:** Verify tables exist:
```sql
SELECT * FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';
```

---

### Phase 3: Backend Implementation (2-3 hours)

**Step 1:** Create AvailabilityOverride entity

**Step 2:** Create AvailabilityOverrideRepository

**Step 3:** Create HourlySlotGenerationService

**Step 4:** Update TimeSlotService with admin override checks

**Step 5:** Update ClinicHoursService:
```java
@Transactional(readOnly = true)
public List<ClinicHoursDTO> getAllClinicHours() { ... }
```

---

### Phase 4: API Endpoints (1-2 hours)

**Step 1:** Create AvailabilityOverrideController

**Step 2:** Update TimeSlotController with new endpoints

**Step 3:** Test all endpoints

---

### Phase 5: Frontend Implementation (2-3 hours)

**Step 1:** Create HourlyTimeSlotPicker component

**Step 2:** Update BookPage.jsx to use HourlyTimeSlotPicker

**Step 3:** Test time slot selection flow

---

### Phase 6: Admin Panel (1-2 hours)

**Step 1:** Create AdminHourlyAvailabilityPage

**Step 2:** Integrate into admin navigation

**Step 3:** Test admin hour disabling

---

### Phase 7: Testing & Deployment (1-2 hours)

**Step 1:** End-to-end testing

**Step 2:** Performance testing with large slot datasets

**Step 3:** Deploy to production

---

## SUMMARY TABLE

| Component | Status | Key Changes |
|-----------|--------|------------|
| Database | ✅ Schema Designed | Added availability_overrides, slot_generation_log tables |
| Backend (Error Fix) | ✅ URGENT | Add @Transactional to getAllClinicHours |
| Slot Generation | ✅ Designed | HourlySlotGenerationService with range support |
| Admin Overrides | ✅ Designed | AvailabilityOverride entity + API |
| Frontend - User | ✅ Designed | HourlyTimeSlotPicker component |
| Frontend - Admin | ✅ Designed | AdminHourlyAvailabilityPage component |
| API Endpoints | ✅ Designed | GET /time-slots/available, POST /availability-overrides |

---

## NEXT STEPS

1. **CRITICAL (Today):** Fix 500 error by adding `@Transactional` to ClinicHoursService
2. **Phase 1:** Update database schema
3. **Phase 2:** Implement backend services
4. **Phase 3:** Build API endpoints
5. **Phase 4:** Develop frontend components
6. **Phase 5:** Test and deploy

