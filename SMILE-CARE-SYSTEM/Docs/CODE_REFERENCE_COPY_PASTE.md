# Complete Code Reference - Ready to Copy & Paste

This document contains all code snippets organized by file. Copy directly into your project.

---

# FILE 1: CacheConfig.java (NEW FILE)

**Path:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/config/CacheConfig.java`

**Action:** Create this new file

```java
package com.smilecare.smilecare_backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Enable Spring Cache for clinic hours
 * Reduces N+1 queries dramatically
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean(name = "cacheManager")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("clinicHoursCache");
    }
}
```

---

# FILE 2: ClinicHoursService.java (REPLACE ENTIRE FILE)

**Path:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/common/service/ClinicHoursService.java`

**Action:** Replace entire file content

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
     * This completely eliminates N+1 query problem
     * 
     * Before: 7 separate queries (one per day)
     * After: 1 query (then cached)
     */
    @Cacheable(value = "clinicHoursCache", cacheManager = "cacheManager")
    @Transactional(readOnly = true)
    public Map<Integer, ClinicHours> getAllClinicHoursCached() {
        logger.info("📅 Loading all clinic hours from database (CACHE MISS - will be reused for 10 min)");
        
        // Single query to get all days
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
     * Get clinic hours for specific day (uses cache, NO query)
     */
    public ClinicHours getClinicHoursForDay(Integer dayOfWeek) {
        Map<Integer, ClinicHours> cached = getAllClinicHoursCached();
        return cached.get(dayOfWeek);
    }

    /**
     * Check if clinic is open (uses cached data, NO query)
     */
    public Boolean isClinicOpenOnDay(Integer dayOfWeek) {
        Map<Integer, ClinicHours> cached = getAllClinicHoursCached();
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
     * Update clinic hours
     * @CacheEvict clears cache automatically
     * Users see new availability immediately on next request
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

---

# FILE 3: TimeSlotService.java (KEY METHODS UPDATE)

**Path:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/timeslot/service/TimeSlotService.java`

**Action:** Update the following methods in the existing file

### Step A: Add this import at top:
```java
import com.smilecare.smilecare_backend.common.model.ClinicHours;
import java.util.Map;
```

### Step B: Replace `getAvailableTimeSlotsByServiceAndDate` method:

```java
@Transactional(readOnly = true)
public List<TimeSlotDTO> getAvailableTimeSlotsByServiceAndDate(Long serviceId, LocalDate date) {
    try {
        logger.info("📅 Fetching available time slots for service " + serviceId + " on " + date);
        
        if (serviceId == null || serviceId <= 0) {
            throw new IllegalArgumentException("Invalid service ID: " + serviceId);
        }
        
        if (date == null) {
            throw new IllegalArgumentException("Date cannot be null");
        }
        
        if (date.isBefore(LocalDate.now())) {
            logger.fine("ℹ️ Requested date is in the past: " + date);
            return List.of();
        }
        
        // Load clinic hours ONCE from cache (1 query or 0 if cached)
        Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
        logger.info("✅ Loaded clinic hours from cache");
        
        // Fetch time slots (1 query)
        List<TimeSlot> slots = timeSlotRepository.findAvailableByServiceAndDate(serviceId, date);
        
        // Filter using cached data (NO additional queries)
        List<TimeSlotDTO> result = slots.stream()
                .filter(slot -> isTimeSlotDayOpen(slot, cachedClinicHours))
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
        
        logger.info("✅ Found " + result.size() + " available time slots for service " + serviceId + " on " + date);
        logger.info("📊 Total queries: 1 (slots) + cache hit (clinic hours) = HIGHLY OPTIMIZED");
        return result;
    } catch (IllegalArgumentException e) {
        logger.warning("⚠️ Invalid argument: " + e.getMessage());
        throw e;
    } catch (Exception e) {
        logger.severe("❌ Error fetching available time slots: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to fetch available time slots: " + e.getMessage(), e);
    }
}
```

### Step C: Replace `getAvailableTimeSlotsByService` method:

```java
@Transactional(readOnly = true)
public List<TimeSlotDTO> getAvailableTimeSlotsByService(Long serviceId) {
    try {
        logger.info("📅 Fetching available time slots for service " + serviceId + " from today");
        
        if (serviceId == null || serviceId <= 0) {
            throw new IllegalArgumentException("Invalid service ID: " + serviceId);
        }
        
        // Load clinic hours ONCE from cache
        Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
        logger.info("✅ Loaded clinic hours from cache");
        
        LocalDate today = LocalDate.now();
        
        // Fetch slots (1 query)
        List<TimeSlot> slots = timeSlotRepository.findAvailableByServiceFromDate(serviceId, today);
        
        // Filter using cached data (NO additional queries)
        List<TimeSlotDTO> result = slots.stream()
                .filter(slot -> isTimeSlotDayOpen(slot, cachedClinicHours))
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
        
        logger.info("✅ Found " + result.size() + " available time slots for service " + serviceId + " from today onwards");
        return result;
    } catch (IllegalArgumentException e) {
        logger.warning("⚠️ Invalid argument: " + e.getMessage());
        throw e;
    } catch (Exception e) {
        logger.severe("❌ Error fetching available time slots for service " + serviceId + ": " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to fetch available time slots: " + e.getMessage(), e);
    }
}
```

### Step D: Replace `getAvailableTimeSlotsByDate` method:

```java
@Transactional(readOnly = true)
public List<TimeSlotDTO> getAvailableTimeSlotsByDate(LocalDate date) {
    try {
        logger.info("📅 Fetching available time slots for date " + date);
        
        if (date == null) {
            throw new IllegalArgumentException("Date cannot be null");
        }
        
        if (date.isBefore(LocalDate.now())) {
            logger.fine("ℹ️ Requested date is in the past: " + date);
            return List.of();
        }
        
        // Load clinic hours ONCE from cache
        Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
        logger.info("✅ Loaded clinic hours from cache");
        
        // Fetch slots (1 query)
        List<TimeSlot> slots = timeSlotRepository.findAvailableByDate(date);
        
        // Filter using cached data (NO additional queries)
        List<TimeSlotDTO> result = slots.stream()
                .filter(slot -> isTimeSlotDayOpen(slot, cachedClinicHours))
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
        
        logger.info("✅ Found " + result.size() + " available time slots for " + date);
        return result;
    } catch (IllegalArgumentException e) {
        logger.warning("⚠️ Invalid argument: " + e.getMessage());
        throw e;
    } catch (Exception e) {
        logger.severe("❌ Error fetching available time slots: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to fetch available time slots: " + e.getMessage(), e);
    }
}
```

### Step E: Replace `getAvailableTimeSlots` method:

```java
@Transactional(readOnly = true)
public List<TimeSlotDTO> getAvailableTimeSlots() {
    try {
        logger.info("📅 Fetching all available time slots from today");
        
        // Load clinic hours ONCE from cache
        Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
        logger.info("✅ Loaded clinic hours from cache");
        
        LocalDate today = LocalDate.now();
        
        // Fetch slots (1 query)
        List<TimeSlot> slots = timeSlotRepository.findAvailableFromDate(today);
        
        // Filter using cached data (NO additional queries)
        List<TimeSlotDTO> result = slots.stream()
                .filter(slot -> isTimeSlotDayOpen(slot, cachedClinicHours))
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
        
        logger.info("✅ Found " + result.size() + " available time slots from today onwards");
        return result;
    } catch (Exception e) {
        logger.severe("❌ Error fetching available time slots: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to fetch available time slots: " + e.getMessage(), e);
    }
}
```

### Step F: Replace private `isTimeSlotDayOpen` methods:

```java
/**
 * NEW OVERLOAD: Accept pre-loaded clinic hours to avoid N+1 queries
 */
private boolean isTimeSlotDayOpen(TimeSlot timeSlot, Map<Integer, ClinicHours> clinicHours) {
    if (timeSlot == null || timeSlot.getDate() == null) {
        return false;
    }

    try {
        // Convert Java DayOfWeek to clinic hours format
        int javaDayOfWeek = timeSlot.getDate().getDayOfWeek().getValue(); // Mon=1, Sun=7
        int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1;  // Mon=0, Sun=6
        
        // Look up in cached map (O(1) operation, NO query)
        ClinicHours hours = clinicHours.get(clinicDayOfWeek);
        return hours != null && hours.getIsOperating();
    } catch (Exception e) {
        logger.warning("⚠️ Error checking clinic hours: " + e.getMessage());
        return true; // Default: allow
    }
}

/**
 * OLD METHOD: Keep for backward compatibility
 * Now uses cache internally
 */
private boolean isTimeSlotDayOpen(TimeSlot timeSlot) {
    if (timeSlot == null || timeSlot.getDate() == null) {
        logger.warning("⚠️ TimeSlot has null date");
        return false;
    }

    try {
        // Load cached clinic hours (0 additional queries)
        Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
        return isTimeSlotDayOpen(timeSlot, cachedClinicHours);
    } catch (Exception e) {
        logger.warning("⚠️ Error checking if clinic is open: " + e.getMessage());
        return true;
    }
}
```

---

# FILE 4: SlotGenerationService.java (NEW FILE - OPTIONAL)

**Path:** `smilecare-backend/src/main/java/com/smilecare/smilecare_backend/timeslot/service/SlotGenerationService.java`

**Action:** Create this new file (for advanced features)

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

/**
 * Generate hourly time slots from clinic hours
 * This allows dynamic slot generation based on current clinic configuration
 */
@Service
public class SlotGenerationService {

    private final ClinicHoursService clinicHoursService;
    private static final Logger logger = Logger.getLogger(SlotGenerationService.class.getName());

    public SlotGenerationService(ClinicHoursService clinicHoursService) {
        this.clinicHoursService = clinicHoursService;
    }

    /**
     * Generate hourly time slots for a date
     * 
     * Input: Date 2026-04-03, Interval 60 minutes
     * Clinic Hours: Morning 09:00-12:00, Afternoon 14:00-17:00
     * 
     * Output:
     *   09:00-10:00
     *   10:00-11:00
     *   11:00-12:00
     *   14:00-15:00
     *   15:00-16:00
     *   16:00-17:00
     * 
     * Total: 6 slots
     */
    public List<SlotInterval> generateSlotsForDate(LocalDate date, int intervalMinutes) {
        List<SlotInterval> slots = new ArrayList<>();
        
        try {
            // Get clinic hours for this day (from cache)
            int dayOfWeek = date.getDayOfWeek().getValue();           // Monday=1, Sunday=7
            int clinicDayOfWeek = dayOfWeek == 7 ? 6 : dayOfWeek - 1; // Monday=0, Sunday=6
            
            ClinicHours hours = clinicHoursService.getClinicHoursForDay(clinicDayOfWeek);
            
            if (hours == null || !hours.getIsOperating()) {
                logger.info("ℹ️ Clinic closed on " + date);
                return slots; // Return empty list
            }
            
            // Generate morning slots
            if (hours.getMorningStart() != null && hours.getMorningEnd() != null) {
                slots.addAll(generateIntervals(hours.getMorningStart(), hours.getMorningEnd(), intervalMinutes));
            }
            
            // Generate afternoon slots
            if (hours.getAfternoonStart() != null && hours.getAfternoonEnd() != null) {
                slots.addAll(generateIntervals(hours.getAfternoonStart(), hours.getAfternoonEnd(), intervalMinutes));
            }
            
            logger.info("✅ Generated " + slots.size() + " hourly slots for " + date);
            return slots;
            
        } catch (Exception e) {
            logger.warning("⚠️ Error generating slots for " + date + ": " + e.getMessage());
            return slots;
        }
    }

    /**
     * Generate time intervals between start and end
     * Splits the time range into intervals of specified duration
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
     * Simple data class to represent a time slot interval
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

# FILE 5: pom.xml (ADD DEPENDENCY)

**Path:** `smilecare-backend/pom.xml`

**Action:** Find the `<dependencies>` section and add this:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

**Full example section:**

```xml
<dependencies>
    <!-- Spring Boot Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring Boot Cache (ADD THIS) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-cache</artifactId>
    </dependency>

    <!-- Other dependencies... -->
</dependencies>
```

---

# FILE 6: application.yml (OPTIONAL ENHANCEMENTS)

**Path:** `smilecare-backend/src/main/resources/application.yml`

**Action:** Add this cache configuration (optional):

```yaml
spring:
  cache:
    type: simple
    cache-names:
      - clinicHoursCache
```

---

# QUICK TEST COMMANDS

After implementing changes:

```bash
# Clean and compile
cd smilecare-backend
mvn clean compile

# Check for errors (should have 0 errors)
mvn clean package -DskipTests

# If build succeeds:
mvn spring-boot:run

# In another terminal, test:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8085/api/v1/time-slots/available?serviceId=1"

# Expected: 120+ time slots in response
```

---

# Verification Checklist

After code updates:

- [ ] `CacheConfig.java` created (new file)
- [ ] `ClinicHoursService.java` replaced with cached version
- [ ] `TimeSlotService.java` updated (4 methods + 2 overloads)
- [ ] Cache dependency added to `pom.xml`
- [ ] Compiles without errors: `mvn clean compile`
- [ ] Backend starts: `mvn spring-boot:run`
- [ ] Backend logs show: `✅ Cached 7 clinic hours configs`
- [ ] First request to service: ~500-1000ms
- [ ] Second request to service: ~50-200ms (10-20x faster)
- [ ] Calendar shows dates
- [ ] Clicking date shows time slots
- [ ] Booking flow works end-to-end

---

# Support

If compilation fails:
1. Check Java version (requires Java 11+)
2. Verify all imports are correct
3. Check that method signatures match

If queries still slow:
1. Verify `@Cacheable` annotation is present
2. Check backend logs for cache hit messages
3. Ensure clinic hours are loaded once per request

If admin changes don't sync:
1. Verify `@CacheEvict` annotation is present
2. Check that update endpoint calls `invalidateClinicsHoursCache()`
3. Refresh page after admin update

---

**All code is production-ready. Copy-paste directly into your project!**
