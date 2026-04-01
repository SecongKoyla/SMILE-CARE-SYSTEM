package com.smilecare.smilecare_backend.common.service;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.common.dto.ClinicHoursDTO;
import com.smilecare.smilecare_backend.common.repository.ClinicHoursRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClinicHoursService {

    private final ClinicHoursRepository repository;

    public ClinicHoursService(ClinicHoursRepository repository) {
        this.repository = repository;
    }

    public List<ClinicHoursDTO> getAllClinicHours() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ClinicHoursDTO getClinicHoursByDay(Integer dayOfWeek) {
        return repository.findByDayOfWeek(dayOfWeek)
                .map(this::toDTO)
                .orElse(null);
    }

    public ClinicHoursDTO updateClinicHours(Integer dayOfWeek, Boolean isOperating,
                                           LocalTime morningStart, LocalTime morningEnd,
                                           LocalTime afternoonStart, LocalTime afternoonEnd) {
        ClinicHours hours = repository.findByDayOfWeek(dayOfWeek)
                .orElse(new ClinicHours());

        hours.setDayOfWeek(dayOfWeek);
        hours.setIsOperating(isOperating);
        hours.setMorningStart(morningStart);
        hours.setMorningEnd(morningEnd);
        hours.setAfternoonStart(afternoonStart);
        hours.setAfternoonEnd(afternoonEnd);

        ClinicHours saved = repository.save(hours);
        return toDTO(saved);
    }

    public Boolean isClinicOpenOnDay(Integer dayOfWeek) {
        return repository.findByDayOfWeek(dayOfWeek)
                .map(ClinicHours::getIsOperating)
                .orElse(true); // Default: open if not configured
    }

    private ClinicHoursDTO toDTO(ClinicHours hours) {
        if (hours == null) {
            throw new IllegalArgumentException("ClinicHours cannot be null");
        }
        
        if (hours.getDayOfWeek() == null || hours.getDayOfWeek() < 0 || hours.getDayOfWeek() > 6) {
            throw new IllegalArgumentException("Invalid dayOfWeek: " + hours.getDayOfWeek() + ". Must be 0-6.");
        }

        String[] dayNames = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
        String dayName = dayNames[hours.getDayOfWeek()];

        return new ClinicHoursDTO(
                hours.getId(),
                hours.getDayOfWeek(),
                dayName,
                hours.getIsOperating(),
                hours.getMorningStart(),
                hours.getMorningEnd(),
                hours.getAfternoonStart(),
                hours.getAfternoonEnd()
        );
    }
}
