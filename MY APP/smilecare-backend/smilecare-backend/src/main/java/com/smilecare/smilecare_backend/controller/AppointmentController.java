package com.smilecare.smilecare_backend.controller;

import com.smilecare.smilecare_backend.dto.AppointmentRequest;
import com.smilecare.smilecare_backend.model.Appointment;
import com.smilecare.smilecare_backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return service.getAllAppointments();
    }

    @PostMapping("/book")
    public Appointment bookAppointment(
            @Valid @RequestBody AppointmentRequest request) {
        return service.bookAppointment(request);
    }

    @PutMapping("/{id}/cancel")
    public void cancelAppointment(@PathVariable Long id) {
        service.cancelAppointment(id);
    }
}
