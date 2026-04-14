# Dynamic Hourly Time Slots - Implementation Roadmap

**Status:** Ready for Implementation  
**Critical Fixes Applied:** ✅ 500 Error Fixed  
**Date:** April 2, 2026  

---

## 🎯 WHAT WAS FIXED

### Fix 1: 500 Error - Clinic Hours Endpoint
**File:** `ClinicHoursService.java`  
**Change:** Added `@Transactional(readOnly = true)` to:
- `getAllClinicHours()`
- `getClinicHoursByDay(Integer dayOfWeek)`

**Why:** Hibernate needs active transaction context to load and convert entities to DTOs. Without it, the session closes before DTO mapping occurs.

### Fix 2: Hibernate Connection Issues
**File:** `application.properties`  
**Changes Added:**
```properties
spring.jpa.properties.hibernate.enable_lazy_load_no_trans=false
spring.jpa.open-in-view=false
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=30000
```

**Why:** Ensures stable JDBC connection pool and proper transaction handling throughout request lifecycle.

---

## ✅ IMMEDIATE NEXT STEPS

### 1. Rebuild & Test the Fix (5 minutes)

```bash
# Navigate to backend
cd smilecare-backend/smilecare-backend

# Clean build
./mvnw clean compile

# Start server
./mvnw spring-boot:run
```

**Test the endpoint:**
```bash
# curl
curl http://localhost:8085/api/v1/clinic-hours

# Or visit in browser
http://localhost:8085/api/v1/clinic-hours
```

**Expected:** 200 OK with clinic hours array (NOT 500 error)

---

### 2. Implement Dynamic Hourly Slots (1-2 hours)

Follow this sequence:

#### **Step 1: Create Database Tables** (15 mins)
Run SQL from `DYNAMIC_SLOTS_COMPREHENSIVE_REDESIGN.md` Part 2:
- `availability_overrides` table
- Views for easier querying

#### **Step 2: Create Backend Entities & Repositories** (30 mins)
Add to backend:
1. `AvailabilityOverride.java` entity
2. `AvailabilityOverrideRepository.java`
3. `HourlySlotGenerationService.java`

#### **Step 3: Update Backend Services** (30 mins)
- Update `TimeSlotService.java` with override checks
- Add new method: `getAvailableTimeSlotsByServiceAndDateWithOverrides()`

#### **Step 4: Create API Endpoints** (30 mins)
- `AvailabilityOverrideController.java`
- Endpoints for disable/enable hours

#### **Step 5: Frontend - Hourly Time Slot Picker** (1 hour)
- Create `HourlyTimeSlotPicker.jsx` component
- Update `BookPage.jsx` to use it
- Style with CSS grid for 24-hour display

#### **Step 6: Admin Panel - Hourly Availability Control** (1 hour)
- Create `AdminHourlyAvailabilityPage.jsx`
- Grid showing 24 hours, each toggleable
- Show clinic hours boundaries

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Fix & Test (TODAY - 30 mins)
- [ ] Build backend: `./mvnw clean compile`
- [ ] Run backend: `./mvnw spring-boot:run`
- [ ] Test `/api/v1/clinic-hours` → Should be 200 OK ✅
- [ ] Clear browser cache and test admin panel loading clinic hours

### Phase 2: Database Schema (1-2 hours)
- [ ] Create `availability_overrides` table in Supabase
- [ ] Create views (`available_slots_detailed`, `clinic_daily_stats`)
- [ ] Verify table structure with SQL queries

### Phase 3: Backend Implementation (2-3 hours)
- [ ] Create `AvailabilityOverride.java`
- [ ] Create `AvailabilityOverrideRepository.java`
- [ ] Create `HourlySlotGenerationService.java`
- [ ] Update `TimeSlotService.java` with override checks
- [ ] Build with no errors: `./mvnw clean compile`

### Phase 4: API Endpoints (1-2 hours)
- [ ] Create `AvailabilityOverrideController.java`
- [ ] POST endpoint to disable hour
- [ ] DELETE endpoint to re-enable hour
- [ ] GET endpoint to list overrides for day
- [ ] Test with Postman/curl

### Phase 5: Frontend - User Facing (1-2 hours)
- [ ] Create `HourlyTimeSlotPicker.jsx`
- [ ] Update `BookPage.jsx` to use it
- [ ] Test time slot selection
- [ ] Test unavailable slots are greyed out

### Phase 6: Frontend - Admin Facing (1-2 hours)
- [ ] Create `AdminHourlyAvailabilityPage.jsx`
- [ ] Grid showing 24 hours with enable/disable
- [ ] Show clinic hours context
- [ ] Test toggling hours

### Phase 7: End-to-End Testing
- [ ] User books appointment at available hour
- [ ] Admin disables an hour
- [ ] User sees that hour as unavailable immediately
- [ ] Admin re-enables hour
- [ ] User sees it as available again

---

## 📁 FILES TO CREATE/MODIFY

### Backend (Create)
```
src/main/java/com/smilecare/smilecare_backend/
├── timeslot/model/
│   └── AvailabilityOverride.java (NEW)
├── timeslot/repository/
│   └── AvailabilityOverrideRepository.java (NEW)
├── timeslot/service/
│   └── HourlySlotGenerationService.java (NEW)
└── timeslot/controller/
    └── AvailabilityOverrideController.java (NEW)
```

### Backend (Modify)
```
└── timeslot/service/
    └── TimeSlotService.java (ADD method with override checks)
```

### Frontend (Create)
```
src/components/
├── HourlyTimeSlotPicker.jsx (NEW)
└── HourlyTimeSlotPicker.css (NEW)

src/pages/
├── AdminHourlyAvailabilityPage.jsx (NEW)
└── AdminHourlyAvailabilityPage.css (NEW)
```

### Frontend (Modify)
```
src/pages/
└── BookPage.jsx (USE HourlyTimeSlotPicker instead of basic slots)

src/api/
└── api.js (ADD functions for overrides)
```

### Database (SQL)
```
Add tables:
- availability_overrides
- (optional) slot_generation_log

Add views:
- available_slots_detailed
- clinic_daily_stats
```

---

## 🚀 DEPLOYMENT SEQUENCE

**Week 1:**
1. ✅ Fix 500 error (DONE)
2. Apply database schema
3. Implement backend HourlySlotGenerationService
4. Implement API endpoints

**Week 2:**
5. Build frontend HourlyTimeSlotPicker
6. Build admin AdminHourlyAvailabilityPage
7. End-to-end testing
8. Deploy to production

---

## 📊 Expected Results

### Before
- Fixed hardcoded slots: 9:00, 10:00, 14:00, 15:00
- No admin control per hour
- Limited scheduling flexibility
- 500 error on clinic hours endpoint

### After
- ✅ Dynamic hourly slots: 8:00-18:00 (flexible based on clinic hours)
- ✅ Admin can disable individual hours
- ✅ Complete scheduling flexibility
- ✅ No 500 errors
- ✅ Real-time sync when admin changes availability

---

## 🔗 REFERENCE DOCUMENTS

**Main Design Document:**
- `DYNAMIC_SLOTS_COMPREHENSIVE_REDESIGN.md` (Contains all code, SQL, and architecture)

**Quick Fix Guide:**
- `QUICK_FIX_500_ERROR.md` (Immediate error resolution)

**Implementation Guide:**
- `IMPLEMENTATION_GUIDE_STEP_BY_STEP.md` (Step-by-step coding instructions)

**Code Reference:**
- `CODE_REFERENCE_COPY_PASTE.md` (Ready-to-copy code snippets)

---

## 💬 KEY PRINCIPLES

1. **Transactional Integrity:** Always wrap data loading + conversion with `@Transactional`
2. **Admin Overrides First:** Check admin overrides BEFORE clinic hours
3. **Caching for Performance:** Use `@Cacheable` for clinic hours (already done)
4. **Lazy Loading Prevention:** Use `@Transactional` to keep session open during DTO mapping
5. **Connection Pooling:** Ensure HikariCP configured for stability

---

## ⚠️ COMMON PITFALLS TO AVOID

1. ❌ **Forgetting @Transactional** → Results in lazy loading errors
2. ❌ **Not checking admin overrides** → Users see disabled slots
3. ❌ **Hardcoding time ranges** → Not flexible for different clinics
4. ❌ **Not caching clinic hours** → N+1 query problem
5. ❌ **Missing error handling** → 500 errors instead of useful messages

---

## 🎓 LEARNING POINTS

This implementation teaches:
- Spring Data JPA with `@Transactional` handling
- Hibernate entity lifecycle and lazy loading
- Spring Cache with `@Cacheable` and `@CacheEvict`
- PostgreSQL schema design with foreign keys
- React components for iterating over time ranges
- Admin UI patterns for enable/disable controls
- API design with query parameters and overrides

---

## 📞 SUPPORT

If you encounter issues:

1. **500 Error?** → Check `QUICK_FIX_500_ERROR.md` troubleshooting
2. **Lazy Loading Error?** → Ensure `@Transactional` is on the method
3. **Slot not showing?** → Check admin overrides are cleared
4. **Cache not working?** → Verify `CacheConfig.java` is loaded
5. **Cannot connect DB?** → Check `application.properties` connection string

---

## ✨ SUCCESS CRITERIA

After full implementation, you should have:

✅ Dynamic hourly slots (e.g., 8:00, 9:00, 10:00, ..., 18:00)  
✅ Admin can disable any hour with one click  
✅ Users see real-time availability changes  
✅ No hardcoded time slots  
✅ No 500 errors on clinic hours endpoint  
✅ Responsive admin UI for hour management  
✅ Flexible for different clinic hours per day  
✅ Performance optimized with caching  

**You're ready to build! 🚀**
