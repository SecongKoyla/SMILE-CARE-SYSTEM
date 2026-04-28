package com.smilecare.smilecare_backend.auth.repository;

import com.smilecare.smilecare_backend.auth.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
}
