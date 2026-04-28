package com.smilecare.smilecare_backend.timeslot.controller;

import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.service.TimeSlotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/v1/time-slots")
public class TimeSlotController {

    private final TimeSlotService service;
    private static final Logger logger = Logger.getLogger(TimeSlotController.class.getName());
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE; // "yyyy-MM-dd"

    public TimeSlotController(TimeSlotService service) {
        this.service = service;
    }

    /**
     * Get available time slots, optionally filtered by service ID and/or date
     * 
     * Query Parameters:
     * - serviceId (optional): Filter by specific service
     * - date (optional): Filter by specific date (format: yyyy-MM-dd)
     * 
     * Examples:
     * - GET /api/v1/time-slots/available 
     *   → All available slots from today onwards
     * - GET /api/v1/time-slots/available?serviceId=1
     *   → Available slots for service 1 from today onwards
     * - GET /api/v1/time-slots/available?date=2026-04-07
     *   → Available slots for April 7, 2026
     * - GET /api/v1/time-slots/available?serviceId=1&date=2026-04-07
     *   → Available slots for service 1 on April 7, 2026
     */
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableTimeSlots(
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false) String date) {
        try {
            List<TimeSlotDTO> slots = List.of();
            
            logger.info("🔔 TimeSlot API called - serviceId: " + serviceId + ", date: " + date);
            
            // Parse date if provided
            LocalDate selectedDate = null;
            if (date != null && !date.isEmpty()) {
                try {
                    selectedDate = LocalDate.parse(date, DATE_FORMATTER);
                    logger.info("📅 Parsed date: " + selectedDate);
                } catch (Exception e) {
                    logger.warning("⚠️ Invalid date format: " + date + ". Expected format: yyyy-MM-dd");
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid date format. Expected: yyyy-MM-dd"));
                }
            }
            
            // Route to appropriate service method based on parameters
            if (serviceId != null && selectedDate != null) {
                // Both service and date specified
                logger.info("📅 Fetching available time slots for service " + serviceId + " on " + selectedDate);
                slots = service.getAvailableTimeSlotsByServiceAndDate(serviceId, selectedDate);
            } else if (serviceId != null) {
                // Only service specified
                logger.info("📅 Fetching available time slots for service " + serviceId);
                slots = service.getAvailableTimeSlotsByService(serviceId);
                logger.info("📊 Service returned " + slots.size() + " slots for service " + serviceId);
            } else if (selectedDate != null) {
                // Only date specified
                logger.info("📅 Fetching available time slots for date " + selectedDate);
                slots = service.getAvailableTimeSlotsByDate(selectedDate);
            } else {
                // No filters - all available slots
                logger.info("📅 Fetching all available time slots");
                slots = service.getAvailableTimeSlots();
            }
            
            logger.info("✅ Found " + slots.size() + " available time slots");
            return ResponseEntity.ok(slots);
            
        } catch (IllegalArgumentException e) {
            logger.warning("⚠️ Invalid argument: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.severe("❌ Error fetching available time slots: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch available time slots: " + e.getMessage()));
        }
    }

    /**
     * Get all time slots (no filtering, for debugging/admin)
     */
    @GetMapping
    public ResponseEntity<?> getAllTimeSlots() {
        try {
            logger.info("📅 Fetching all time slots");
            List<TimeSlotDTO> slots = service.getAllTimeSlots();
            logger.info("✅ Found " + slots.size() + " total time slots");
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            logger.severe("❌ Error fetching all time slots: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch time slots: " + e.getMessage()));
        }
    }
}
