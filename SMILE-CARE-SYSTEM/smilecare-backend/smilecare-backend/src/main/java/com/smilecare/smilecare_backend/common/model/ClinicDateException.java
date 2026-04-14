package com.smilecare.smilecare_backend.common.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "clinic_date_exceptions")
public class ClinicDateException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate date;

    private String reason;

    public ClinicDateException() {}

    public ClinicDateException(LocalDate date, String reason) {
        this.date = date;
        this.reason = reason;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
