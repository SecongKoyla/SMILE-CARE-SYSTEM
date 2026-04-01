package com.smilecare.smilecare_backend.timeslot.model;

import jakarta.persistence.*;
import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_slots")
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private DentalService service;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    private TimeSlotStatus status;

    private LocalDateTime createdAt;

    public TimeSlot() {}

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DentalService getService() { return service; }
    public void setService(DentalService service) { this.service = service; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public TimeSlotStatus getStatus() { return status; }
    public void setStatus(TimeSlotStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
