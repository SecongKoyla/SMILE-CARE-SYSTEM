package com.smilecare.smilecare_backend.repository;

import com.smilecare.smilecare_backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
}
