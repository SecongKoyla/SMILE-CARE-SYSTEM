package com.smilecare.smilecare_backend.dentalservice.dto;

import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * DTO for DentalService
 */
public class DentalServiceDTO {
    private Long id;
    private String name;
    private String description;
    private String price;
    
    @JsonProperty("duration_minutes")
    private Integer durationMinutes;  // Raw minutes (30, 60, 120, etc)
    
    @JsonProperty("duration_unit")
    private String durationUnit;  // "minutes" or "hours"
    
    // For backward compatibility with frontend code
    @JsonProperty("durationUnit")
    private String durationUnitCamelCase;
    
    @JsonProperty("duration")
    private String duration; // Helper for display (e.g. "30" or "1")
    
    private String icon;
    private LocalDateTime createdAt;

    public DentalServiceDTO() {}

    public DentalServiceDTO(DentalService service) {
        this.id = service.getId();
        this.name = service.getName();
        this.description = service.getDescription();
        this.price = service.getPrice();
        this.icon = service.getIcon();
        this.createdAt = service.getCreatedAt();
        
        this.durationMinutes = service.getDurationMinutes();
        this.durationUnit = service.getDurationUnit() != null ? service.getDurationUnit() : "minutes";
        this.durationUnitCamelCase = this.durationUnit;
        
        // Calculate display duration value for backward compatibility
        if (this.durationMinutes != null) {
            if ("hours".equals(this.durationUnit)) {
                this.duration = String.valueOf(this.durationMinutes / 60);
            } else {
                this.duration = String.valueOf(this.durationMinutes);
            }
        }
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getDurationUnit() { return durationUnit; }
    public void setDurationUnit(String durationUnit) { 
        this.durationUnit = durationUnit; 
        this.durationUnitCamelCase = durationUnit;
    }
    
    public String getDurationUnitCamelCase() { return durationUnitCamelCase; }
    public void setDurationUnitCamelCase(String durationUnitCamelCase) { this.durationUnitCamelCase = durationUnitCamelCase; }
    
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
