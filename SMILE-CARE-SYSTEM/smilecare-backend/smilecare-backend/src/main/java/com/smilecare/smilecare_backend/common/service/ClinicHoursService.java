package com.smilecare.smilecare_backend.common.service;

import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.common.dto.ClinicHoursDTO;
import com.smilecare.smilecare_backend.common.repository.ClinicHoursRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.logging.Logger;

@Service
public class ClinicHoursService {

    private final ClinicHoursRepository repository;
    private static final Logger logger = Logger.getLogger(ClinicHoursService.class.getName());

    public ClinicHoursService(ClinicHoursRepository repository) {
        this.repository = repository;
    }

    /**
     * Load ALL clinic hours once and cache for 10 minutes
     * This replaces repeated individual queries
     *
     * Query Count: 1 (instead of 7)
     */
    @Cacheable(value = "clinicHoursCache", cacheManager = "cacheManager")
    @Transactional(readOnly = true)
    public Map<Integer, ClinicHours> getAllClinicHoursCached() {
        logger.info("📅 Loading all clinic hours from database (CACHE MISS - will be reused for 10 min)");

        // Single query: Get all days at once
        List<ClinicHours> hoursList = repository.findAll();

        // Convert to map for O(1) lookup
        Map<Integer, ClinicHours> map = new HashMap<>();
        for (ClinicHours h : hoursList) {
            map.put(h.getDayOfWeek(), h);
        }

        logger.info("✅ Cached " + map.size() + " clinic hours configs");
        return map;
    }

    /**
     * Get clinic hours for a specific day (uses cache, O(1) lookup)
     */
    public ClinicHours getClinicHoursForDay(Integer dayOfWeek) {
        Map<Integer, ClinicHours> cached = getAllClinicHoursCached(); // 0 queries (from cache)
        return cached.get(dayOfWeek);
    }

    /**
     * Check if clinic is open on a day (uses cached data, NO query)
     */
    public Boolean isClinicOpenOnDay(Integer dayOfWeek) {
        Map<Integer, ClinicHours> cached = getAllClinicHoursCached(); // 0 queries (from cache)
        ClinicHours hours = cached.get(dayOfWeek);
        return hours != null ? hours.getIsOperating() : true;
    }

    @Transactional(readOnly = true)
    public List<ClinicHoursDTO> getAllClinicHours() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClinicHoursDTO getClinicHoursByDay(Integer dayOfWeek) {
        return repository.findByDayOfWeek(dayOfWeek)
                .map(this::toDTO)
                .orElse(null);
    }

    /**
     * Update clinic hours and invalidate cache
     * Users will see new availability on next request
     */
    @CacheEvict(value = "clinicHoursCache", allEntries = true)
    public ClinicHoursDTO updateClinicHours(Integer dayOfWeek, Boolean isOperating,
                                            LocalTime morningStart, LocalTime morningEnd,
                                            LocalTime afternoonStart, LocalTime afternoonEnd) {
        logger.info("📅 Admin updating clinic hours for day " + dayOfWeek);

        ClinicHours hours = repository.findByDayOfWeek(dayOfWeek)
                .orElse(new ClinicHours());

        hours.setDayOfWeek(dayOfWeek);
        hours.setIsOperating(isOperating);
        hours.setMorningStart(morningStart);
        hours.setMorningEnd(morningEnd);
        hours.setAfternoonStart(afternoonStart);
        hours.setAfternoonEnd(afternoonEnd);

        ClinicHours saved = repository.save(hours);
        logger.info("✅ Updated and cache cleared. Users will see new availability immediately.");
        return toDTO(saved);
    }

    private ClinicHoursDTO toDTO(ClinicHours hours) {
        if (hours == null) {
            throw new IllegalArgumentException("ClinicHours cannot be null");
        }

        if (hours.getDayOfWeek() == null || hours.getDayOfWeek() < 0 || hours.getDayOfWeek() > 6) {
            throw new IllegalArgumentException("Invalid dayOfWeek: " + hours.getDayOfWeek());
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