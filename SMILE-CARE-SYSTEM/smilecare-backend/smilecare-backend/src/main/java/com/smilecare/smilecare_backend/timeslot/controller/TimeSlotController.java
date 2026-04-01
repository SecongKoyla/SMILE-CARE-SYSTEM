package com.smilecare.smilecare_backend.timeslot.controller;

import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.service.TimeSlotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/v1/time-slots")
public class TimeSlotController {

    private final TimeSlotService service;
    private static final Logger logger = Logger.getLogger(TimeSlotController.class.getName());

    public TimeSlotController(TimeSlotService service) {
        this.service = service;
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailableTimeSlots(@RequestParam(required = false) Long serviceId) {
        try {
            logger.info("📅 Fetching available time slots" + (serviceId != null ? " for service " + serviceId : ""));
            
            List<TimeSlotDTO> slots;
            if (serviceId != null) {
                slots = service.getAvailableTimeSlotsByService(serviceId);
            } else {
                slots = service.getAvailableTimeSlots();
            }
            
            logger.info("✅ Found " + slots.size() + " available time slots");
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            logger.severe("❌ Error fetching available time slots: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch available time slots: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllTimeSlots() {
        try {
            logger.info("📅 Fetching all time slots");
            List<TimeSlotDTO> slots = service.getAllTimeSlots();
            logger.info("✅ Found " + slots.size() + " total time slots");
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            logger.severe("❌ Error fetching all time slots: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch time slots: " + e.getMessage()));
        }
    }
}
