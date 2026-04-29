package com.smilecare.smilecare_backend.common.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;

public class ClinicHoursDTO {
    private Long id;
    private Integer dayOfWeek; // 0=Monday, 1=Tuesday, ..., 6=Sunday
    private String dayName;
    private Boolean isOperating;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime morningStart;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime morningEnd;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime afternoonStart;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime afternoonEnd;

    public ClinicHoursDTO() {}

    public ClinicHoursDTO(Long id, Integer dayOfWeek, String dayName, Boolean isOperating,
                        LocalTime morningStart, LocalTime morningEnd,
                        LocalTime afternoonStart, LocalTime afternoonEnd) {
        this.id = id;
        this.dayOfWeek = dayOfWeek;
        this.dayName = dayName;
        this.isOperating = isOperating;
        this.morningStart = morningStart;
        this.morningEnd = morningEnd;
        this.afternoonStart = afternoonStart;
        this.afternoonEnd = afternoonEnd;
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getDayName() { return dayName; }
    public void setDayName(String dayName) { this.dayName = dayName; }

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
}
