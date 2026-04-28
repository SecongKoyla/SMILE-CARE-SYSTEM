package com.smilecare.smilecare_backend.user.repository;

import com.smilecare.smilecare_backend.user.model.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
}
