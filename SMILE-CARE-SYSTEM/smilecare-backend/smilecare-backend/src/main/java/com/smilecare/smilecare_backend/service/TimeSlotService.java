package com.smilecare.smilecare_backend.service;

import com.smilecare.smilecare_backend.model.TimeSlot;
import com.smilecare.smilecare_backend.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;

    public TimeSlotService(TimeSlotRepository timeSlotRepository) {
        this.timeSlotRepository = timeSlotRepository;
    }

    public List<TimeSlot> getAvailableTimeSlots() {
        return timeSlotRepository.findAll().stream()
                .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE)
                .collect(Collectors.toList());
    }

    public List<TimeSlot> getAllTimeSlots() {
        return timeSlotRepository.findAll();
    }
}
