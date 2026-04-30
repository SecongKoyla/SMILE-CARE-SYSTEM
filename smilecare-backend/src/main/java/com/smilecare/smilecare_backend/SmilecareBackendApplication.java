package com.smilecare.smilecare_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.smilecare.smilecare_backend")
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

        SpringApplication app = new SpringApplication(SmilecareBackendApplication.class);

        app.setDefaultProperties(java.util.Map.of(
                "server.port", System.getenv().getOrDefault("PORT", "8085"),
                "server.address", "0.0.0.0"
        ));

        app.run(args);
    }
}