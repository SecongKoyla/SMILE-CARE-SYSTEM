package com.smilecare.smilecare_backend.user.dto;

import com.smilecare.smilecare_backend.user.model.Role;
import java.util.Base64;

public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private byte[] profilePhoto;
    private String profilePhotoUrl;

    public UserResponse(Long id, String firstName, String lastName, String email, Role role, byte[] profilePhoto) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.profilePhoto = profilePhoto;
        this.profilePhotoUrl = convertPhotoToUrl(profilePhoto);
    }

    // ================= HELPER METHOD =================
    private String convertPhotoToUrl(byte[] photoBytes) {
        if (photoBytes == null || photoBytes.length == 0) {
            return null;
        }
        String base64 = Base64.getEncoder().encodeToString(photoBytes);
        return "data:image/png;base64," + base64;
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public byte[] getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(byte[] profilePhoto) { 
        this.profilePhoto = profilePhoto;
        this.profilePhotoUrl = convertPhotoToUrl(profilePhoto);
    }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
}
