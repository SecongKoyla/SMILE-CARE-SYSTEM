package com.smilecare.smilecare_backend.appointment.controller;

import com.smilecare.smilecare_backend.appointment.dto.AppointmentRequest;
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
            List<Appointment> appointments = service.getAllAppointments();
            logger.info("✅ Found " + appointments.size() + " appointments");
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.severe("❌ Error fetching appointments: " + e.getMessage());
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
        } catch (Exception e) {
            logger.severe("❌ Error approving appointment: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to approve appointment: " + e.getMessage()));
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
        } catch (Exception e) {
            logger.severe("❌ Error booking appointment: " + e.getMessage());
            return ResponseEntity.status(400)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to book appointment"));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        try {
            logger.info("❌ Cancelling appointment " + id);
            service.cancelAppointment(id);
            return ResponseEntity.ok(Map.of("message", "Appointment cancelled successfully"));
        } catch (Exception e) {
            logger.severe("❌ Error cancelling appointment: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to cancel appointment: " + e.getMessage()));
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
        } catch (Exception e) {
            logger.severe("❌ Error updating appointment status: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to update appointment status: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public List<Appointment> getUserAppointments(@PathVariable Long userId) {
        return service.getAppointmentsByUser(userId);
    }
}
