package com.smilecare.smilecare_backend.auth.service;

import com.smilecare.smilecare_backend.auth.dto.AuthResponse;
import com.smilecare.smilecare_backend.auth.dto.LoginRequest;
import com.smilecare.smilecare_backend.auth.dto.RegisterRequest;
import com.smilecare.smilecare_backend.user.model.Role;
import com.smilecare.smilecare_backend.user.model.User;
import com.smilecare.smilecare_backend.user.repository.UserRepository;
import com.smilecare.smilecare_backend.user.dto.UserResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ===================== LOGIN =====================
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

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

        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getProfilePhoto()
        );

        return new AuthResponse("Login successful", userResponse);
    }


    // ===================== REGISTER =====================

    @Transactional(rollbackFor = Exception.class)
    public AuthResponse register(RegisterRequest request) {

        if (request == null) {
            throw new RuntimeException("Registration request is missing");
        }

        String firstName = request.getFirstName();
        String lastName = request.getLastName();
        String email = request.getEmail();
        String password = request.getPassword();
        String confirmPassword = request.getConfirmPassword();

        if (firstName == null || firstName.trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }

        if (lastName == null || lastName.trim().isEmpty()) {
            throw new RuntimeException("Last name is required");
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

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User newUser = new User();
        newUser.setFirstName(firstName.trim());
        newUser.setLastName(lastName.trim());
        newUser.setEmail(email);
        newUser.setPasswordHash(passwordEncoder.encode(password));
        newUser.setRole(Role.PATIENT);

        userRepository.save(newUser);

        UserResponse userResponse = new UserResponse(
                newUser.getId(),
                newUser.getFirstName(),
                newUser.getLastName(),
                newUser.getEmail(),
                newUser.getRole(),
                newUser.getProfilePhoto()
        );

        return new AuthResponse("Registration successful", userResponse);
    }
}
