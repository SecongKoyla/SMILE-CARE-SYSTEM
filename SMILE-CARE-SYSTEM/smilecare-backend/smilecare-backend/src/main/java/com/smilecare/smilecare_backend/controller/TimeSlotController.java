package com.smilecare.smilecare_backend.controller;

import com.smilecare.smilecare_backend.model.TimeSlot;
import com.smilecare.smilecare_backend.service.TimeSlotService;
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
    public List<TimeSlot> getAvailableTimeSlots() {
        return service.getAvailableTimeSlots();
    }

    @GetMapping
    public List<TimeSlot> getAllTimeSlots() {
        return service.getAllTimeSlots();
    }
}
