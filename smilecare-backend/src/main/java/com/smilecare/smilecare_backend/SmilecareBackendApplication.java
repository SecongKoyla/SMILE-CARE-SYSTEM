package com.smilecare.smilecare_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@EntityScan({
        "com.smilecare.smilecare_backend.appointment.model",
        "com.smilecare.smilecare_backend.timeslot.model",
        "com.smilecare.smilecare_backend.dentalservice.model",
        "com.smilecare.smilecare_backend.user.model",
        "com.smilecare.smilecare_backend.auth.model",
        "com.smilecare.smilecare_backend.common.model"
})
@EnableJpaRepositories({
        "com.smilecare.smilecare_backend.appointment.repository",
        "com.smilecare.smilecare_backend.timeslot.repository",
        "com.smilecare.smilecare_backend.dentalservice.repository",
        "com.smilecare.smilecare_backend.user.repository",
        "com.smilecare.smilecare_backend.auth.repository",
        "com.smilecare.smilecare_backend.common.repository"
})
public class SmilecareBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmilecareBackendApplication.class, args);
    }

    // Add this bean to enable CORS globally
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("https://smile-care-system-frontend.onrender.com")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}