package com.smilecare.smilecare_backend.common.repository;

import com.smilecare.smilecare_backend.common.model.ClinicDateException;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface ClinicDateExceptionRepository extends JpaRepository<ClinicDateException, Long> {
    Optional<ClinicDateException> findByDate(LocalDate date);
}
