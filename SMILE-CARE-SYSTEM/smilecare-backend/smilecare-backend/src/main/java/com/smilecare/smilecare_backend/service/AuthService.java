package com.smilecare.smilecare_backend.service;

import com.smilecare.smilecare_backend.model.Role;
import com.smilecare.smilecare_backend.model.User;
import com.smilecare.smilecare_backend.repository.UserRepository;
import com.smilecare.smilecare_backend.dto.LoginRequest;
import com.smilecare.smilecare_backend.dto.RegisterRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ===================== LOGIN =====================
    public Map<String, Object> login(LoginRequest request) {

        if (request == null) {
            throw new RuntimeException("Login request is missing");
        }

        String email = request.getEmail();
        String password = request.getPassword();

        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        email = email.trim();

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("name", user.getFullName());
        response.put("role", user.getRole());
        response.put("message", "Login successful");

        return response;
    }

    // ===================== REGISTER =====================


    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> register(RegisterRequest request) {

        // 1️⃣ Validate request BEFORE touching DB
        if (request == null) {
            throw new RuntimeException("Registration request is missing");
        }

        String fullName = request.getFullName();
        String email = request.getEmail();
        String password = request.getPassword();
        String confirmPassword = request.getConfirmPassword();

        if (fullName == null || fullName.trim().isEmpty()) {
            throw new RuntimeException("Full name is required");
        }

        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        email = email.trim();

        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        if (confirmPassword == null || confirmPassword.trim().isEmpty()) {
            throw new RuntimeException("Confirm password is required");
        }

        if (password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }

        if (!password.equals(confirmPassword)) {
            throw new RuntimeException("Passwords do not match");
        }

        // 2️⃣ Only now query DB for email existence
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // 3️⃣ Create and save user
        User newUser = new User();
        newUser.setFullName(fullName.trim());
        newUser.setEmail(email);
        newUser.setPasswordHash(passwordEncoder.encode(password));
        newUser.setRole(Role.PATIENT);

        userRepository.save(newUser);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Registration successful");
        response.put("id", newUser.getId());
        response.put("email", newUser.getEmail());
        response.put("name", newUser.getFullName());
        response.put("role", newUser.getRole());

        return response;
    }
}
