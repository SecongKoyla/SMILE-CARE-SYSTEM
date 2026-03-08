package com.smilecare.smilecare_backend.controller;

import com.smilecare.smilecare_backend.model.Role;
import com.smilecare.smilecare_backend.model.User;
import com.smilecare.smilecare_backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {

        String email = request.get("email");
        String password = request.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Invalid password"));
        }

        return ResponseEntity.ok(user);
    }



    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String fullName = request.get("fullName");
        String password = request.get("password"); // or password if raw
        String role = request.getOrDefault("role", "PATIENT");

        // Check if email already exists
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Registration failed. Email already exists"));
        }

        // Create new user
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(fullName);
        newUser.setPasswordHash(passwordEncoder.encode(password));
        newUser.setRole(Role.PATIENT);

        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("message", "Registration successful", "user", newUser));
    }


}
