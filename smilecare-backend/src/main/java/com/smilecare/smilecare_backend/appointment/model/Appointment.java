package com.smilecare.smilecare_backend.appointment.model;

import jakarta.persistence.*;
import com.smilecare.smilecare_backend.user.model.User;
import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne
    @JoinColumn(name = "processed_by_admin_id")
    private User processedByAdmin;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private DentalService service;

    @ManyToOne
    @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    private LocalDateTime createdAt;

    public Appointment() {}

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public User getProcessedByAdmin() { return processedByAdmin; }
    public void setProcessedByAdmin(User processedByAdmin) { this.processedByAdmin = processedByAdmin; }

    public DentalService getService() { return service; }
    public void setService(DentalService service) { this.service = service; }

    public TimeSlot getTimeSlot() { return timeSlot; }
    public void setTimeSlot(TimeSlot timeSlot) { this.timeSlot = timeSlot; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
