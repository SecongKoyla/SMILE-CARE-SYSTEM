package com.smilecare.smilecare_backend.dentalservice.service;

import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.dentalservice.repository.DentalServiceRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class DentalServiceService {

    private final DentalServiceRepository repository;
    private static final Logger logger = Logger.getLogger(DentalServiceService.class.getName());

    public DentalServiceService(DentalServiceRepository repository) {
        this.repository = repository;
    }

    public List<DentalService> getAllServices() {
        return repository.findAll();
    }

    public DentalService createService(DentalService service) {
        if (service.getName() == null || service.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Service name cannot be empty");
        }
        
        DentalService saved = repository.save(service);
        logger.info("✅ Service created: " + saved.getName() + " (ID: " + saved.getId() + ")");
        return saved;
    }

    public DentalService updateService(Long id, DentalService serviceDetails) {
        if (serviceDetails.getName() == null || serviceDetails.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Service name cannot be empty");
        }
        
        Optional<DentalService> existing = repository.findById(id);
        if (!existing.isPresent()) {
            logger.warning("⚠️ Service not found for update: " + id);
            return null;
        }
        
        DentalService service = existing.get();
        service.setName(serviceDetails.getName());
        service.setDescription(serviceDetails.getDescription());
        service.setPrice(serviceDetails.getPrice());
        service.setDuration(serviceDetails.getDuration());
        service.setIcon(serviceDetails.getIcon());
        
        DentalService saved = repository.save(service);
        logger.info("✅ Service updated: " + saved.getName() + " (ID: " + saved.getId() + ")");
        return saved;
    }

    public boolean deleteService(Long id) {
        Optional<DentalService> service = repository.findById(id);
        if (!service.isPresent()) {
            logger.warning("⚠️ Service not found for deletion: " + id);
            return false;
        }
        
        repository.deleteById(id);
        logger.info("✅ Service deleted: " + service.get().getName() + " (ID: " + id + ")");
        return true;
    }
}
