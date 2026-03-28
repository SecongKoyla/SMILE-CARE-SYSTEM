package com.smilecare.smilecare_backend.dto;

import com.smilecare.smilecare_backend.model.Role;
import java.util.Base64;

public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private String profilePhotoUrl;

    public UserResponse(Long id, String fullName, String email, Role role, byte[] profilePhoto) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.profilePhotoUrl = profilePhoto == null ? null :
                "data:image/png;base64," + Base64.getEncoder().encodeToString(profilePhoto);
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
}
