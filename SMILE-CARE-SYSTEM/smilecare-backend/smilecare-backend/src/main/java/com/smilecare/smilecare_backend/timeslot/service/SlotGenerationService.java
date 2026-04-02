package com.smilecare.smilecare_backend.timeslot.service;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@Service
@Transactional(readOnly = true)
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
     * Generate hourly TimeSlotDTOs for a service on a specific date
     * This dynamically creates hourly slots based on clinic hours (NOT from database)
     * 
     * @param serviceId the service ID
     * @param date the appointment date
     * @param clinicHours the clinic hours for this day
     * @return List of hourly TimeSlotDTOs within clinic operating hours
     */
    public List<TimeSlotDTO> generateHourlySlots(Long serviceId, LocalDate date, ClinicHours clinicHours) {
        List<TimeSlotDTO> slots = new ArrayList<>();
        
        try {
            if (clinicHours == null || !clinicHours.getIsOperating()) {
                logger.info("ℹ️ Clinic closed on " + date);
                return slots;
            }
            
            logger.info("🔄 Dynamically generating hourly slots for service " + serviceId + " on " + date);
            
            // Generate morning slots (hourly)
            if (clinicHours.getMorningStart() != null && clinicHours.getMorningEnd() != null) {
                slots.addAll(generateHourlyDTOs(serviceId, date, 
                    clinicHours.getMorningStart(), 
                    clinicHours.getMorningEnd()));
            }
            
            // Generate afternoon slots (hourly)
            if (clinicHours.getAfternoonStart() != null && clinicHours.getAfternoonEnd() != null) {
                slots.addAll(generateHourlyDTOs(serviceId, date,
                    clinicHours.getAfternoonStart(),
                    clinicHours.getAfternoonEnd()));
            }
            
            logger.info("✅ Generated " + slots.size() + " hourly slots for " + date);
            return slots;
            
        } catch (Exception e) {
            logger.warning("⚠️ Error generating hourly slots: " + e.getMessage());
            e.printStackTrace();
            return slots;
        }
    }

    /**
     * Generate hourly TimeSlotDTOs between start and end time
     * Creates 1-hour slots: 09:00-10:00, 10:00-11:00, etc.
     * Uses unique IDs based on hour of day to prevent duplicate key errors
     * Example IDs: -9 (9am), -10 (10am), -14 (2pm), -15 (3pm)
     */
    private List<TimeSlotDTO> generateHourlyDTOs(Long serviceId, LocalDate date, LocalTime start, LocalTime end) {
        List<TimeSlotDTO> slots = new ArrayList<>();
        LocalTime current = start;
        
        while (current.isBefore(end)) {
            LocalTime slotEnd = current.plusHours(1);
            
            // Don't create slot if it extends beyond end time
            if (slotEnd.isAfter(end)) {
                break;
            }
            
            // Create dynamic DTO with unique ID based on hour of day
            // This ensures: 9:00=ID-9, 10:00=ID-10, 14:00=ID-14, 15:00=ID-15 (NO DUPLICATES)
            TimeSlotDTO dto = new TimeSlotDTO();
            int hourOfDay = current.getHour();
            dto.setId((long)(-hourOfDay)); // Unique ID: -9, -10, -11, -14, -15, -16, etc.
            dto.setServiceId(serviceId);
            dto.setDate(date);
            dto.setStartTime(current);
            dto.setEndTime(slotEnd);
            dto.setStatus(TimeSlotStatus.AVAILABLE);
            
            slots.add(dto);
            logger.fine("Generated slot: " + current + " - " + slotEnd + " with ID: " + dto.getId());
            
            current = slotEnd;
        }
        
        return slots;
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
