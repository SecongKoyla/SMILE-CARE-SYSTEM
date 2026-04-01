package com.smilecare.smilecare_backend.appointment.dto;

import jakarta.validation.constraints.NotNull;

public class AppointmentRequest {

    @NotNull
    private Long patientId;

    @NotNull
    private Long serviceId;

    @NotNull
    private Long timeSlotId;

    @NotNull
    private String status;

    // Getters and Setters

    public @NotNull Long getPatientId() {
        return patientId;
    }

    public void setPatientId(@NotNull Long patientId) {
        this.patientId = patientId;
    }

    public @NotNull Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(@NotNull Long serviceId) {
        this.serviceId = serviceId;
    }

    public @NotNull Long getTimeSlotId() {
        return timeSlotId;
    }

    public void setTimeSlotId(@NotNull Long timeSlotId) {
        this.timeSlotId = timeSlotId;
    }

    public @NotNull String getStatus() {
        return status;
    }

    public void setStatus(@NotNull String status) {
        this.status = status;
    }
}
