package com.smilecare.smilecare_backend.controller;

import com.smilecare.smilecare_backend.model.User;
import com.smilecare.smilecare_backend.service.UserService;
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
        safeUser.put("fullName", user.getFullName());
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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String,String> payload) {
        try {
            User updated = userService.updateProfile(id, payload.get("fullName"));
            return ResponseEntity.ok(toSafeUser(updated));
        } catch(RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(@PathVariable Long id, @RequestBody Map<String,String> payload) {
        try {
            userService.updatePassword(id, payload.get("currentPassword"), payload.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch(RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ✅ Upload photo as BLOB
    @PostMapping("/{id}/photo")
    public ResponseEntity<?> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("photo") MultipartFile photo
    ) {
        try {
            if (photo.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Photo file is required"));
            }

            // ✅ Validate file type
            String contentType = photo.getContentType();
            if (contentType == null ||
                    !(contentType.equals("image/jpeg") || contentType.equals("image/png"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Only JPG and PNG are allowed"));
            }

            // ✅ Convert to bytes (BLOB)
            byte[] bytes = photo.getBytes();

            // ✅ Save to DB
            User updated = userService.updateProfilePhoto(id, bytes);

            // ✅ Convert to Base64 (file reference)
            String base64 = Base64.getEncoder().encodeToString(updated.getProfilePhoto());
            String fileRef = "data:" + contentType + ";base64," + base64;

            // ✅ Return success + reference
            return ResponseEntity.ok(Map.of(
                    "message", "Photo uploaded successfully",
                    "profilePhotoUrl", fileRef
            ));

        } catch (Exception e) {
            e.printStackTrace(); // 🔥 for debugging
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }



    @DeleteMapping("/{id}/photo")
    public ResponseEntity<?> deletePhoto(@PathVariable Long id) {
        try {
            userService.removeProfilePhoto(id);
            return ResponseEntity.ok(Map.of("message", "Profile photo removed"));
        } catch(RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
