package com.smilecare.smilecare_backend.dto;

import com.smilecare.smilecare_backend.model.Role;

public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private String profilePhotoUrl;

    public UserResponse(Long id, String fullName, String email, Role role, String profilePhotoUrl) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public Long getId() {
        return id;
    }

    // ✅ THIS FIXES YOUR PROBLEM
    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }
}
