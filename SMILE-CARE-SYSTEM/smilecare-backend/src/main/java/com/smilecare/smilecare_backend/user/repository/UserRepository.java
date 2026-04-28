package com.smilecare.smilecare_backend.user.repository;

import com.smilecare.smilecare_backend.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
