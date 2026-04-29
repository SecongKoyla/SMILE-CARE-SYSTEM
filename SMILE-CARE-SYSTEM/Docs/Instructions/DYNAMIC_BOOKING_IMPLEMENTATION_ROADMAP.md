# 🚀 Implementation Roadmap - Dynamic Booking System

**Timeline:** 4-6 weeks | **Complexity:** High | **Risk:** Medium

---

## 📊 Phased Rollout Plan

```
PHASE 1: DATABASE & SCHEMA (Week 1)
└─ Setup Supabase tables
└─ Add duration_minutes field
└─ Create time_slots with start/end

PHASE 2: BACKEND SERVICES (Week 2-3)
└─ Implement TimeSlotService
└─ Add slot generation logic
└─ Implement overlap prevention
└─ Add slot locking mechanism

PHASE 3: API ENDPOINTS (Week 3)
└─ /api/v1/timeslots/generate
└─ /api/v1/timeslots/available
└─ /api/v1/timeslots/{id}/lock
└─ Update appointment booking endpoint

PHASE 4: FRONTEND (Week 4)
└─ Update booking form
└─ Add slot selection UI
└─ Implement real-time updates
└─ Add lock timer display

PHASE 5: TESTING & OPTIMIZATION (Week 5-6)
└─ Unit tests
└─ Integration tests
└─ Load testing
└─ Performance optimization
└─ Production deployment
```

---

## PHASE 1: DATABASE & SCHEMA (1 Week)

### Step 1.1: Add Duration to Services

```sql
-- In Supabase SQL Editor:
ALTER TABLE public.dental_services 
ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;

-- Update existing services with durations:
UPDATE public.dental_services 
SET duration_minutes = CASE 
  WHEN name LIKE '%Cleaning%' THEN 30
  WHEN name LIKE '%Filling%' THEN 60
  WHEN name LIKE '%Root%' THEN 90
  ELSE 30
END;
```

### Step 1.2: Create New time_slots Table

```sql
-- Copy the complete schema from DYNAMIC_BOOKING_SYSTEM_COMPLETE.md
-- Section 1️⃣ - Run the complete time_slots table creation
```

### Step 1.3: Verify Schema

```sql
-- Check columns exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'time_slots';

-- Expected output:
-- id | bigint
-- service_id | bigint
-- appointment_date | date
-- start_time | time without time zone
-- end_time | time without time zone
-- status | character varying
-- locked_by_user_id | bigint
-- lock_expires_at | timestamp without time zone
-- ... (other columns)
```

**Deliverables:**
- ✅ Supabase schema updated
- ✅ Backup of old schema created
- ✅ New tables tested and verified

---

## PHASE 2: BACKEND SERVICES (2-3 Weeks)

### Step 2.1: Create TimeSlot Model

**File:** `src/main/java/.../timeslot/model/TimeSlot.java`

```java
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

    // LOCKING FIELDS
    @Column(name = "locked_by_user_id")
    private Long lockedByUserId;

    @Column(name = "lock_expires_at")
    private LocalDateTime lockExpiresAt;

    @Column(name = "status_updated_at")
    private LocalDateTime statusUpdatedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public TimeSlotStatus getStatus() { return status; }
    // ... rest of getters/setters ...
}

enum TimeSlotStatus {
    AVAILABLE,
    BOOKED,
    LOCKED
}
```

### Step 2.2: Create TimeSlot Repository

**File:** `src/main/java/.../timeslot/repository/TimeSlotRepository.java`

```java
@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    
    // Find slots by service and date
    List<TimeSlot> findByServiceIdAndAppointmentDate(Long serviceId, LocalDate date);
    
    // Find available slots (not booked, not locked with active lock)
    List<TimeSlot> findByStatusAndLockExpiresAtNull(TimeSlotStatus status);
    
    // Check if slot exists
    boolean existsByServiceIdAndAppointmentDateAndStartTime(
        Long serviceId, LocalDate date, LocalTime startTime);
    
    // Find expired locks (for cleanup)
    @Query("SELECT ts FROM TimeSlot ts " +
           "WHERE ts.status = 'LOCKED' " +
           "AND ts.lockExpiresAt < :now")
    List<TimeSlot> findExpiredLocks(@Param("now") LocalDateTime now);
    
    // Count by status
    int countByStatus(TimeSlotStatus status);
}
```

### Step 2.3: Create TimeSlotService (Core Logic)

**File:** `src/main/java/.../timeslot/service/TimeSlotService.java`

Use the complete service code from **DYNAMIC_BOOKING_SYSTEM_COMPLETE.md**, **Section 2️⃣**

Key methods:
- `generateAvailableSlots()` - Generate slots for date range
- `getAvailableSlotsByServiceAndDate()` - Get available slots with filtering
- `lockSlot()` - Temporarily lock for booking
- `unlockSlot()` - Release lock
- `releaseExpiredLocks()` - Scheduled cleanup task

### Step 2.4: Update Appointment Model

Add new fields to `Appointment.java`:

```java
@Column(name = "start_time")
private LocalTime startTime;

@Column(name = "end_time")
private LocalTime endTime;
```

### Step 2.5: Update AppointmentBookingService

Replace booking logic with version from **DYNAMIC_BOOKING_SYSTEM_COMPLETE.md**, **Section 7️⃣**

Key improvement:
- Lock slot before checking conflicts
- Check for overlaps
- If conflict: release lock
- If no conflict: create appointment and mark slot as BOOKED

**Deliverables:**
- ✅ TimeSlot model created and tested
- ✅ Repository methods working
- ✅ TimeSlotService with generation logic
- ✅ Booking service updated with locking
- ✅ Unit tests passing

---

## PHASE 3: API ENDPOINTS (1 Week)

### Step 3.1: Create TimeSlotController

**File:** `src/main/java/.../timeslot/controller/TimeSlotController.java`

```java
@RestController
@RequestMapping("/api/v1/timeslots")
public class TimeSlotController {

    private final TimeSlotService timeSlotService;
    private static final Logger logger = Logger.getLogger(TimeSlotController.class.getName());

    @PostMapping("/generate")
    public ResponseEntity<?> generateSlots(@RequestBody GenerateSlotRequest request) {
        try {
            logger.info("📅 Generating slots for service " + request.getServiceId());
            List<TimeSlot> slots = timeSlotService.generateAvailableSlots(
                request.getServiceId(),
                request.getStartDate(),
                request.getEndDate()
            );
            return ResponseEntity.ok(new GenerateSlotResponse(
                "Generated " + slots.size() + " slots",
                slots
            ));
        } catch (Exception e) {
            logger.severe("❌ Error generating slots: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam Long serviceId,
            @RequestParam String date) {
        try {
            LocalDate appointmentDate = LocalDate.parse(date);
            List<TimeSlot> slots = timeSlotService.getAvailableSlotsByServiceAndDate(
                serviceId, appointmentDate
            );
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<?> lockSlot(
            @PathVariable Long id,
            @RequestBody LockSlotRequest request) {
        try {
            timeSlotService.lockSlot(id, request.getUserId(), 10);
            return ResponseEntity.ok(Map.of("message", "Slot locked for 10 minutes"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<?> unlockSlot(@PathVariable Long id) {
        try {
            timeSlotService.unlockSlot(id);
            return ResponseEntity.ok(Map.of("message", "Slot unlocked"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }
}
```

### Step 3.2: Update AppointmentController

Update booking endpoint to use new TimeSlot locking:

```java
@PostMapping("/book")
public ResponseEntity<?> bookAppointment(@Valid @RequestBody AppointmentRequest request) {
    try {
        logger.info("📅 Booking appointment");
        
        // 1. Lock the time slot (10 minute window)
        timeSlotService.lockSlot(request.getTimeSlotId(), request.getPatientId(), 10);
        
        // 2. Proceed with booking (uses AppointmentBookingService)
        Appointment appointment = appointmentBookingService.bookAppointment(request);
        
        // 3. If successful, slot is marked as BOOKED
        return ResponseEntity.ok(appointment);
        
    } catch (Exception e) {
        logger.warning("❌ Booking failed: " + e.getMessage());
        
        // Release the lock
        try {
            timeSlotService.unlockSlot(request.getTimeSlotId());
        } catch (Exception rethrow) {
            logger.severe("Failed to release lock: " + rethrow.getMessage());
        }
        
        return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
    }
}
```

### Step 3.3: Test Endpoints

Using Postman or curl:

```bash
# 1. Generate slots for service 5, March 15-30
curl -X POST http://localhost:8085/api/v1/timeslots/generate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 5,
    "startDate": "2025-03-15",
    "endDate": "2025-03-30"
  }'

# Expected: Generated 48 slots

# 2. Get available slots
curl http://localhost:8085/api/v1/timeslots/available\?serviceId=5\&date=2025-03-15

# Expected: List of available time slots

# 3. Lock a slot
curl -X POST http://localhost:8085/api/v1/timeslots/1001/lock \
  -H "Content-Type: application/json" \
  -d '{"userId": 42}'

# Expected: Slot locked for 10 minutes

# 4. Book appointment
curl -X POST http://localhost:8085/api/v1/appointments/book \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 42,
    "serviceId": 5,
    "timeSlotId": 1001,
    "appointmentDate": "2025-03-15",
    "startTime": "08:00",
    "endTime": "08:30"
  }'

# Expected: Appointment created, slot marked as BOOKED
```

**Deliverables:**
- ✅ All API endpoints working
- ✅ Slots generating correctly
- ✅ Locking mechanism tested
- ✅ Booking with conflict prevention tested
- ✅ API documentation complete

---

## PHASE 4: FRONTEND (1 Week)

### Step 4.1: Create useAvailableSlots Hook

**File:** `src/hooks/useAvailableSlots.js`

```javascript
import { useEffect, useState } from 'react';
import { API_URL } from '../api/api.js';

export function useAvailableSlots(serviceId, appointmentDate) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!serviceId || !appointmentDate) return;

    const fetchSlots = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/timeslots/available?serviceId=${serviceId}&date=${appointmentDate}`
        );
        if (!response.ok) throw new Error('Failed to fetch slots');
        
        const data = await response.json();
        setSlots(data);
        console.log('✅ Loaded ' + data.length + ' available slots');
      } catch (err) {
        console.error('❌ Error fetching slots:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();

    // Poll for updates every 30 seconds (fallback)
    const interval = setInterval(fetchSlots, 30000);
    return () => clearInterval(interval);
  }, [serviceId, appointmentDate]);

  return { slots, loading, error };
}
```

### Step 4.2: Update BookingForm Component

```javascript
import { useState } from 'react';
import { useAvailableSlots } from '../hooks/useAvailableSlots.js';

export function BookingForm() {
  const [service, setService] = useState(5);
  const [date, setDate] = useState('2025-03-15');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [lockTimer, setLockTimer] = useState(0);

  const { slots, loading } = useAvailableSlots(service, date);

  const handleSelectSlot = async (slot) => {
    try {
      // Lock the slot
      const response = await fetch(
        `/api/v1/timeslots/${slot.id}/lock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: getCurrentUserId() })
        }
      );

      if (!response.ok) throw new Error('Could not lock slot');

      setSelectedSlot(slot);
      setLockTimer(600); // 10 minutes = 600 seconds

      console.log('🔒 Slot locked for 10 minutes');
    } catch (err) {
      console.error('❌ Error locking slot:', err);
      alert('Could not reserve this slot. Please try another.');
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!lockTimer) return;
    const interval = setInterval(() => setLockTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [lockTimer]);

  return (
    <div>
      <h2>Book Your Appointment</h2>

      {/* Service & Date Selection */}
      <div>
        <label>Service:</label>
        <select value={service} onChange={(e) => setService(parseInt(e.target.value))}>
          <option value={5}>Teeth Cleaning (30 min)</option>
          <option value={6}>Filling (60 min)</option>
          <option value={7}>Root Canal (90 min)</option>
        </select>
      </div>

      <div>
        <label>Date:</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />
      </div>

      {/* Available Slots */}
      <div>
        <h3>Available Times</h3>
        {loading ? (
          <p>⏳ Loading available slots...</p>
        ) : (
          <div className="slots-grid">
            {slots.map(slot => (
              <button
                key={slot.id}
                className={`slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                onClick={() => handleSelectSlot(slot)}
              >
                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lock Timer */}
      {selectedSlot && (
        <div className="lock-timer">
          🔒 Slot reserved for: {formatTime(lockTimer)}
          {lockTimer < 60 && <span className="warning">⚠️ Less than 1 minute left!</span>}
        </div>
      )}

      {/* Checkout Button */}
      <button 
        onClick={handleCheckout}
        disabled={!selectedSlot || lockTimer === 0}
      >
        Proceed to Checkout ({formatTime(lockTimer)})
      </button>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

**Deliverables:**
- ✅ Slot selection UI working
- ✅ Real-time slot updates implemented
- ✅ Lock timer displayed
- ✅ Booking UX improved

---

## PHASE 5: TESTING & DEPLOYMENT (2 Weeks)

### Step 5.1: Unit Tests

```javascript
// __tests__/TimeSlotService.test.js

describe('TimeSlotService', () => {
  it('should generate 8 slots for 30-min service in 4-hour session', () => {
    // (12:00 - 08:00) / 30min = 8 slots
    const slots = generateSlots('08:00', '12:00', 30);
    expect(slots.length).toBe(8);
  });

  it('should prevent overlapping bookings', () => {
    // If slot 08:00-08:30 is BOOKED,
    // Request for 08:15-08:45 should fail
    const result = bookAppointment(08:15, 08:45);
    expect(result).toThrow('OVERLAP_CONFLICT');
  });

  it('should release expired locks automatically', () => {
    // If lock expires at 14:10 and current time is 14:11,
    // Slot should be AVAILABLE
    const isAvailable = isSlotAvailable(lockExpiredAt_14_10, currentTime_14_11);
    expect(isAvailable).toBe(true);
  });
});
```

### Step 5.2: Load Testing

```bash
# Using Apache JMeter
# Test concurrent bookings to ensure no double-booking

# Scenario:
# - 100 concurrent users
# - All trying to book same 14:00-14:30 slot
# - Only 1 should succeed, rest should fail with conflict error

# Expected results:
# ✅ 1 successful booking
# ✅ 99 conflict errors
# ✅ No double-booking
# ✅ Response time < 500ms
```

### Step 5.3: Performance Optimization

```sql
-- Add indexes for query performance
CREATE INDEX idx_time_slots_service_date 
  ON public.time_slots(service_id, appointment_date);

CREATE INDEX idx_appointments_date_time 
  ON public.appointments(appointment_date, start_time, end_time);

-- Verify indexes are being used:
EXPLAIN SELECT * FROM time_slots 
WHERE service_id = 5 AND appointment_date = '2025-03-15';
```

### Step 5.4: Production Deployment

```bash
# 1. Backup current database
$ pg_dump production_db > backup_$(date +%Y%m%d).sql

# 2. Run schema migrations
$ flyway migrate -locations=db/migration

# 3. Deploy backend (blue-green deployment)
$ deploy-service smile-care-backend:v2.0

# 4. Monitor logs for errors
$ tail -f /var/log/smile-care-backend.log

# 5. Deploy frontend
$ npm run build
$ deploy-frontend smile-care:v2.0

# 6. Smoke tests
$ run-test-suite integration-tests/
```

---

## ⏱️ Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 3 days | Database schema |
| Phase 2 | 8 days | Backend services |
| Phase 3 | 5 days | API endpoints |
| Phase 4 | 5 days | Frontend UI |
| Phase 5 | 10 days | Testing & deployment |
| **Total** | **31 days** | **5 phases** |

---

## 🎯 Success Metrics

✅ No double-bookings (0 conflicts in production)  
✅ Slots generated correctly (slot count = (END-START)/DURATION)  
✅ Locks expire automatically (< 1 second after expiration)  
✅ Real-time updates (< 3 second latency)  
✅ Performance: Generate 1,000 slots in < 5 seconds  
✅ User satisfaction: 95%+ booking success rate  

---

## 🚨 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database migration downtime | Low | High | Test migration on staging first |
| Double-booking edge case | Medium | Critical | Implement pessimistic locking |
| Performance degradation | Medium | Medium | Add indexes & caching |
| User confusion with UI | Medium | Low | A/B test with 10% of users first |
| Slot generation errors | Low | Medium | Comprehensive logging & alerts |

---

## Support & Maintenance

**24/7 Monitoring:**
- Slot generation status
- Lock expiration rate
- Booking conflict rate
- System performance

**Monthly Reviews:**
- Booking success rate analysis
- User feedback collection
- Performance optimization

---

**Ready to start? Begin with Phase 1 and follow the roadmap!** 🚀
