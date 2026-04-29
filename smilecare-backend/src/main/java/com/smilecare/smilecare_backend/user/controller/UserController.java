package com.smilecare.smilecare_backend.user.controller;

import com.smilecare.smilecare_backend.user.model.User;
import com.smilecare.smilecare_backend.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    private Map<String, Object> toSafeUser(User user) {
        Map<String, Object> safeUser = new LinkedHashMap<>();
        safeUser.put("id", user.getId());
        safeUser.put("firstName", user.getFirstName());
        safeUser.put("lastName", user.getLastName());
        safeUser.put("email", user.getEmail());
        safeUser.put("role", user.getRole() == null ? "PATIENT" : user.getRole().name());

        if (user.getProfilePhoto() != null) {
            String base64 = Base64.getEncoder().encodeToString(user.getProfilePhoto());
            safeUser.put("profilePhotoUrl", "data:image/png;base64," + base64);
        } else {
            safeUser.put("profilePhotoUrl", null);
        }
        return safeUser;
    }

    @GetMapping
    public List<Map<String,Object>> getAllUsers() {
        return userService.getAllUsers().stream().map(this::toSafeUser).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(toSafeUser(user)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String firstName = payload.get("firstName");
            String lastName = payload.get("lastName");
            
            if (firstName == null || lastName == null) {
                throw new RuntimeException("First name and Last name are required");
            }

            User updated = userService.updateProfile(id, firstName, lastName);
            return ResponseEntity.ok(toSafeUser(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(
            @PathVariable Long id,
            @RequestParam String currentPassword,
            @RequestParam String newPassword) {
        try {
            userService.updatePassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/profile-photo")
    public ResponseEntity<?> uploadProfilePhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            byte[] photoData = file.getBytes();
            User updated = userService.updateProfilePhoto(id, photoData);
            return ResponseEntity.ok(toSafeUser(updated));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload photo"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/profile-photo")
    public ResponseEntity<?> removeProfilePhoto(@PathVariable Long id) {
        try {
            userService.removeProfilePhoto(id);
            return ResponseEntity.ok(Map.of("message", "Profile photo removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
