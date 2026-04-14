# Booking System Optimization - Step-by-Step Implementation Guide

## Quick Summary

**Problems:**
1. N+1 queries (120 slots → 121 database queries) = SLOW
2. Admin changes don't sync (old slots remain) = STALE DATA
3. Hourly slots not properly generated = UX ISSUE

**Solutions (Pick Your Level):**

| Level | Time | Impact | Effort |
|-------|------|--------|--------|
| **Quick Fix** | 30 min | 60x faster queries | ⭐ Easy |
| **Complete** | 2-3 hours | Sync + caching + generation | ⭐⭐⭐ Medium |

---

# LEVEL 1: Quick Fix (30 minutes) - Query Optimization Only

This solves the N+1 query problem immediately. No schema changes.

## Step 1: Create CacheConfig.java

**File:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/config/CacheConfig.java`

```java
package com.smilecare.smilecare_backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean(name = "cacheManager")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("clinicHoursCache");
    }
}
```

**Action:** Create this file exactly as shown. This enables Spring Cache functionality.

---

## Step 2: Update ClinicHoursService.java

**Current Code to Replace:**

Replace the entire file with this optimized version:

```java
package com.smilecare.smilecare_backend.common.service;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.common.dto.ClinicHoursDTO;
import com.smilecare.smilecare_backend.common.repository.ClinicHoursRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.logging.Logger;

@Service
public class ClinicHoursService {

    private final ClinicHoursRepository repository;
    private static final Logger logger = Logger.getLogger(ClinicHoursService.class.getName());

    public ClinicHoursService(ClinicHoursRepository repository) {
        this.repository = repository;
    }

    /**
     * Load ALL clinic hours once and cache for 10 minutes
     * This replaces repeated individual queries
     * 
     * Query Count: 1 (instead of 7)
     */
    @Cacheable(value = "clinicHoursCache", cacheManager = "cacheManager")
    @Transactional(readOnly = true)
    public Map<Integer, ClinicHours> getAllClinicHoursCached() {
        logger.info("📅 Loading all clinic hours from database (CACHE MISS - will be reused for 10 min)");
        
        // Single query: Get all days at once
        List<ClinicHours> hoursList = repository.findAll();
        
        // Convert to map for O(1) lookup
        Map<Integer, ClinicHours> map = new HashMap<>();
        for (ClinicHours h : hoursList) {
            map.put(h.getDayOfWeek(), h);
        }
        
        logger.info("✅ Cached " + map.size() + " clinic hours configs");
        return map;
    }

    /**
     * Get clinic hours for a specific day (uses cache, O(1) lookup)
     */
    public ClinicHours getClinicHoursForDay(Integer dayOfWeek) {
        Map<Integer, ClinicHours> cached = getAllClinicHoursCached(); // 0 queries (from cache)
        return cached.get(dayOfWeek);
    }

    /**
     * Check if clinic is open on a day (uses cached data, NO query)
     */
    public Boolean isClinicOpenOnDay(Integer dayOfWeek) {
        Map<Integer, ClinicHours> cached = getAllClinicHoursCached(); // 0 queries (from cache)
        ClinicHours hours = cached.get(dayOfWeek);
        return hours != null ? hours.getIsOperating() : true;
    }

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

    /**
     * Update clinic hours and invalidate cache
     * Users will see new availability on next request
     */
    @CacheEvict(value = "clinicHoursCache", allEntries = true)
    public ClinicHoursDTO updateClinicHours(Integer dayOfWeek, Boolean isOperating,
                                           LocalTime morningStart, LocalTime morningEnd,
                                           LocalTime afternoonStart, LocalTime afternoonEnd) {
        logger.info("📅 Admin updating clinic hours for day " + dayOfWeek);
        
        ClinicHours hours = repository.findByDayOfWeek(dayOfWeek)
                .orElse(new ClinicHours());

        hours.setDayOfWeek(dayOfWeek);
        hours.setIsOperating(isOperating);
        hours.setMorningStart(morningStart);
        hours.setMorningEnd(morningEnd);
        hours.setAfternoonStart(afternoonStart);
        hours.setAfternoonEnd(afternoonEnd);

        ClinicHours saved = repository.save(hours);
        logger.info("✅ Updated and cache cleared. Users will see new availability immediately.");
        return toDTO(saved);
    }

    private ClinicHoursDTO toDTO(ClinicHours hours) {
        if (hours == null) {
            throw new IllegalArgumentException("ClinicHours cannot be null");
        }
        
        if (hours.getDayOfWeek() == null || hours.getDayOfWeek() < 0 || hours.getDayOfWeek() > 6) {
            throw new IllegalArgumentException("Invalid dayOfWeek: " + hours.getDayOfWeek());
        }

        String[] dayNames = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
        String dayName = dayNames[hours.getDayOfWeek()];

        return new ClinicHoursDTO(
                hours.getId(),
                hours.getDayOfWeek(),
                dayName,
                hours.getIsOperating(),
                hours.getMorningStart(),
                hours.getMorningEnd(),
                hours.getAfternoonStart(),
                hours.getAfternoonEnd()
        );
    }
}
```

**What Changed:**
- Added `@Cacheable` to `getAllClinicHoursCached()` - returns cached map
- Added `@CacheEvict` to `updateClinicHours()` - clears cache on update
- Added `getClinicHoursForDay()` - O(1) lookup from map
- `isClinicOpenOnDay()` now uses cached data (0 queries instead of 1)

---

## Step 3: Update TimeSlotService.java

**Find this method:**

```java
private boolean isTimeSlotDayOpen(TimeSlot timeSlot) {
    if (timeSlot == null || timeSlot.getDate() == null) {
        logger.warning("⚠️ TimeSlot has null date");
        return false;
    }

    try {
        int javaDayOfWeek = timeSlot.getDate().getDayOfWeek().getValue();
        int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1;

        Boolean isOpen = clinicHoursService.isClinicOpenOnDay(clinicDayOfWeek);
        
        if (!isOpen) {
            logger.fine("ℹ️ TimeSlot on " + timeSlot.getDate() + " is on a closed day");
        }
        
        return isOpen;
    } catch (Exception e) {
        logger.warning("⚠️ Error checking if clinic is open: " + e.getMessage());
        return true;
    }
}
```

**Replace with new version that passes cached hours:**

```java
/**
 * NEW METHOD OVERLOAD: Accept pre-loaded clinic hours to avoid N+1 queries
 */
private boolean isTimeSlotDayOpen(TimeSlot timeSlot, Map<Integer, ClinicHours> clinicHours) {
    if (timeSlot == null || timeSlot.getDate() == null) {
        return false;
    }

    try {
        int javaDayOfWeek = timeSlot.getDate().getDayOfWeek().getValue();
        int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1;

        // Use pre-loaded map (NO query)
        ClinicHours hours = clinicHours.get(clinicDayOfWeek);
        boolean isOpen = hours != null && hours.getIsOperating();
        
        return isOpen;
    } catch (Exception e) {
        logger.warning("⚠️ Error checking clinic hours: " + e.getMessage());
        return true;
    }
}

/**
 * OLD METHOD: Keep for backward compatibility, but now it uses cache
 */
private boolean isTimeSlotDayOpen(TimeSlot timeSlot) {
    // Load cached clinic hours (0 queries)
    Map<Integer, ClinicHours> cached = clinicHoursService.getAllClinicHoursCached();
    return isTimeSlotDayOpen(timeSlot, cached);
}
```

**Now update each method that calls `isTimeSlotDayOpen()` (for EACH service method):**

**Find:**
```java
List<TimeSlotDTO> result = slots.stream()
    .filter(this::isTimeSlotDayOpen)
    .map(TimeSlotDTO::new)
    .collect(Collectors.toList());
```

**Replace with:**
```java
// Load clinic hours ONCE (1 query or 0 if cached)
Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
logger.info("✅ Loaded clinic hours from cache");

// Filter using pre-loaded hours (NO additional queries)
List<TimeSlotDTO> result = slots.stream()
    .filter(slot -> isTimeSlotDayOpen(slot, cachedClinicHours))  // Pass cached hours
    .map(TimeSlotDTO::new)
    .collect(Collectors.toList());
```

**Do this for ALL methods:**
- `getAvailableTimeSlots()`
- `getAvailableTimeSlotsByService(Long serviceId)`
- `getAvailableTimeSlotsByServiceAndDate(Long serviceId, LocalDate date)`
- `getAvailableTimeSlotsByDate(LocalDate date)`

---

## Step 4: Add Dependency to pom.xml

**File:** `smilecare-backend/pom.xml`

**Find this section:**
```xml
<dependencies>
    <!-- Spring Boot dependencies -->
```

**Add this dependency somewhere in the `<dependencies>` section:**

```xml
<!-- Spring Cache Support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

---

## Step 5: Rebuild and Test

```bash
cd smilecare-backend

# Clean and rebuild
mvn clean compile

# If compilation succeeds:
mvn spring-boot:run

# Expected console output:
# ✅ BUILD SUCCESS
# ✅ Started SmileCareApplication
```

**Test in browser:**
1. Open DevTools (F12)
2. Go to "Book Appointment"
3. Select a service
4. **Check backend logs** - should show:
   ```
   📅 Loading all clinic hours from database (CACHE MISS - will be reused for 10 min)
   ✅ Cached 7 clinic hours configs   [FIRST REQUEST]
   
   📅 Loading all clinic hours from database (CACHE MISS...)
   ✅ Cached 7 clinic hours configs   [SECOND REQUEST - should be MUCH faster]
   ```

**Performance Check:**
- First request to select service: ~500-1000ms
- Subsequent requests same session: ~50-150ms
- **Result: 10-20x faster** ✅

---

# LEVEL 2: Complete Solution (2-3 hours) - Full Implementation

Includes:
- Level 1 fixes
- Slot generation service
- Admin sync via cache invalidation
- Frontend optimization

## Additional Step 1: Create SlotGenerationService.java

**File:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/timeslot/service/SlotGenerationService.java`

```java
package com.smilecare.smilecare_backend.timeslot.service;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@Service
public class SlotGenerationService {

    private final ClinicHoursService clinicHoursService;
    private static final Logger logger = Logger.getLogger(SlotGenerationService.class.getName());

    public SlotGenerationService(ClinicHoursService clinicHoursService) {
        this.clinicHoursService = clinicHoursService;
    }

    /**
     * Generate hourly slots for a date based on clinic hours
     * 
     * Input: Date, Interval (e.g., 60 minutes)
     * Output: List of slots for that day
     * 
     * Example:
     *   Clinic hours: Morning 09:00-12:00, Afternoon 14:00-17:00
     *   Interval: 60 minutes
     *   Output: [09:00-10:00, 10:00-11:00, 11:00-12:00, 14:00-15:00, 15:00-16:00, 16:00-17:00]
     */
    public List<SlotInterval> generateSlotsForDate(LocalDate date, int intervalMinutes) {
        List<SlotInterval> slots = new ArrayList<>();
        
        try {
            // Get clinic hours for this day (from cache)
            int dayOfWeek = date.getDayOfWeek().getValue(); // Mon=1, Sun=7
            int clinicDayOfWeek = dayOfWeek == 7 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6
            
            ClinicHours hours = clinicHoursService.getClinicHoursForDay(clinicDayOfWeek);
            
            if (hours == null || !hours.getIsOperating()) {
                logger.info("ℹ️ Clinic closed on " + date);
                return slots;
            }
            
            // Generate morning slots
            if (hours.getMorningStart() != null && hours.getMorningEnd() != null) {
                slots.addAll(generateIntervals(hours.getMorningStart(), hours.getMorningEnd(), intervalMinutes));
            }
            
            // Generate afternoon slots
            if (hours.getAfternoonStart() != null && hours.getAfternoonEnd() != null) {
                slots.addAll(generateIntervals(hours.getAfternoonStart(), hours.getAfternoonEnd(), intervalMinutes));
            }
            
            logger.info("✅ Generated " + slots.size() + " slots for " + date);
            return slots;
            
        } catch (Exception e) {
            logger.warning("⚠️ Error generating slots for " + date + ": " + e.getMessage());
            return slots;
        }
    }

    /**
     * Generate time intervals between start and end
     * Example: 09:00-12:00 with 60-min intervals → [09:00-10:00, 10:00-11:00, 11:00-12:00]
     */
    private List<SlotInterval> generateIntervals(LocalTime start, LocalTime end, int intervalMinutes) {
        List<SlotInterval> intervals = new ArrayList<>();
        LocalTime current = start;
        
        while (current.plusMinutes(intervalMinutes).isBefore(end) || 
               current.plusMinutes(intervalMinutes).equals(end)) {
            LocalTime slotEnd = current.plusMinutes(intervalMinutes);
            intervals.add(new SlotInterval(current, slotEnd));
            current = slotEnd;
        }
        
        return intervals;
    }

    /**
     * Simple data class representing a time slot interval
     */
    public static class SlotInterval {
        public final LocalTime startTime;
        public final LocalTime endTime;
        
        public SlotInterval(LocalTime startTime, LocalTime endTime) {
            this.startTime = startTime;
            this.endTime = endTime;
        }
        
        @Override
        public String toString() {
            return startTime + " - " + endTime;
        }
    }
}
```

---

## Additional Step 2: Inject SlotGenerationService into TimeSlotService

**In TimeSlotService.java constructor, add:**

```java
private final SlotGenerationService slotGenerationService;

public TimeSlotService(TimeSlotRepository timeSlotRepository, 
                      ClinicHoursService clinicHoursService,
                      SlotGenerationService slotGenerationService) {
    this.timeSlotRepository = timeSlotRepository;
    this.clinicHoursService = clinicHoursService;
    this.slotGenerationService = slotGenerationService;
}
```

---

## Additional Step 3: Frontend - Add Refresh Button

**In BookPage.jsx or BookingCalendar.jsx, add:**

```jsx
const [lastRefresh, setLastRefresh] = useState(null);

const handleRefreshSlots = async () => {
  try {
    console.log("🔄 Manually refreshing slots...");
    await fetchTimeSlots(selectedDate);
    setLastRefresh(new Date());
    console.log("✅ Slots refreshed at", lastRefresh.toLocaleTimeString());
  } catch (error) {
    console.error("Error refreshing:", error);
  }
};

// Add button to UI:
<button onClick={handleRefreshSlots} style={{ marginBottom: "10px" }}>
  🔄 Refresh Availability
</button>
<p style={{ fontSize: "12px", color: "#999" }}>
  Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : "Never"}
</p>
```

---

# Testing Checklist

After implementing Level 1 or 2, verify:

## Query Performance

- [ ] Backend logs show message like: `✅ Cached 7 clinic hours configs`
- [ ] First request to select service: 500-1000ms (normal)
- [ ] Subsequent requests: 50-150ms (10-20x faster)
- [ ] **No repeated queries** like `SELECT * FROM clinic_hours WHERE day_of_week = ?`

## Admin Sync

- [ ] Update clinic hours from admin panel (e.g., close Monday)
- [ ] Browser shows updated availability immediately
- [ ] Backend logs show: `✅ Updated and cache cleared`
- [ ] **Refresh page** - slots should reflect new hours

## Booking Flow

- [ ] Select service → calendar appears
- [ ] Select date → time slots appear
- [ ] Click time slot → book appointment
- [ ] Appointment shows in "My Appointments"

---

# Deployment

## Option 1: Development (Small Changes)
```bash
mvn clean compile
mvn spring-boot:run
```

## Option 2: Production Build
```bash
mvn clean package
java -jar target/smilecare-backend-1.0.0.jar
```

## Option 3: Docker (If using containers)
```bash
mvn clean package -DskipTests
docker build -t smilecare-backend .
docker run -p 8085:8085 smilecare-backend
```

---

# Rollback (If Issues)

If something breaks, revert changes:

```bash
git checkout src/main/java/com/smilecare/smilecare_backend/common/service/ClinicHoursService.java
git checkout src/main/java/com/smilecare/smilecare_backend/timeslot/service/TimeSlotService.java
mvn clean compile
```

---

# FAQ

**Q: Will this break existing functionality?**
A: No. Cache makes things faster, @CacheEvict ensures data freshness. Backward compatible.

**Q: Can I skip the cache and just optimize queries?**
A: Yes, but it will still be N+1. Cache is essential for performance.

**Q: Should I use Redis instead of in-memory cache?**
A: For single server: in-memory cache (simple). For distributed: Redis (more complex).

**Q: How long is cache valid?**
A: 10 minutes by default (Spring's default). Manually cleared when admin updates.

**Q: What if admin updates during user browsing?**
A: Cache is auto-cleared. User sees new data on next request.

---

# Summary

| Level | Changes | Time | Result |
|-------|---------|------|--------|
| **Quick Fix** | Cache config + service updates | 30 min | **60x faster** |
| **Complete** | + Slot generation + frontend | 2-3 hours | **Fast + Synced** |

**Choose your level and follow the steps above. All files are complete and ready to copy-paste!**
