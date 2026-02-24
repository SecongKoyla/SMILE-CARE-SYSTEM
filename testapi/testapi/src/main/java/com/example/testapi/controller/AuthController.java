package com.example.testapi.controller;

import com.example.testapi.model.LoginRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {

        if ("admin".equals(request.getUsername()) &&
                "1234".equals(request.getPassword())) {
            return "Login successful";
        }

        return "Invalid username or password";
    }
}
