package com.smilecare.smilecare_backend.service;

import com.smilecare.smilecare_backend.model.DentalService;
import com.smilecare.smilecare_backend.repository.DentalServiceRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DentalServiceService {

    private final DentalServiceRepository repository;

    public DentalServiceService(DentalServiceRepository repository) {
        this.repository = repository;
    }

    public List<DentalService> getAllServices() {
        return repository.findAll();
    }

    public DentalService createService(DentalService service) {
        return repository.save(service);
    }

    public void deleteService(Long id) {
        repository.deleteById(id);
    }
}
