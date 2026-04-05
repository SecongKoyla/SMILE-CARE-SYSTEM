package com.smilecare.smilecare_backend.dentalservice.controller;

import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.dentalservice.dto.DentalServiceDTO;
import com.smilecare.smilecare_backend.dentalservice.service.DentalServiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/services")
public class DentalServiceController {

    private final DentalServiceService service;
    private static final Logger logger = Logger.getLogger(DentalServiceController.class.getName());

    public DentalServiceController(DentalServiceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAllServices() {
        try {
            logger.info("📋 Fetching all dental services");
            List<DentalService> services = service.getAllServices();
            List<DentalServiceDTO> dtos = services.stream()
                    .map(DentalServiceDTO::new)
                    .collect(Collectors.toList());
            logger.info("✅ Found " + dtos.size() + " services");
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.severe("❌ Error fetching services: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch services: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createService(@RequestBody DentalService dentalService) {
        try {
            logger.info("➕ Creating new service: " + dentalService.getName());
            
            if (dentalService.getName() == null || dentalService.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Service name is required"));
            }
            
            DentalService created = service.createService(dentalService);
            DentalServiceDTO dto = new DentalServiceDTO(created);
            logger.info("✅ Service created successfully (ID: " + created.getId() + ")");
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.severe("❌ Error creating service: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to create service: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateService(@PathVariable Long id, @RequestBody DentalService dentalService) {
        try {
            logger.info("✏️ Updating service " + id);
            
            if (dentalService.getName() == null || dentalService.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Service name is required"));
            }
            
            DentalService updated = service.updateService(id, dentalService);
            if (updated == null) {
                logger.warning("⚠️ Service not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            DentalServiceDTO dto = new DentalServiceDTO(updated);
            logger.info("✅ Service updated successfully");
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.severe("❌ Error updating service: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to update service: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id) {
        try {
            logger.info("🗑️ Deleting service " + id);
            boolean deleted = service.deleteService(id);
            
            if (!deleted) {
                logger.warning("⚠️ Service not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            logger.info("✅ Service deleted successfully");
            return ResponseEntity.ok(Map.of("message", "Service deleted successfully"));
        } catch (Exception e) {
            logger.severe("❌ Error deleting service: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to delete service: " + e.getMessage()));
        }
    }
}
