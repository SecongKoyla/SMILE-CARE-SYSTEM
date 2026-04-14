package com.smilecare.smilecare_backend;

import com.smilecare.smilecare_backend.user.model.User;
import com.smilecare.smilecare_backend.user.model.Role;
import com.smilecare.smilecare_backend.user.repository.UserRepository;
import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.dentalservice.repository.DentalServiceRepository;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.timeslot.repository.TimeSlotRepository;
import com.smilecare.smilecare_backend.common.model.ClinicHours;
import com.smilecare.smilecare_backend.common.repository.ClinicHoursRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DentalServiceRepository dentalServiceRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ClinicHoursRepository clinicHoursRepository;

    public DataLoader(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      DentalServiceRepository dentalServiceRepository,
                      TimeSlotRepository timeSlotRepository,
                      ClinicHoursRepository clinicHoursRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.dentalServiceRepository = dentalServiceRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.clinicHoursRepository = clinicHoursRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("\n╔══════════════════════════════════════════════════════════╗");
        System.out.println("║         SMILE CARE - DATA LOADER STARTING               ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝\n");

        // ===================== CREATE USER =====================
        String email = "test@smilecare.com";

        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setFullName("Test User");
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("123456"));
            user.setRole(Role.ADMIN);
            user.setCreatedAt(LocalDateTime.now());

            try {
                Path path = Path.of("src/main/resources/images/default.png");
                byte[] photoBytes = Files.readAllBytes(path);
                user.setProfilePhoto(photoBytes);
            } catch (Exception e) {
                System.out.println("⚠️  Could not load default profile photo: " + e.getMessage());
            }

            userRepository.save(user);
            System.out.println("✓ Test user created successfully");
        } else {
            System.out.println("✓ Test user already exists");
        }

        // ===================== CREATE CLINIC HOURS =====================
        if (clinicHoursRepository.count() == 0) {
            System.out.println("📋 Creating default clinic hours...\n");

            String[] dayNames = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

            for (int day = 0; day < 7; day++) {
                ClinicHours hours = new ClinicHours();
                hours.setDayOfWeek(day);

                if (day < 5) {
                    // Monday-Friday: Open 9:00-12:00 (morning) and 14:00-17:00 (afternoon)
                    hours.setIsOperating(true);
                    hours.setMorningStart(LocalTime.of(9, 0));
                    hours.setMorningEnd(LocalTime.of(12, 0));
                    hours.setAfternoonStart(LocalTime.of(14, 0));
                    hours.setAfternoonEnd(LocalTime.of(17, 0));
                } else if (day == 5) {
                    // Saturday: Open 9:00-13:00 (morning only, no afternoon)
                    hours.setIsOperating(true);
                    hours.setMorningStart(LocalTime.of(9, 0));
                    hours.setMorningEnd(LocalTime.of(13, 0));
                    hours.setAfternoonStart(null);
                    hours.setAfternoonEnd(null);
                } else {
                    // Sunday: Closed
                    hours.setIsOperating(false);
                    hours.setMorningStart(null);
                    hours.setMorningEnd(null);
                    hours.setAfternoonStart(null);
                    hours.setAfternoonEnd(null);
                }

                clinicHoursRepository.save(hours);
                System.out.println("  ✓ " + dayNames[day] + " configured");
            }
            System.out.println("  ✓ Default clinic hours created\n");
        } else {
            System.out.println("✓ Clinic hours already configured");
        }

        // ===================== CREATE SERVICES & TIME SLOTS =====================
        long serviceCount = dentalServiceRepository.count();
        long timeSlotCount = timeSlotRepository.count();

        System.out.println("📊 Current database state:");
        System.out.println("    Services: " + serviceCount);
        System.out.println("    Time Slots: " + timeSlotCount);

        if (serviceCount > 0 && timeSlotCount < 10) {
            System.out.println("🔄 Detected incomplete data, clearing and recreating...");
            timeSlotRepository.deleteAll();
            dentalServiceRepository.deleteAll();
            System.out.println("   ✓ Database cleared");
            serviceCount = 0;
        }

        if (serviceCount == 0) {
            System.out.println("📝 Creating sample services and time slots...\n");

            String[] serviceNames = {"Cleaning", "Filling", "Root Canal", "Whitening"};
            String[] serviceDurations = {"30 min", "45 min", "60 min", "45 min"};
            String[] servicePrices = {"$75", "$150", "$300", "$200"};
            String[] serviceIcons = {"🪥", "🔧", "🦷", "✨"};

            LocalDate today = LocalDate.now();

            List<DentalService> savedServices = new ArrayList<>();
            for (int i = 0; i < serviceNames.length; i++) {
                DentalService service = new DentalService();
                service.setName(serviceNames[i]);
                service.setDescription("Professional " + serviceNames[i].toLowerCase() + " service");
                service.setDuration(serviceDurations[i]);
                service.setPrice(servicePrices[i]);
                service.setIcon(serviceIcons[i]);
                savedServices.add(service);
            }
            dentalServiceRepository.saveAll(savedServices);
            System.out.println("✓ All services saved");

            List<TimeSlot> allTimeSlots = new ArrayList<>();
            for (DentalService service : savedServices) {
                for (int day = 1; day <= 7; day++) {
                    LocalDate slotDate = today.plusDays(day);

                    // Morning slot
                    TimeSlot morningSlot = new TimeSlot();
                    morningSlot.setService(service);
                    morningSlot.setDate(slotDate);
                    morningSlot.setStartTime(LocalTime.of(9, 0));
                    morningSlot.setEndTime(LocalTime.of(10, 0));
                    morningSlot.setStatus(TimeSlotStatus.AVAILABLE);
                    allTimeSlots.add(morningSlot);

                    // Afternoon slot
                    TimeSlot afternoonSlot = new TimeSlot();
                    afternoonSlot.setService(service);
                    afternoonSlot.setDate(slotDate);
                    afternoonSlot.setStartTime(LocalTime.of(14, 0));
                    afternoonSlot.setEndTime(LocalTime.of(15, 0));
                    afternoonSlot.setStatus(TimeSlotStatus.AVAILABLE);
                    allTimeSlots.add(afternoonSlot);
                }
            }

            timeSlotRepository.saveAll(allTimeSlots);
            System.out.println("✓ All time slots saved\n");
        } else {
            System.out.println("✓ Services already exist, skipping creation");
        }

        System.out.println("\n╔══════════════════════════════════════════════════════════╗");
        System.out.println("║             DATA LOADER COMPLETED                       ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝\n");
    }
}
