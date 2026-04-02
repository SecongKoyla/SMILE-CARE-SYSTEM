package com.smilecare.smilecare_backend.appointment.controller;

import com.smilecare.smilecare_backend.appointment.dto.AppointmentRequest;
import com.smilecare.smilecare_backend.appointment.dto.AppointmentResponseDTO;
import com.smilecare.smilecare_backend.appointment.model.Appointment;
import com.smilecare.smilecare_backend.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService service;
    private static final Logger logger = Logger.getLogger(AppointmentController.class.getName());

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAllAppointments() {
        try {
            logger.info("📋 Fetching all appointments");
            List<AppointmentResponseDTO> dtos = service.getAllAppointments();
            logger.info("✅ Found " + dtos.size() + " appointments");
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.severe("❌ Error fetching appointments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch appointments: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveAppointment(
            @PathVariable Long id,
            @RequestParam Long adminId
    ) {
        try {
            logger.info("✅ Approving appointment " + id);
            Appointment appointment = service.approveAppointment(id, adminId);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            logger.warning("⚠️  Approval validation failed: " + e.getMessage());
            return ResponseEntity.status(404)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.severe("❌ Error approving appointment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Unexpected error while approving appointment"));
        }
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(
            @Valid @RequestBody AppointmentRequest request) {
        try {
            logger.info("📅 Booking appointment for patient " + request.getPatientId());
            Appointment appointment = service.bookAppointment(request);
            logger.info("✅ Appointment booked successfully");
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            logger.warning("⚠️  Booking validation failed: " + e.getMessage());
            return ResponseEntity.status(400)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to book appointment"));
        } catch (Exception e) {
            logger.severe("❌ Error booking appointment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Unexpected error while booking appointment"));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        try {
            logger.info("❌ Cancelling appointment " + id);
            service.cancelAppointment(id);
            return ResponseEntity.ok(Map.of("message", "Appointment cancelled successfully"));
        } catch (RuntimeException e) {
            logger.warning("⚠️  Cancellation validation failed: " + e.getMessage());
            return ResponseEntity.status(404)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.severe("❌ Error cancelling appointment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Unexpected error while cancelling appointment"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        try {
            logger.info("📝 Updating appointment " + id + " status to " + status);
            Appointment appointment = service.updateAppointmentStatus(id, status);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            logger.warning("⚠️  Status update validation failed: " + e.getMessage());
            return ResponseEntity.status(e.getMessage().contains("not found") ? 404 : 400)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.severe("❌ Error updating appointment status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Unexpected error while updating appointment status"));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserAppointments(@PathVariable Long userId) {
        try {
            logger.info("📋 Fetching appointments for user " + userId);
            List<AppointmentResponseDTO> dtos = service.getAppointmentsByUser(userId);
            logger.info("✅ Found " + dtos.size() + " appointments for user");
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.severe("❌ Error fetching user appointments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch appointments: " + e.getMessage()));
        }
    }
}
