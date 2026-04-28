package com.smilecare.smilecare_backend.common.model;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinic_hours")
public class ClinicHours {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "clinic_hours_seq")
    @SequenceGenerator(name = "clinic_hours_seq", sequenceName = "clinic_hours_id_seq", allocationSize = 1)
    private Long id;

    // Days of week: MONDAY=0, ..., SUNDAY=6
    @Column(nullable = false)
    private Integer dayOfWeek; // 0=Monday, 1=Tuesday, ..., 6=Sunday

    @Column(nullable = false)
    private Boolean isOperating; // true = clinic open, false = closed

    private LocalTime morningStart;    // e.g., 09:00
    private LocalTime morningEnd;      // e.g., 12:00
    private LocalTime afternoonStart;  // e.g., 14:00
    private LocalTime afternoonEnd;    // e.g., 17:00

    private LocalDateTime updatedAt;

    public ClinicHours() {}

    public ClinicHours(Integer dayOfWeek, Boolean isOperating, 
                      LocalTime morningStart, LocalTime morningEnd,
                      LocalTime afternoonStart, LocalTime afternoonEnd) {
        this.dayOfWeek = dayOfWeek;
        this.isOperating = isOperating;
        this.morningStart = morningStart;
        this.morningEnd = morningEnd;
        this.afternoonStart = afternoonStart;
        this.afternoonEnd = afternoonEnd;
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    @PrePersist
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public Boolean getIsOperating() { return isOperating; }
    public void setIsOperating(Boolean isOperating) { this.isOperating = isOperating; }

    public LocalTime getMorningStart() { return morningStart; }
    public void setMorningStart(LocalTime morningStart) { this.morningStart = morningStart; }

    public LocalTime getMorningEnd() { return morningEnd; }
    public void setMorningEnd(LocalTime morningEnd) { this.morningEnd = morningEnd; }

    public LocalTime getAfternoonStart() { return afternoonStart; }
    public void setAfternoonStart(LocalTime afternoonStart) { this.afternoonStart = afternoonStart; }

    public LocalTime getAfternoonEnd() { return afternoonEnd; }
    public void setAfternoonEnd(LocalTime afternoonEnd) { this.afternoonEnd = afternoonEnd; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
