package com.smilecare.smilecare_backend.common.controller;

import com.smilecare.smilecare_backend.common.dto.ClinicHoursDTO;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/clinic-hours")
public class ClinicHoursController {

    private final ClinicHoursService service;
    private static final Logger logger = Logger.getLogger(ClinicHoursController.class.getName());

    public ClinicHoursController(ClinicHoursService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAllClinicHours() {
        try {
            logger.info("📋 Fetching all clinic hours...");
            List<ClinicHoursDTO> hours = service.getAllClinicHours();
            
            if (hours == null || hours.isEmpty()) {
                logger.warning("⚠️ No clinic hours found in database");
                return ResponseEntity.ok(List.of());
            }
            
            // Sort by dayOfWeek for consistent ordering
            List<ClinicHoursDTO> sortedHours = hours.stream()
                    .sorted((a, b) -> Integer.compare(a.getDayOfWeek(), b.getDayOfWeek()))
                    .collect(Collectors.toList());
            
            logger.info("✅ Successfully fetched " + sortedHours.size() + " clinic hour records");
            return ResponseEntity.ok(sortedHours);
        } catch (Exception e) {
            logger.severe("❌ Error fetching clinic hours: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch clinic hours: " + e.getMessage()));
        }
    }

    @GetMapping("/{dayOfWeek}")
    public ResponseEntity<?> getClinicHoursByDay(@PathVariable Integer dayOfWeek) {
        try {
            if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid dayOfWeek. Must be 0-6."));
            }
            
            ClinicHoursDTO hours = service.getClinicHoursByDay(dayOfWeek);
            if (hours == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(hours);
        } catch (Exception e) {
            logger.severe("❌ Error fetching clinic hours for day " + dayOfWeek + ": " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch clinic hours: " + e.getMessage()));
        }
    }

    @PutMapping("/{dayOfWeek}")
    public ResponseEntity<?> updateClinicHours(
            @PathVariable Integer dayOfWeek,
            @RequestBody Map<String, Object> payload) {
        
        try {
            if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid dayOfWeek. Must be 0-6."));
            }
            
            Boolean isOperating = (Boolean) payload.getOrDefault("isOperating", true);
            
            LocalTime morningStart = null, morningEnd = null;
            LocalTime afternoonStart = null, afternoonEnd = null;

            if (isOperating) {
                if (payload.containsKey("morningStart")) {
                    morningStart = LocalTime.parse((String) payload.get("morningStart"));
                }
                if (payload.containsKey("morningEnd")) {
                    morningEnd = LocalTime.parse((String) payload.get("morningEnd"));
                }
                if (payload.containsKey("afternoonStart")) {
                    afternoonStart = LocalTime.parse((String) payload.get("afternoonStart"));
                }
                if (payload.containsKey("afternoonEnd")) {
                    afternoonEnd = LocalTime.parse((String) payload.get("afternoonEnd"));
                }
            }

            ClinicHoursDTO updated = service.updateClinicHours(
                    dayOfWeek,
                    isOperating,
                    morningStart,
                    morningEnd,
                    afternoonStart,
                    afternoonEnd
            );

            logger.info("✅ Clinic hours updated for day " + dayOfWeek);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.severe("❌ Error updating clinic hours for day " + dayOfWeek + ": " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to update clinic hours: " + e.getMessage()));
        }
    }

    @GetMapping("/{dayOfWeek}/is-open")
    public ResponseEntity<?> isClinicOpenOnDay(@PathVariable Integer dayOfWeek) {
        try {
            if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid dayOfWeek. Must be 0-6."));
            }
            
            Boolean isOpen = service.isClinicOpenOnDay(dayOfWeek);
            return ResponseEntity.ok(Map.of("dayOfWeek", dayOfWeek, "isOpen", isOpen));
        } catch (Exception e) {
            logger.severe("❌ Error checking if clinic is open on day " + dayOfWeek + ": " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to check clinic status: " + e.getMessage()));
        }
    }
}
