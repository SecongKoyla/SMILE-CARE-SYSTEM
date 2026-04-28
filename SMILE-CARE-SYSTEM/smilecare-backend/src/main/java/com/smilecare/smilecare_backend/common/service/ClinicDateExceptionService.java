package com.smilecare.smilecare_backend.common.service;

import com.smilecare.smilecare_backend.common.model.ClinicDateException;
import com.smilecare.smilecare_backend.common.repository.ClinicDateExceptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ClinicDateExceptionService {

    private final ClinicDateExceptionRepository repository;

    public ClinicDateExceptionService(ClinicDateExceptionRepository repository) {
        this.repository = repository;
    }

    public List<ClinicDateException> getAllExceptions() {
        return repository.findAll();
    }

    @org.springframework.cache.annotation.Cacheable(value = "clinicExceptions", key = "#date")
    public Optional<ClinicDateException> getExceptionByDate(LocalDate date) {
        return repository.findByDate(date);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "clinicExceptions", allEntries = true)
    public ClinicDateException addException(ClinicDateException exception) {
        return repository.save(exception);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "clinicExceptions", allEntries = true)
    public void deleteException(Long id) {
        repository.deleteById(id);
    }
}
