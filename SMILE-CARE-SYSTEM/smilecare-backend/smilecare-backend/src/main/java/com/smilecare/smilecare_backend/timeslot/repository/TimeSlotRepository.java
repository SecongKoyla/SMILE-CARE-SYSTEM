package com.smilecare.smilecare_backend.timeslot.repository;

import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
}
