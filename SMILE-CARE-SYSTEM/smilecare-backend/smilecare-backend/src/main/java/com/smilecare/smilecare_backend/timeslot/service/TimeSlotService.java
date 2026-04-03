package com.smilecare.smilecare_backend.timeslot.service;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.repository.TimeSlotRepository;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final ClinicHoursService clinicHoursService;
    private final SlotGenerationService slotGenerationService;
    private static final Logger logger = Logger.getLogger(TimeSlotService.class.getName());

    public TimeSlotService(TimeSlotRepository timeSlotRepository, 
                          ClinicHoursService clinicHoursService,
                          SlotGenerationService slotGenerationService) {
        this.timeSlotRepository = timeSlotRepository;
        this.clinicHoursService = clinicHoursService;
        this.slotGenerationService = slotGenerationService;
    }

    /**
     * Get all available time slots from today onwards that respect clinic hours
     * A time slot is available only if:
     * 1. Its status is AVAILABLE
     * 2. The clinic is operating on that day
     * 3. The date is today or later
     */
    @Transactional(readOnly = true)
    public List<TimeSlotDTO> getAvailableTimeSlots() {
        try {
            logger.info("📅 Fetching all available time slots from today");
            LocalDate today = LocalDate.now();
            
            // Fetch available slots from today onwards using database query
            List<TimeSlot> slots = timeSlotRepository.findAvailableFromDate(today);
            
            // Load clinic hours ONCE (1 query or 0 if cached)
            Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
            logger.info("✅ Loaded clinic hours from cache");
            
            // Filter using pre-loaded hours (NO additional queries)
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

    /**
     * Get available time slots for a specific service from today onwards
     * DYNAMICALLY generates hourly slots for the next 14 days based on clinic hours
     * This works for both existing services and newly created services (no pre-populated slots needed)
     */
    public List<TimeSlotDTO> getAvailableTimeSlotsByService(Long serviceId) {
        try {
            logger.info("📅 Fetching available time slots for service " + serviceId + " from today (14 days)");
            
            // Validate input
            if (serviceId == null || serviceId <= 0) {
                logger.warning("⚠️ Invalid service ID: " + serviceId);
                return new ArrayList<>(); // Return empty list instead of throwing
            }
            
            // Load clinic hours ONCE outside the loop (cached, NO queries)
            Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
            logger.info("✅ Clinic hours loaded from cache");
            
            List<TimeSlotDTO> allSlots = new ArrayList<>();
            LocalDate today = LocalDate.now();
            
            // Generate slots for next 14 days (for service selection without date picker)
            for (int i = 0; i < 14; i++) {
                LocalDate date = today.plusDays(i);
                
                try {
                    // Map Java's day of week to clinic's day of week
                    int javaDayOfWeek = date.getDayOfWeek().getValue();
                    int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1;
                    
                    // Get from pre-loaded cache (O(1) lookup, NO query)
                    ClinicHours clinicHours = cachedClinicHours.get(clinicDayOfWeek);
                    
                    // Only generate slots if clinic is operating
                    if (clinicHours != null && clinicHours.getIsOperating()) {
                        List<TimeSlotDTO> dailySlots = slotGenerationService.generateHourlySlots(serviceId, date, clinicHours);
                        if (dailySlots != null && !dailySlots.isEmpty()) {
                            allSlots.addAll(dailySlots);
                        }
                    }
                } catch (Exception dayException) {
                    logger.warning("⚠️ Error generating slots for " + date + ": " + dayException.getMessage());
                    // Continue to next day instead of failing entire request
                    continue;
                }
            }
            
            logger.info("✅ Generated " + allSlots.size() + " available time slots for service " + serviceId + " (next 14 days)");
            return allSlots;
        } catch (Exception e) {
            logger.severe("❌ Critical error fetching available time slots for service " + serviceId + ": " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list on critical error
        }
    }

    /**
     * Get available time slots for a specific service and date
     * DYNAMICALLY generates hourly slots based on clinic hours
     */
    public List<TimeSlotDTO> getAvailableTimeSlotsByServiceAndDate(Long serviceId, LocalDate date) {
        try {
            logger.info("📅 Generating hourly slots for service " + serviceId + " on date " + date);
            
            // Validate input
            if (serviceId == null || serviceId <= 0) {
                logger.warning("⚠️ Invalid service ID: " + serviceId);
                return new ArrayList<>();
            }
            
            if (date == null) {
                logger.warning("⚠️ Date cannot be null");
                return new ArrayList<>();
            }
            
            if (date.isBefore(LocalDate.now())) {
                logger.fine("ℹ️ Requested date is in the past: " + date);
                return new ArrayList<>();
            }
            
            // Get clinic hours for this date - using cached data
            int javaDayOfWeek = date.getDayOfWeek().getValue();
            int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1;
            
            // Load from cache (NO query)
            ClinicHours clinicHours = clinicHoursService.getClinicHoursForDay(clinicDayOfWeek);
            
            if (clinicHours == null || !clinicHours.getIsOperating()) {
                logger.info("ℹ️ Clinic closed on " + date);
                return new ArrayList<>();
            }
            
            // Dynamically generate hourly slots
            List<TimeSlotDTO> slots = slotGenerationService.generateHourlySlots(serviceId, date, clinicHours);
            return slots != null ? slots : new ArrayList<>();
            
        } catch (Exception e) {
            logger.severe("❌ Error generating hourly slots for service " + serviceId + " on " + date + ": " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list on error instead of throwing
        }
    }

    /**
     * Get available time slots for a specific date (all services)
     */
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
            
            // Fetch available slots for this date using database query
            List<TimeSlot> slots = timeSlotRepository.findAvailableByDate(date);
            
            // Load clinic hours ONCE (1 query or 0 if cached)
            Map<Integer, ClinicHours> cachedClinicHours = clinicHoursService.getAllClinicHoursCached();
            logger.info("✅ Loaded clinic hours from cache");
            
            // Filter using pre-loaded hours (NO additional queries)
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

    /**
     * Get all time slots (no filtering, for debugging/admin purposes)
     */
    @Transactional(readOnly = true)
    public List<TimeSlotDTO> getAllTimeSlots() {
        try {
            logger.info("📅 Fetching all time slots");
            List<TimeSlot> slots = timeSlotRepository.findAll();
            List<TimeSlotDTO> result = slots.stream()
                    .map(TimeSlotDTO::new)
                    .collect(Collectors.toList());
            logger.info("✅ Found " + result.size() + " total time slots");
            return result;
        } catch (Exception e) {
            logger.severe("❌ Error fetching all time slots: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch time slots: " + e.getMessage(), e);
        }
    }

    /**
     * Check if clinic is open on the day of the time slot
     * Day mapping: Monday=1, Tuesday=2, ..., Sunday=7 (Java's DayOfWeek)
     * Clinic mapping: Monday=0, Tuesday=1, ..., Sunday=6 (Database)
     */
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
}
