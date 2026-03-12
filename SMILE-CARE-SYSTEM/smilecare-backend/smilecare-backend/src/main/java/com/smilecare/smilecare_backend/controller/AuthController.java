package com.smilecare.smilecare_backend.controller;

import com.smilecare.smilecare_backend.dto.LoginRequest;
import com.smilecare.smilecare_backend.dto.RegisterRequest;
import com.smilecare.smilecare_backend.model.Role;
import com.smilecare.smilecare_backend.model.User;
import com.smilecare.smilecare_backend.repository.UserRepository;
import com.smilecare.smilecare_backend.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;   // ✅ add this

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthService authService) {   // ✅ inject service

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        try {

            Map<String, Object> response = authService.login(request); // ✅ use object

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        try {

            Map<String, Object> response = authService.register(request);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
