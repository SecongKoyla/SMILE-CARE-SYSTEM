package com.smilecare.smilecare_backend.common.controller;

import com.smilecare.smilecare_backend.common.dto.ClinicHoursDTO;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/clinic-hours")
public class ClinicHoursController {

    private final ClinicHoursService service;

    public ClinicHoursController(ClinicHoursService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClinicHoursDTO> getAllClinicHours() {
        return service.getAllClinicHours();
    }

    @GetMapping("/{dayOfWeek}")
    public ResponseEntity<?> getClinicHoursByDay(@PathVariable Integer dayOfWeek) {
        ClinicHoursDTO hours = service.getClinicHoursByDay(dayOfWeek);
        if (hours == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(hours);
    }

    @PutMapping("/{dayOfWeek}")
    public ResponseEntity<?> updateClinicHours(
            @PathVariable Integer dayOfWeek,
            @RequestBody Map<String, Object> payload) {
        
        try {
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

            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{dayOfWeek}/is-open")
    public ResponseEntity<?> isClinicOpenOnDay(@PathVariable Integer dayOfWeek) {
        Boolean isOpen = service.isClinicOpenOnDay(dayOfWeek);
        return ResponseEntity.ok(Map.of("dayOfWeek", dayOfWeek, "isOpen", isOpen));
    }
}
