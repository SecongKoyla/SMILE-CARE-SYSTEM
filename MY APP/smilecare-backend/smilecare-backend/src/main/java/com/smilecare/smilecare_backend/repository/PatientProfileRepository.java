package com.smilecare.smilecare_backend.repository;

import com.smilecare.smilecare_backend.model.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
}
