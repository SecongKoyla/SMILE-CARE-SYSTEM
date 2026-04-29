package com.smilecare.smilecare_backend.dentalservice.repository;

import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DentalServiceRepository extends JpaRepository<DentalService, Long> {
}
