package com.smilecare.smilecare_backend;

import com.smilecare.smilecare_backend.model.User;
import com.smilecare.smilecare_backend.model.Role;
import com.smilecare.smilecare_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Constructor injection (Spring Boot will auto-wire repository and passwordEncoder)
    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String email = "test@smilecare.com";

        if (!userRepository.existsByEmail(email)) {  // <-- check if exists
            User user = new User();
            user.setFullName("Test User");
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("123456"));
            user.setRole(Role.valueOf("ADMIN"));
            user.setCreatedAt(LocalDateTime.now());

            userRepository.save(user);
            System.out.println("Test user created.");
        } else {
            System.out.println("Test user already exists. Skipping insert.");
        }
    }

}
