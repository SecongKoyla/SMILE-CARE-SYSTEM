package com.smilecare.smilecare_backend.timeslot.service;

import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.repository.TimeSlotRepository;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
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
     * Get available time slots that respect clinic hours
     * A time slot is available only if:
     * 1. Its status is AVAILABLE
     * 2. The clinic is operating on that day
     */
    public List<TimeSlotDTO> getAvailableTimeSlots() {
        return timeSlotRepository.findAll().stream()
                .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE)
                .filter(this::isTimeSlotDayOpen)
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get available time slots for a specific service that respect clinic hours
     */
    public List<TimeSlotDTO> getAvailableTimeSlotsByService(Long serviceId) {
        return timeSlotRepository.findAll().stream()
                .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE && ts.getService().getId().equals(serviceId))
                .filter(this::isTimeSlotDayOpen)
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get all time slots (no filtering)
     */
    public List<TimeSlotDTO> getAllTimeSlots() {
        return timeSlotRepository.findAll().stream()
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Check if clinic is open on the day of the time slot
     * Day mapping: Sunday=0, Monday=1, ..., Saturday=6
     * Clinic mapping: Monday=0, Tuesday=1, ..., Sunday=6
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
