package com.smilecare.smilecare_backend.timeslot.controller;

import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.service.TimeSlotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/time-slots")
public class TimeSlotController {

    private final TimeSlotService service;

    public TimeSlotController(TimeSlotService service) {
        this.service = service;
    }

    @GetMapping("/available")
    public List<TimeSlotDTO> getAvailableTimeSlots(@RequestParam(required = false) Long serviceId) {
        if (serviceId != null) {
            return service.getAvailableTimeSlotsByService(serviceId);
        }
        return service.getAvailableTimeSlots();
    }

    @GetMapping
    public List<TimeSlotDTO> getAllTimeSlots() {
        return service.getAllTimeSlots();
    }
}
