package com.smilecare.smilecare_backend;

import com.smilecare.smilecare_backend.user.model.User;
import com.smilecare.smilecare_backend.user.model.Role;
import com.smilecare.smilecare_backend.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String email = "test@smilecare.com";

        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setFullName("Test User");
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("123456"));
            user.setRole(Role.ADMIN);
            user.setCreatedAt(LocalDateTime.now());

            // ✅ Set default profile photo
            Path path = Path.of("src/main/resources/images/default.png");
            byte[] photoBytes = Files.readAllBytes(path);
            user.setProfilePhoto(photoBytes);

            userRepository.save(user);
            System.out.println("Test user created.");
        } else {
            System.out.println("Test user already exists. Skipping insert.");
        }
    }
}
