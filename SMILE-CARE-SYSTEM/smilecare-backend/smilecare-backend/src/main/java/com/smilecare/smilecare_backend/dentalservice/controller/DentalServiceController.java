package com.smilecare.smilecare_backend.dentalservice.controller;

import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.dentalservice.service.DentalServiceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
public class DentalServiceController {

    private final DentalServiceService service;

    public DentalServiceController(DentalServiceService service) {
        this.service = service;
    }

    @GetMapping
    public List<DentalService> getAllServices() {
        return service.getAllServices();
    }

    @PostMapping
    public DentalService createService(@RequestBody DentalService dentalService) {
        return service.createService(dentalService);
    }

    @DeleteMapping("/{id}")
    public void deleteService(@PathVariable Long id) {
        service.deleteService(id);
    }
}
