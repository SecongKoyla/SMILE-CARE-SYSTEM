package com.smilecare.smilecare_backend.common.repository;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClinicHoursRepository extends JpaRepository<ClinicHours, Long> {
    Optional<ClinicHours> findByDayOfWeek(Integer dayOfWeek);
}
