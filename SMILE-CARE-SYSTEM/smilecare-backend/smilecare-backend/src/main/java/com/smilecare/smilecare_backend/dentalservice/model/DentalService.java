package com.smilecare.smilecare_backend.dentalservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dental_services")
public class DentalService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String price;

    @Column(name = "duration_unit")
    private String durationUnit; // "minutes" or "hours"

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    private String icon;

    @Column(name = "created_at")
    private LocalDateTime createdAt;    
    @OneToMany(mappedBy = "service", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private java.util.List<com.smilecare.smilecare_backend.appointment.model.Appointment> appointments = new java.util.ArrayList<>();
    public DentalService() {
        this.durationMinutes = 30;
        this.durationUnit = "minutes";
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.durationMinutes == null) {
            this.durationMinutes = 30;
        }
        if (this.durationUnit == null) {
            this.durationUnit = "minutes";
        }
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public String getDurationUnit() { return durationUnit; }
    public void setDurationUnit(String durationUnit) { this.durationUnit = durationUnit; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // ================= CUSTOM DURATION METHODS =================

    public void setDuration(String serviceDuration) {
        if (serviceDuration == null || serviceDuration.isEmpty()) {
            return;
        }

        String[] parts = serviceDuration.split(" ");
        if (parts.length < 2) {
            return;
        }

        try {
            int value = Integer.parseInt(parts[0]);
            String unit = parts[1].toLowerCase();

            if (unit.startsWith("hour")) {
                this.durationMinutes = value * 60;
                this.durationUnit = "hours";
            } else {
                this.durationMinutes = value;
                this.durationUnit = "minutes";
            }
        } catch (NumberFormatException e) {
            // ignore invalid input
        }
    }

    public String getDuration() {
        if (durationMinutes == null) {
            return "0 minutes";
        }

        if ("hours".equalsIgnoreCase(durationUnit)) {
            int hours = durationMinutes / 60;
            return hours + " hours";
        } else {
            return durationMinutes + " minutes";
        }
    }
}