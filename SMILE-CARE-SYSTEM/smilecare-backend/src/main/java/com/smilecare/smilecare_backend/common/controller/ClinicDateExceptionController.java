package com.smilecare.smilecare_backend.common.controller;

import com.smilecare.smilecare_backend.common.model.ClinicDateException;
import com.smilecare.smilecare_backend.common.service.ClinicDateExceptionService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/clinic-exceptions")
public class ClinicDateExceptionController {

    private final ClinicDateExceptionService service;

    public ClinicDateExceptionController(ClinicDateExceptionService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClinicDateException> getAllExceptions() {
        return service.getAllExceptions();
    }

    @GetMapping("/check/{date}")
    public boolean checkException(@PathVariable String date) {
        return service.getExceptionByDate(LocalDate.parse(date)).isPresent();
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> addException(@RequestBody java.util.Map<String, String> payload) {
        try {
            String dateStr = payload.get("date");
            String reason = payload.get("reason");
            if (dateStr == null || dateStr.trim().isEmpty()) {
                return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", "Date is required"));
            }
            ClinicDateException exception = new ClinicDateException(LocalDate.parse(dateStr), reason);
            ClinicDateException saved = service.addException(exception);
            return org.springframework.http.ResponseEntity.ok(saved);
        } catch (org.springframework.dao.DataIntegrityViolationException de) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", "A record for this date already exists."));
        } catch (Exception e) {
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.internalServerError().body(java.util.Map.of("error", "Error saving exception: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public void deleteException(@PathVariable Long id) {
        service.deleteException(id);
    }
}
