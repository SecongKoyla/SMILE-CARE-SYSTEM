package com.smilecare.smilecare_backend.user.dto;

import com.smilecare.smilecare_backend.user.model.Role;

public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private byte[] profilePhoto;

    public UserResponse(Long id, String fullName, String email, Role role, byte[] profilePhoto) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.profilePhoto = profilePhoto;
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public byte[] getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(byte[] profilePhoto) { this.profilePhoto = profilePhoto; }
}
