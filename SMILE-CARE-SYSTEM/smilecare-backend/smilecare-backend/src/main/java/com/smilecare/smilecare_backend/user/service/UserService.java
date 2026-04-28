package com.smilecare.smilecare_backend.user.service;

import com.smilecare.smilecare_backend.user.model.User;
import com.smilecare.smilecare_backend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern NAME_PATTERN = Pattern.compile("^[\\p{L}\\s]+$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() { 
        return userRepository.findAll(); 
    }

    public Optional<User> getUserById(Long id) { 
        return userRepository.findById(id); 
    }

    public User updateProfile(Long id, String firstName, String lastName) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (firstName == null || firstName.trim().isEmpty() || lastName == null || lastName.trim().isEmpty()) {
            throw new RuntimeException("First name and Last name are required");
        }
        String normalizedFirst = firstName.trim().replaceAll("\\s+", " ");
        String normalizedLast = lastName.trim().replaceAll("\\s+", " ");
        if (!NAME_PATTERN.matcher(normalizedFirst).matches() || !NAME_PATTERN.matcher(normalizedLast).matches()) {
            throw new RuntimeException("Names can only contain letters and spaces");
        }
        user.setFirstName(normalizedFirst);
        user.setLastName(normalizedLast);
        return userRepository.save(user);
    }

    public void updatePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("New password must be at least 8 characters");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User updateProfilePhoto(Long id, byte[] profilePhoto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfilePhoto(profilePhoto);
        return userRepository.save(user);
    }

    public void removeProfilePhoto(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfilePhoto(null);
        userRepository.save(user);
    }
}
