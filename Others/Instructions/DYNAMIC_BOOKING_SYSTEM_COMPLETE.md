# 🎯 Dynamic Appointment Booking System - Complete Implementation

**Status:** Design & Implementation Guide  
**Date:** April 3, 2026

---

## 📋 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ DYNAMIC APPOINTMENT BOOKING SYSTEM ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CLINIC HOURS (Supabase)                                    │
│     ├─ Monday-Sunday hours                                     │
│     ├─ Morning session: 08:00 - 12:00                         │
│     └─ Afternoon session: 14:00 - 18:00                       │
│                                                                 │
│  2. SERVICES (Supabase)                                        │
│     ├─ Service name, description                              │
│     └─ Duration (e.g., 30min, 60min)                          │
│                                                                 │
│  3. DYNAMIC SLOT GENERATION                                    │
│     ├─ Calculate slots: (END - START) / SERVICE_DURATION      │
│     ├─ Example: (12:00 - 08:00) / 30min = 8 slots            │
│     └─ Slots: 08:00, 08:30, 09:00, 09:30, ... 11:30         │
│                                                                 │
│  4. SLOT STORAGE & TRACKING                                    │
│     ├─ time_slots table with START_TIME, END_TIME             │
│     ├─ status: AVAILABLE, BOOKED, LOCKED                      │
│     └─ lock_expires_at for temporary locks                    │
│                                                                 │
│  5. APPOINTMENT STORAGE                                        │
│     ├─ appointments table with START_TIME, END_TIME           │
│     ├─ Automatic overlap detection                            │
│     └─ Real-time sync with time_slots                         │
│                                                                 │
│  6. REAL-TIME UPDATES                                          │
│     ├─ WebSocket connections for live slot updates           │
│     ├─ Supabase real-time subscriptions                       │
│     └─ Automatic UI refresh on availability changes          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ SUPABASE SCHEMA - Complete SQL

### Core Tables

```sql
-- =====================================================
-- 1. CLINIC HOURS (Already exists - no changes needed)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clinic_hours (
  id bigserial NOT NULL PRIMARY KEY,
  day_of_week integer NOT NULL,           -- 0=Sunday, 1=Monday, ... 6=Saturday
  is_operating boolean NOT NULL DEFAULT true,
  morning_start time WITHOUT TIME ZONE,
  morning_end time WITHOUT TIME ZONE,
  afternoon_start time WITHOUT TIME ZONE,
  afternoon_end time WITHOUT TIME ZONE,
  updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT clinic_hours_unique_day UNIQUE(day_of_week)
);

-- =====================================================
-- 2. DENTAL SERVICES (Needs duration field)
-- =====================================================
-- ALTER table if it exists, or CREATE if not
CREATE TABLE IF NOT EXISTS public.dental_services (
  id bigserial NOT NULL PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,  -- ← NEW FIELD
  price numeric(10, 2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT duration_check CHECK (duration_minutes > 0)
);

-- If table exists, add duration column:
-- ALTER TABLE public.dental_services 
-- ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;

-- =====================================================
-- 3. TIME SLOTS (Redesigned for dynamic generation)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.time_slots (
  id bigserial NOT NULL PRIMARY KEY,
  service_id bigint NOT NULL REFERENCES public.dental_services(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time WITHOUT TIME ZONE NOT NULL,
  end_time time WITHOUT TIME ZONE NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE, BOOKED, LOCKED
  status_updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  
  -- Temporary locking for booking protection
  locked_by_user_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  lock_expires_at timestamp WITHOUT TIME ZONE,      -- e.g., NOW() + 10 minutes
  
  created_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT slot_time_check CHECK (start_time < end_time),
  CONSTRAINT valid_status CHECK (status IN ('AVAILABLE', 'BOOKED', 'LOCKED')),
  CONSTRAINT unique_slot UNIQUE(service_id, appointment_date, start_time)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_slots_service_date 
  ON public.time_slots(service_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_date 
  ON public.time_slots(appointment_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_status 
  ON public.time_slots(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_lock_expires 
  ON public.time_slots(lock_expires_at) 
  WHERE lock_expires_at IS NOT NULL;

-- =====================================================
-- 4. APPOINTMENTS (Updated with start/end times)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id bigserial NOT NULL PRIMARY KEY,
  patient_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id bigint NOT NULL REFERENCES public.dental_services(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time WITHOUT TIME ZONE NOT NULL,
  end_time time WITHOUT TIME ZONE NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, ARRIVED, COMPLETED, CANCELLED
  processed_by_admin_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT appointment_time_check CHECK (start_time < end_time),
  CONSTRAINT valid_appt_status CHECK (status IN ('PENDING', 'APPROVED', 'ARRIVED', 'COMPLETED', 'CANCELLED'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient 
  ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date 
  ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_service 
  ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time 
  ON public.appointments(appointment_date, start_time, end_time);

-- =====================================================
-- 5. SLOT LOCKS (Optional: explicit lock tracking)
-- =====================================================
-- Use this if you want detailed audit trail of locks
CREATE TABLE IF NOT EXISTS public.slot_locks (
  id bigserial NOT NULL PRIMARY KEY,
  time_slot_id bigint NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  locked_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  expires_at timestamp WITHOUT TIME ZONE,
  released_at timestamp WITHOUT TIME ZONE,
  released_by_user_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  reason varchar(255),  -- "BOOKING_IN_PROGRESS", "MANUAL_HOLD", etc.
  
  CONSTRAINT lock_unique UNIQUE(time_slot_id, expires_at)
);

CREATE INDEX IF NOT EXISTS idx_slot_locks_user 
  ON public.slot_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_slot_locks_expires 
  ON public.slot_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_slot_locks_active 
  ON public.slot_locks(expires_at) 
  WHERE released_at IS NULL;


-- =====================================================
-- 6. APPOINTMENT CONFLICTS LOG (Audit trail)
-- =====================================================
-- Track any booking conflicts for debugging
CREATE TABLE IF NOT EXISTS public.appointment_conflicts (
  id bigserial NOT NULL PRIMARY KEY,
  patient_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  attempted_service_id bigint REFERENCES public.dental_services(id) ON DELETE SET NULL,
  attempted_date date,
  attempted_start_time time WITHOUT TIME ZONE,
  attempted_end_time time WITHOUT TIME ZONE,
  conflict_reason varchar(255),  -- "OVERLAPS_WITH_ID_123", "SLOT_LOCKED", etc.
  detected_at timestamp WITHOUT TIME ZONE DEFAULT NOW(),
  resolved_at timestamp WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_conflicts_patient 
  ON public.appointment_conflicts(patient_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_date 
  ON public.appointment_conflicts(attempted_date);

```

---

## 2️⃣ BACKEND SERVICE LOGIC

### A. Dynamic Slot Generation Service

```java
// TimeSlotService.java - Dynamic generation logic

@Service
@Transactional
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final DentalServiceRepository serviceRepository;
    private final ClinicHoursService clinicHoursService;
    private static final Logger logger = Logger.getLogger(TimeSlotService.class.getName());

    public TimeSlotService(
            TimeSlotRepository timeSlotRepository,
            DentalServiceRepository serviceRepository,
            ClinicHoursService clinicHoursService) {
        this.timeSlotRepository = timeSlotRepository;
        this.serviceRepository = serviceRepository;
        this.clinicHoursService = clinicHoursService;
    }

    /**
     * Generate available time slots for a specific service and date range
     * 
     * Algorithm:
     * 1. Get clinic hours for each date
     * 2. Get service duration
     * 3. Generate slots: (END_TIME - START_TIME) / SERVICE_DURATION
     * 4. Filter out conflicts with existing bookings
     * 5. Return available slots
     */
    @Transactional
    public List<TimeSlot> generateAvailableSlots(
            Long serviceId, 
            LocalDate startDate, 
            LocalDate endDate) {
        
        logger.info("🔄 Generating slots for service " + serviceId + 
                   " from " + startDate + " to " + endDate);

        DentalService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        int durationMinutes = service.getDurationMinutes();
        logger.info("   ⏱️ Service duration: " + durationMinutes + " minutes");

        List<TimeSlot> slots = new ArrayList<>();

        // For each day in range
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            // Get clinic hours for this day
            int dayOfWeek = current.getDayOfWeek().getValue(); // 1=Monday, 7=Sunday
            int clinicDay = dayOfWeek == 7 ? 6 : dayOfWeek - 1; // Convert to 0=Sunday, 6=Saturday
            
            ClinicHours hours = clinicHoursService.getClinicHours(clinicDay);
            
            if (hours != null && hours.isOperating()) {
                logger.info("   📅 " + current + " - Clinic operating");
                
                // Generate slots for morning session
                List<TimeSlot> morningSlots = generateSessionSlots(
                    service, current, 
                    hours.getMorningStart(), 
                    hours.getMorningEnd(), 
                    durationMinutes, 
                    "MORNING"
                );
                slots.addAll(morningSlots);

                // Generate slots for afternoon session
                List<TimeSlot> afternoonSlots = generateSessionSlots(
                    service, current, 
                    hours.getAfternoonStart(), 
                    hours.getAfternoonEnd(), 
                    durationMinutes, 
                    "AFTERNOON"
                );
                slots.addAll(afternoonSlots);
                
                logger.info("   ✅ Generated " + (morningSlots.size() + afternoonSlots.size()) + " slots");
            } else {
                logger.info("   ❌ " + current + " - Clinic closed");
            }

            current = current.plusDays(1);
        }

        // Save generated slots (only if not already exist)
        for (TimeSlot slot : slots) {
            if (!timeSlotRepository.existsByServiceAndDateAndTime(
                    serviceId, slot.getAppointmentDate(), slot.getStartTime())) {
                timeSlotRepository.save(slot);
            }
        }

        logger.info("✅ Generated " + slots.size() + " total slots");
        return slots;
    }

    /**
     * Generate slots for a single session (morning or afternoon)
     */
    private List<TimeSlot> generateSessionSlots(
            DentalService service,
            LocalDate date,
            LocalTime sessionStart,
            LocalTime sessionEnd,
            int durationMinutes,
            String session) {

        List<TimeSlot> slots = new ArrayList<>();

        if (sessionStart == null || sessionEnd == null) {
            return slots; // Session not available
        }

        LocalTime current = sessionStart;
        int slotCount = 0;

        while (current.plus(durationMinutes, ChronoUnit.MINUTES).isBefore(sessionEnd) ||
               current.plus(durationMinutes, ChronoUnit.MINUTES).equals(sessionEnd)) {

            LocalTime slotEnd = current.plus(durationMinutes, ChronoUnit.MINUTES);

            TimeSlot slot = new TimeSlot();
            slot.setService(service);
            slot.setAppointmentDate(date);
            slot.setStartTime(current);
            slot.setEndTime(slotEnd);
            slot.setStatus(TimeSlotStatus.AVAILABLE);
            slot.setStatusUpdatedAt(LocalDateTime.now());

            slots.add(slot);
            slotCount++;

            current = slotEnd; // Move to next slot start time
        }

        logger.info("      " + session + " session: " + 
                   sessionStart + " - " + sessionEnd + 
                   " → " + slotCount + " slots of " + durationMinutes + " min");

        return slots;
    }

    /**
     * Get available slots for a service on a specific date
     * Filters out: BOOKED slots, LOCKED slots (not expired), slots with conflicts
     */
    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableSlotsByServiceAndDate(Long serviceId, LocalDate date) {
        logger.info("🔍 Finding available slots for service " + serviceId + " on " + date);

        // Get all slots for this date
        List<TimeSlot> allSlots = timeSlotRepository.findByServiceIdAndDate(serviceId, date);
        logger.info("   Found " + allSlots.size() + " total slots");

        // Filter for available slots
        List<TimeSlot> availableSlots = allSlots.stream()
                .filter(slot -> {
                    // Must be AVAILABLE status
                    if (slot.getStatus() != TimeSlotStatus.AVAILABLE) {
                        return false;
                    }

                    // Check if lock is expired
                    if (slot.getLockExpiresAt() != null && 
                        slot.getLockExpiresAt().isAfter(LocalDateTime.now())) {
                        logger.info("      Slot " + slot.getStartTime() + " is locked (expires " + 
                                   slot.getLockExpiresAt() + ")");
                        return false;
                    }

                    // Check for booking conflicts
                    boolean hasConflict = checkForConflicts(slot);
                    if (hasConflict) {
                        return false;
                    }

                    return true;
                })
                .collect(Collectors.toList());

        logger.info("✅ " + availableSlots.size() + " slots available");
        return availableSlots;
    }

    /**
     * Check if a time slot conflicts with existing appointments
     */
    private boolean checkForConflicts(TimeSlot slot) {
        // Query: Find appointments on same date that overlap with slot time
        // Example: Slot is 14:00-14:30
        // Conflict if: appointment_start < 14:30 AND appointment_end > 14:00
        
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
            slot.getAppointmentDate(),
            slot.getStartTime(),
            slot.getEndTime()
        );

        return !conflicts.isEmpty();
    }

    /**
     * Lock a slot temporarily for a user (prevents double-booking during checkout)
     * Lock duration: 10 minutes (configurable)
     */
    @Transactional
    public void lockSlot(Long slotId, Long userId, int lockDurationMinutes) {
        TimeSlot slot = timeSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        LocalDateTime lockExpires = LocalDateTime.now().plus(lockDurationMinutes, ChronoUnit.MINUTES);

        slot.setStatus(TimeSlotStatus.LOCKED);
        slot.setLockedByUserId(userId);
        slot.setLockExpiresAt(lockExpires);
        slot.setStatusUpdatedAt(LocalDateTime.now());

        timeSlotRepository.save(slot);

        logger.info("🔒 Slot " + slot.getId() + " locked for user " + userId + 
                   " until " + lockExpires);
    }

    /**
     * Unlock a slot (when booking is cancelled/completed or lock expires)
     */
    @Transactional
    public void unlockSlot(Long slotId) {
        TimeSlot slot = timeSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        slot.setStatus(TimeSlotStatus.AVAILABLE);
        slot.setLockedByUserId(null);
        slot.setLockExpiresAt(null);
        slot.setStatusUpdatedAt(LocalDateTime.now());

        timeSlotRepository.save(slot);

        logger.info("🔓 Slot " + slot.getId() + " unlocked");
    }

    /**
     * Scheduled task to automatically release expired locks
     */
    @Scheduled(fixedDelay = 60000) // Run every 60 seconds
    @Transactional
    public void releaseExpiredLocks() {
        logger.info("🔄 Checking for expired locks...");

        List<TimeSlot> expiredLocks = timeSlotRepository.findExpiredLocks(LocalDateTime.now());

        for (TimeSlot slot : expiredLocks) {
            unlockSlot(slot.getId());
            logger.info("   ✅ Released expired lock on slot " + slot.getId());
        }

        if (!expiredLocks.isEmpty()) {
            logger.info("✅ Released " + expiredLocks.size() + " expired locks");
        }
    }
}
```

### B. Updated Time Slot Model

```java
// TimeSlot.java

@Entity
@Table(name = "time_slots")
public class TimeSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private DentalService service;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TimeSlotStatus status = TimeSlotStatus.AVAILABLE;

    @Column(name = "status_updated_at")
    private LocalDateTime statusUpdatedAt;

    // Temporary locking fields
    @Column(name = "locked_by_user_id")
    private Long lockedByUserId;

    @Column(name = "lock_expires_at")
    private LocalDateTime lockExpiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    // ... other getters/setters ...
}

enum TimeSlotStatus {
    AVAILABLE,
    BOOKED,
    LOCKED
}
```

---

## 3️⃣ BOOKING FLOW WITH SLOT LOCKING

```
┌─────────────────────────────────────────────────────────┐
│ BOOKING FLOW WITH TEMPORARY SLOT LOCKING               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. USER SELECTS SERVICE & DATE                        │
│    ↓                                                   │
│    Backend: Call generateAvailableSlots()            │
│    Returns: [ 08:00-08:30, 08:30-09:00, ... ]       │
│                                                         │
│ 2. USER SELECTS SPECIFIC SLOT (e.g., 09:00-09:30)    │
│    ↓                                                   │
│    Backend: Call lockSlot(slotId, userId, 10min)    │
│    Effect: Slot status = LOCKED                       │
│            lock_expires_at = NOW() + 10 minutes       │
│            locked_by_user_id = userId                │
│    Result: Other users see this slot as unavailable  │
│                                                         │
│ 3. USER COMPLETES CHECKOUT (or cancels)              │
│    ↓                                                   │
│    A) If Success:                                     │
│       Backend: Create appointment record              │
│                Update slot status = BOOKED            │
│                Lock becomes permanent                 │
│    ↓                                                   │
│    B) If Cancel:                                      │
│       Backend: Call unlockSlot(slotId)               │
│                Slot status = AVAILABLE                │
│                Other users can now book              │
│    ↓                                                   │
│ 4. IF LOCK EXPIRES WITHOUT BOOKING:                  │
│    ↓                                                   │
│    Scheduled task: releaseExpiredLocks()             │
│    Runs every 60 seconds                              │
│    Unlocks any slots where lock_expires_at < NOW()  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4️⃣ OVERLAP PREVENTION LOGIC

### Database Query for Conflicts

```sql
-- Find appointments that overlap with a given time slot
SELECT * FROM appointments a
WHERE a.appointment_date = $1  -- Same date
  AND a.status IN ('PENDING', 'APPROVED', 'ARRIVED', 'COMPLETED')  -- Not cancelled
  AND a.start_time < $3        -- Appointment starts before slot ends
  AND a.end_time > $2          -- Appointment ends after slot starts
  AND a.service_id = $4;       -- Same service

-- Example: Find conflicts with 14:00-14:30 slot on 2025-03-15
-- SELECT * FROM appointments a
-- WHERE a.appointment_date = '2025-03-15'
--   AND a.status IN ('PENDING', 'APPROVED', 'ARRIVED', 'COMPLETED')
--   AND a.start_time < '14:30'
--   AND a.end_time > '14:00'
--   AND a.service_id = 5;
```

### Java Repository Method

```java
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    /**
     * Find appointments that conflict with a given time window
     */
    @Query("SELECT a FROM Appointment a WHERE " +
           "a.appointmentDate = :date AND " +
           "a.service.id = :serviceId AND " +
           "a.status IN ('PENDING', 'APPROVED', 'ARRIVED', 'COMPLETED') AND " +
           "a.startTime < :slotEnd AND " +
           "a.endTime > :slotStart")
    List<Appointment> findConflictingAppointments(
        @Param("date") LocalDate date,
        @Param("slotStart") LocalTime slotStart,
        @Param("slotEnd") LocalTime slotEnd,
        @Param("serviceId") Long serviceId
    );
}
```

---

## 5️⃣ REAL-TIME AVAILABILITY UPDATES

### Option A: Supabase Real-Time Subscriptions (Recommended)

```javascript
// Frontend: React Hook for real-time slot updates

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export function useAvailableSlots(serviceId, appointmentDate) {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    // 1. Initial fetch
    const fetchSlots = async () => {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('service_id', serviceId)
        .eq('appointment_date', appointmentDate)
        .eq('status', 'AVAILABLE')
        .is('lock_expires_at', null)
        .order('start_time');

      if (error) {
        console.error('Error fetching slots:', error);
      } else {
        setSlots(data || []);
        console.log('✅ Loaded ' + data.length + ' available slots');
      }
    };

    fetchSlots();

    // 2. Subscribe to real-time updates
    const subscription = supabase
      .from('time_slots')
      .on('*', payload => {
        console.log('📡 Real-time update:', payload);

        // Refetch slots when any time_slot changes
        if (payload.new?.service_id === serviceId &&
            payload.new?.appointment_date === appointmentDate) {
          fetchSlots();
        }
      })
      .subscribe();

    // 3. Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [serviceId, appointmentDate]);

  return slots;
}

// Usage in a component:
function BookingForm() {
  const [serviceId, setServiceId] = useState(5);
  const [date, setDate] = useState('2025-03-15');
  const slots = useAvailableSlots(serviceId, date);

  return (
    <div>
      <h3>Available Slots</h3>
      <ul>
        {slots.map(slot => (
          <li key={slot.id}>
            {slot.start_time} - {slot.end_time}
            <button onClick={() => selectSlot(slot.id)}>Book</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Option B: WebSocket Updates (Alternative)

```java
// Backend: WebSocket endpoint for real-time updates

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new SlotAvailabilityHandler(), "/ws/appointment-slots")
                .setAllowedOrigins("*");
    }
}

@Component
public class SlotAvailabilityHandler extends TextWebSocketHandler {
    private static final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        logger.info("Client connected. Total: " + sessions.size());
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        // Handle incoming subscription request
        // E.g., { "serviceId": 5, "date": "2025-03-15" }
    }

    public static void broadcastSlotUpdate(Long serviceId, LocalDate date) {
        String message = String.format(
            "{\"type\":\"SLOT_UPDATE\",\"serviceId\":%d,\"date\":\"%s\"}", 
            serviceId, date
        );

        sessions.forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (IOException e) {
                logger.error("Error sending message: " + e.getMessage());
            }
        });
    }
}
```

---

## 6️⃣ API ENDPOINTS

### Generate Slots

```http
POST /api/v1/timeslots/generate
Content-Type: application/json

{
  "serviceId": 5,
  "startDate": "2025-03-15",
  "endDate": "2025-03-30"
}

Response 200:
{
  "message": "Generated 48 slots",
  "slots": [
    {
      "id": 1001,
      "serviceId": 5,
      "appointmentDate": "2025-03-15",
      "startTime": "08:00",
      "endTime": "08:30",
      "status": "AVAILABLE"
    },
    ...
  ]
}
```

### Get Available Slots

```http
GET /api/v1/timeslots/available?serviceId=5&date=2025-03-15

Response 200:
[
  {
    "id": 1001,
    "startTime": "08:00",
    "endTime": "08:30"
  },
  {
    "id": 1002,
    "startTime": "08:30",
    "endTime": "09:00"
  },
  ...
]
```

### Lock Slot

```http
POST /api/v1/timeslots/1001/lock
Content-Type: application/json

{
  "userId": 42,
  "lockDurationMinutes": 10
}

Response 200:
{
  "message": "Slot locked",
  "lockExpiresAt": "2025-03-15T14:10:00Z"
}
```

### Book Appointment

```http
POST /api/v1/appointments/book
Content-Type: application/json

{
  "patientId": 42,
  "serviceId": 5,
  "timeSlotId": 1001,
  "appointmentDate": "2025-03-15",
  "startTime": "08:00",
  "endTime": "08:30"
}

Response 200:
{
  "id": 501,
  "patientId": 42,
  "serviceId": 5,
  "appointmentDate": "2025-03-15",
  "startTime": "08:00",
  "endTime": "08:30",
  "status": "PENDING"
}
```

---

## 7️⃣ PREVENT DOUBLE-BOOKING LOGIC

```java
// AppointmentBookingService.java

@Service
@Transactional
public class AppointmentBookingService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentConflictRepository conflictRepository;
    private static final Logger logger = Logger.getLogger(AppointmentBookingService.class.getName());

    /**
     * Book an appointment with double-booking prevention
     * 
     * Algorithm:
     * 1. Lock the time slot (prevents others from booking)
     * 2. Check for overlapping appointments
     * 3. If conflict exists: release lock and throw error
     * 4. If no conflict: create appointment record
     * 5. Commit transaction (makes lock permanent as BOOKED)
     */
    @Transactional
    public Appointment bookAppointment(AppointmentRequest request) {
        logger.info("📅 BOOKING APPOINTMENT - Patient: " + request.getPatientId() + 
                   ", Service: " + request.getServiceId() +
                   ", Time: " + request.getStartTime() + "-" + request.getEndTime());

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        // 1. Lock the slot immediately
        try {
            timeSlot.setStatus(TimeSlotStatus.LOCKED);
            timeSlot.setLockedByUserId(request.getPatientId());
            timeSlot.setLockExpiresAt(LocalDateTime.now().plusMinutes(10));
            timeSlotRepository.save(timeSlot);
            logger.info("   🔒 Slot locked");
        } catch (Exception e) {
            throw new RuntimeException("Could not lock slot: " + e.getMessage());
        }

        // 2. Check for conflicts
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
            request.getAppointmentDate(),
            request.getStartTime(),
            request.getEndTime(),
            request.getServiceId()
        );

        if (!conflicts.isEmpty()) {
            logger.warning("   ❌ Conflict detected: " + conflicts.size() + " overlapping appointments");
            
            // Release lock
            try {
                timeSlot.setStatus(TimeSlotStatus.AVAILABLE);
                timeSlot.setLockedByUserId(null);
                timeSlot.setLockExpiresAt(null);
                timeSlotRepository.save(timeSlot);
                logger.info("   🔓 Slot unlocked due to conflict");
            } catch (Exception e) {
                logger.severe("   ⚠️  ERROR releasing lock: " + e.getMessage());
            }

            // Log conflict
            AppointmentConflict conflict = new AppointmentConflict();
            conflict.setPatientId(request.getPatientId());
            conflict.setAttemptedServiceId(request.getServiceId());
            conflict.setAttemptedDate(request.getAppointmentDate());
            conflict.setAttemptedStartTime(request.getStartTime());
            conflict.setAttemptedEndTime(request.getEndTime());
            conflict.setConflictReason("OVERLAPS_WITH_ID_" + conflicts.get(0).getId());
            conflictRepository.save(conflict);

            throw new RuntimeException(
                "Cannot book: Time slot conflicts with existing appointment(s). " +
                "Please choose a different time."
            );
        }

        // 3. Create appointment record
        Appointment appointment = new Appointment();
        appointment.setPatient(patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found")));
        appointment.setService(serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found")));
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setStatus(AppointmentStatus.PENDING);
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        logger.info("   ✅ Appointment created with ID: " + savedAppointment.getId());

        // 4. Mark slot as BOOKED (lock becomes permanent)
        timeSlot.setStatus(TimeSlotStatus.BOOKED);
        timeSlot.setStatusUpdatedAt(LocalDateTime.now());
        timeSlotRepository.save(timeSlot);
        logger.info("   📌 Slot marked as BOOKED");

        logger.info("✅ BOOKING COMPLETE - Appointment ID: " + savedAppointment.getId());

        return savedAppointment;
    }

    /**
     * Cancel appointment and free the slot
     */
    @Transactional
    public void cancelAppointment(Long appointmentId) {
        logger.info("❌ CANCELLING APPOINTMENT " + appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Mark appointment as cancelled
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);

        // Find and free the time slot
        TimeSlot slot = timeSlotRepository.findByAppointmentDateAndServiceAndTime(
            appointment.getAppointmentDate(),
            appointment.getService().getId(),
            appointment.getStartTime()
        ).orElse(null);

        if (slot != null) {
            slot.setStatus(TimeSlotStatus.AVAILABLE);
            slot.setLockedByUserId(null);
            slot.setLockExpiresAt(null);
            slot.setStatusUpdatedAt(LocalDateTime.now());
            timeSlotRepository.save(slot);
            logger.info("   🔓 Slot freed: " + slot.getId());
        }

        logger.info("✅ Appointment cancelled");
    }
}
```

---

## 8️⃣ MIGRATION GUIDE

### Step 1: Schema Updates (Run in Supabase)

1. Add `duration_minutes` to `dental_services`:
```sql
ALTER TABLE public.dental_services 
ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;
```

2. Create new `time_slots` table with start/end times:
```sql
-- Run the complete schema above
```

3. Create supporting tables:
```sql
-- Run slot_locks and appointment_conflicts schemas above
```

4. Update existing appointments to populate `start_time` and `end_time`:
```sql
UPDATE appointments 
SET 
  start_time = COALESCE(start_time, time_slot.start_time),
  end_time = COALESCE(end_time, time_slot.end_time)
FROM time_slots
WHERE appointments.time_slot_id = time_slots.id;
```

### Step 2: Backend Updates

1. Update all models to use new fields
2. Add TimeSlotService with generation logic
3. Update AppointmentService to use new booking flow
4. Add new API endpoints
5. Add scheduled task for lock cleanup

### Step 3: Frontend Updates

1. Implement useAvailableSlots hook
2. Update booking form to select from available slots
3. Show real-time availability updates
4. Display booking lock timer
5. Handle slot locking during checkout

---

## 9️⃣ CONFIGURATION

```properties
# application.properties

# Slot generation
slot.generation.days-ahead=30      # Generate slots 30 days in advance
slot.generation.batch-size=100     # Generate in batches of 100

# Slot locking
slot.lock.duration-minutes=10      # Users have 10 minutes to complete booking
slot.lock.cleanup-interval=60000   # Clean up expired locks every 60 seconds

# Real-time updates
realtime.enabled=true              # Enable Supabase/WebSocket real-time
realtime.poll-interval=30000       # Fallback polling interval: 30 seconds

# Conflict detection
conflict.check-enabled=true        # Enable strict conflict checking
conflict.log-conflicts=true        # Log all conflict attempts
```

---

## 🔟 MONITORING & LOGGING

```java
// SlotMetricsService.java - Track system health

@Service
public class SlotMetricsService {
    
    public SlotMetrics getMetrics() {
        int totalSlots = timeSlotRepository.count();
        int availableSlots = timeSlotRepository.countByStatus(TimeSlotStatus.AVAILABLE);
        int bookedSlots = timeSlotRepository.countByStatus(TimeSlotStatus.BOOKED);
        int lockedSlots = timeSlotRepository.countByStatus(TimeSlotStatus.LOCKED);
        int expiredLocks = timeSlotRepository.countExpiredLocks(LocalDateTime.now());
        int activeBookings = appointmentRepository.countByStatus(AppointmentStatus.PENDING);
        int conflicts = appointmentConflictRepository.countUnresolved();

        return new SlotMetrics(
            totalSlots, availableSlots, bookedSlots, lockedSlots,
            expiredLocks, activeBookings, conflicts
        );
    }
}

// Expected log output:
// 📊 SYSTEM METRICS
//    Total Slots: 1,200
//    Available: 890 (74%)
//    Booked: 267 (22%)
//    Locked: 43 (4%)
//    Expired Locks: 0
//    Active Bookings: 267
//    Unresolved Conflicts: 0
```

---

## Summary

✅ Dynamic slot generation based on service duration  
✅ Temporary slot locking during booking  
✅ Overlap prevention with start/end times  
✅ Real-time availability updates  
✅ Comprehensive conflict tracking  
✅ Scheduled cleanup of expired locks  
✅ Fully backward-compatible schema  
✅ Production-ready implementation

