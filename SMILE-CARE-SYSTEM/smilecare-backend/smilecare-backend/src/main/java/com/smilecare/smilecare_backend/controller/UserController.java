package com.smilecare.smilecare_backend.controller;

import com.smilecare.smilecare_backend.model.User;
import com.smilecare.smilecare_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    // Constructor injection
    public UserController(UserService userService) {
        this.userService = userService;
    }

    private Map<String, Object> toSafeUser(User user) {
        Map<String, Object> safeUser = new LinkedHashMap<>();
        safeUser.put("id", user.getId());
        safeUser.put("fullName", user.getFullName());
        safeUser.put("email", user.getEmail());
        safeUser.put("role", user.getRole() == null ? "PATIENT" : user.getRole().name());
        safeUser.put("profilePhotoUrl", user.getProfilePhotoUrl());
        return safeUser;
    }

    // GET all users
    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        return userService.getAllUsers().stream().map(this::toSafeUser).toList();
    }

    // GET user by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(toSafeUser(user)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // PUT update profile info
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            User updated = userService.updateProfile(id, payload.get("fullName"));
            return ResponseEntity.ok(toSafeUser(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // PUT update password
    @PutMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            userService.updatePassword(id, payload.get("currentPassword"), payload.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // POST profile photo
    @PostMapping("/{id}/photo")
    public ResponseEntity<?> uploadPhoto(@PathVariable Long id, @RequestParam("photo") MultipartFile photo) {
        try {
            if (photo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Photo file is required"));
            }

            String contentType = photo.getContentType() == null ? "image/png" : photo.getContentType();
            String base64 = Base64.getEncoder().encodeToString(photo.getBytes());
            String profilePhotoUrl = "data:" + contentType + ";base64," + base64;

            User updated = userService.updateProfilePhoto(id, profilePhotoUrl);
            return ResponseEntity.ok(Map.of("profilePhotoUrl", updated.getProfilePhotoUrl()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to read uploaded file"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE profile photo
    @DeleteMapping("/{id}/photo")
    public ResponseEntity<?> deletePhoto(@PathVariable Long id) {
        try {
            userService.removeProfilePhoto(id);
            return ResponseEntity.ok(Map.of("message", "Profile photo removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
