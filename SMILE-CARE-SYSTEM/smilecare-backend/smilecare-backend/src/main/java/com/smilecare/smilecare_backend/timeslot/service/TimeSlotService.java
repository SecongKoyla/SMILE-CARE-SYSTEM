package com.smilecare.smilecare_backend.timeslot.service;

import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.timeslot.dto.TimeSlotDTO;
import com.smilecare.smilecare_backend.timeslot.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;

    public TimeSlotService(TimeSlotRepository timeSlotRepository) {
        this.timeSlotRepository = timeSlotRepository;
    }

    public List<TimeSlotDTO> getAvailableTimeSlots() {
        return timeSlotRepository.findAll().stream()
                .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE)
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
    }

    public List<TimeSlotDTO> getAvailableTimeSlotsByService(Long serviceId) {
        return timeSlotRepository.findAll().stream()
                .filter(ts -> ts.getStatus() == TimeSlotStatus.AVAILABLE && ts.getService().getId().equals(serviceId))
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
    }

    public List<TimeSlotDTO> getAllTimeSlots() {
        return timeSlotRepository.findAll().stream()
                .map(TimeSlotDTO::new)
                .collect(Collectors.toList());
    }
}
