package com.smilecare.smilecare_backend.appointment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * AppointmentResponseDTO - Used for API responses
 * Excludes sensitive data like profilePhoto and only includes necessary fields
 */
public class AppointmentResponseDTO {
    private Long id;
    private UserDTO patient;
    private UserDTO processedByAdmin;
    private ServiceDTO service;
    private TimeSlotDTO timeSlot;
    private String status;
    private LocalDateTime createdAt;

    // ================= CONSTRUCTORS =================
    public AppointmentResponseDTO() {}

    public AppointmentResponseDTO(Long id, UserDTO patient, UserDTO processedByAdmin, 
                                   ServiceDTO service, TimeSlotDTO timeSlot, 
                                   String status, LocalDateTime createdAt) {
        this.id = id;
        this.patient = patient;
        this.processedByAdmin = processedByAdmin;
        this.service = service;
        this.timeSlot = timeSlot;
        this.status = status;
        this.createdAt = createdAt;
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserDTO getPatient() { return patient; }
    public void setPatient(UserDTO patient) { this.patient = patient; }

    public UserDTO getProcessedByAdmin() { return processedByAdmin; }
    public void setProcessedByAdmin(UserDTO processedByAdmin) { this.processedByAdmin = processedByAdmin; }

    public ServiceDTO getService() { return service; }
    public void setService(ServiceDTO service) { this.service = service; }

    public TimeSlotDTO getTimeSlot() { return timeSlot; }
    public void setTimeSlot(TimeSlotDTO timeSlot) { this.timeSlot = timeSlot; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // ================= NESTED DTOs =================
    public static class UserDTO {
        private Long id;
        private String fullName;
        private String email;
        private String role;

        public UserDTO() {}
        public UserDTO(Long id, String fullName, String email, String role) {
            this.id = id;
            this.fullName = fullName;
            this.email = email;
            this.role = role;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class ServiceDTO {
        private Long id;
        private String name;
        private String description;
        private String price;
        private String duration;
        private String icon;

        public ServiceDTO() {}
        public ServiceDTO(Long id, String name, String description, String price, String duration, String icon) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.price = price;
            this.duration = duration;
            this.icon = icon;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getPrice() { return price; }
        public void setPrice(String price) { this.price = price; }

        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }

        public String getIcon() { return icon; }
        public void setIcon(String icon) { this.icon = icon; }
    }

    public static class TimeSlotDTO {
        private Long id;
        private ServiceDTO service;
        private java.time.LocalDate date;
        private java.time.LocalTime startTime;
        private java.time.LocalTime endTime;
        private String status;

        public TimeSlotDTO() {}
        public TimeSlotDTO(Long id, ServiceDTO service, java.time.LocalDate date, 
                          java.time.LocalTime startTime, java.time.LocalTime endTime, String status) {
            this.id = id;
            this.service = service;
            this.date = date;
            this.startTime = startTime;
            this.endTime = endTime;
            this.status = status;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public ServiceDTO getService() { return service; }
        public void setService(ServiceDTO service) { this.service = service; }

        public java.time.LocalDate getDate() { return date; }
        public void setDate(java.time.LocalDate date) { this.date = date; }

        public java.time.LocalTime getStartTime() { return startTime; }
        public void setStartTime(java.time.LocalTime startTime) { this.startTime = startTime; }

        public java.time.LocalTime getEndTime() { return endTime; }
        public void setEndTime(java.time.LocalTime endTime) { this.endTime = endTime; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
