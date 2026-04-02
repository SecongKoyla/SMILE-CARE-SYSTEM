package com.smilecare.smilecare_backend.timeslot.service;

import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.repository.TimeSlotRepository;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final ClinicHoursService clinicHoursService;
    private static final Logger logger = Logger.getLogger(TimeSlotService.class.getName());

    public TimeSlotService(TimeSlotRepository timeSlotRepository, ClinicHoursService clinicHoursService) {
        this.timeSlotRepository = timeSlotRepository;
        this.clinicHoursService = clinicHoursService;
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
            
            // Filter by clinic operating hours
            List<TimeSlotDTO> result = slots.stream()
                    .filter(this::isTimeSlotDayOpen)
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
     * Filters by service ID, status=AVAILABLE, and clinic operating hours
     */
    @Transactional(readOnly = true)
    public List<TimeSlotDTO> getAvailableTimeSlotsByService(Long serviceId) {
        try {
            logger.info("📅 Fetching available time slots for service " + serviceId + " from today");
            
            if (serviceId == null || serviceId <= 0) {
                throw new IllegalArgumentException("Invalid service ID: " + serviceId);
            }
            
            LocalDate today = LocalDate.now();
            
            // Fetch available slots for this service from today onwards using database query
            List<TimeSlot> slots = timeSlotRepository.findAvailableByServiceFromDate(serviceId, today);
            
            // Filter by clinic operating hours
            List<TimeSlotDTO> result = slots.stream()
                    .filter(this::isTimeSlotDayOpen)
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

    /**
     * Get available time slots for a specific service and date
     */
    @Transactional(readOnly = true)
    public List<TimeSlotDTO> getAvailableTimeSlotsByServiceAndDate(Long serviceId, LocalDate date) {
        try {
            logger.info("📅 Fetching available time slots for service " + serviceId + " on date " + date);
            
            if (serviceId == null || serviceId <= 0) {
                throw new IllegalArgumentException("Invalid service ID: " + serviceId);
            }
            
            if (date == null) {
                throw new IllegalArgumentException("Date cannot be null");
            }
            
            if (date.isBefore(LocalDate.now())) {
                logger.fine("ℹ️ Requested date is in the past: " + date);
                return List.of(); // Return empty list for past dates
            }
            
            // Fetch available slots for this service and date using database query
            List<TimeSlot> slots = timeSlotRepository.findAvailableByServiceAndDate(serviceId, date);
            
            // Filter by clinic operating hours
            List<TimeSlotDTO> result = slots.stream()
                    .filter(this::isTimeSlotDayOpen)
                    .map(TimeSlotDTO::new)
                    .collect(Collectors.toList());
            
            logger.info("✅ Found " + result.size() + " available time slots for service " + serviceId + " on " + date);
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
            
            // Filter by clinic operating hours
            List<TimeSlotDTO> result = slots.stream()
                    .filter(this::isTimeSlotDayOpen)
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
    private boolean isTimeSlotDayOpen(TimeSlot timeSlot) {
        if (timeSlot == null || timeSlot.getDate() == null) {
            logger.warning("⚠️ TimeSlot has null date");
            return false;
        }

        try {
            // Convert Java date's dayOfWeek to clinic hours dayOfWeek
            int javaDayOfWeek = timeSlot.getDate().getDayOfWeek().getValue(); // Monday=1, Sunday=7
            int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1; // Convert to 0=Monday, 6=Sunday

            // Check if clinic is open on this day
            Boolean isOpen = clinicHoursService.isClinicOpenOnDay(clinicDayOfWeek);
            
            if (!isOpen) {
                logger.fine("ℹ️ TimeSlot on " + timeSlot.getDate() + " is on a closed day (dayOfWeek=" + clinicDayOfWeek + ")");
            }
            
            return isOpen;
        } catch (Exception e) {
            logger.warning("⚠️ Error checking if clinic is open: " + e.getMessage());
            return true; // Default to allowing if there's an error
        }
    }
}
