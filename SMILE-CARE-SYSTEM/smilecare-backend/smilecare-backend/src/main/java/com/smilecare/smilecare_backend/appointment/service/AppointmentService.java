package com.smilecare.smilecare_backend.appointment.service;

import com.smilecare.smilecare_backend.appointment.dto.AppointmentRequest;
import com.smilecare.smilecare_backend.appointment.model.Appointment;
import com.smilecare.smilecare_backend.appointment.model.AppointmentStatus;
import com.smilecare.smilecare_backend.appointment.repository.AppointmentRepository;
import com.smilecare.smilecare_backend.user.model.User;
import com.smilecare.smilecare_backend.user.repository.UserRepository;
import com.smilecare.smilecare_backend.dentalservice.model.DentalService;
import com.smilecare.smilecare_backend.dentalservice.repository.DentalServiceRepository;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import com.smilecare.smilecare_backend.timeslot.repository.TimeSlotRepository;
import com.smilecare.smilecare_backend.common.service.ClinicHoursService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DentalServiceRepository dentalServiceRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ClinicHoursService clinicHoursService;
    private static final Logger logger = Logger.getLogger(AppointmentService.class.getName());

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            DentalServiceRepository serviceRepository,
            TimeSlotRepository timeSlotRepository,
            ClinicHoursService clinicHoursService) {

        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.dentalServiceRepository = serviceRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.clinicHoursService = clinicHoursService;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment bookAppointment(AppointmentRequest request) {
        logger.info("\n📅 BOOKING APPOINTMENT");
        logger.info("   Patient ID: " + request.getPatientId());
        logger.info("   Service ID: " + request.getServiceId());
        logger.info("   TimeSlot ID: " + request.getTimeSlotId());

        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        logger.info("   ✓ Patient found: " + patient.getFullName());

        DentalService service = dentalServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));
        logger.info("   ✓ Service found: " + service.getName());

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));
        logger.info("   ✓ TimeSlot found: " + timeSlot.getDate() + " " + timeSlot.getStartTime());

        if (timeSlot.getService() == null) {
            throw new RuntimeException("Time slot has no associated service");
        }

        // ✅ BUSINESS RULE 1: Validate clinic is open on the booking date
        if (timeSlot.getDate() != null) {
            int javaDayOfWeek = timeSlot.getDate().getDayOfWeek().getValue(); // Monday=1, Sunday=7
            int clinicDayOfWeek = javaDayOfWeek == 7 ? 6 : javaDayOfWeek - 1; // Convert to 0=Monday, 6=Sunday
            
            Boolean isClinicOpen = clinicHoursService.isClinicOpenOnDay(clinicDayOfWeek);
            if (!isClinicOpen) {
                throw new RuntimeException("Clinic is closed on " + timeSlot.getDate().getDayOfWeek() + 
                        ". Cannot book appointment for this date.");
            }
            logger.info("   ✓ Clinic is open on " + timeSlot.getDate().getDayOfWeek());
        }

        // 🔴 BUSINESS RULE 2: Prevent booking if already booked
        if (timeSlot.getStatus() == TimeSlotStatus.BOOKED) {
            throw new RuntimeException("Time slot already booked!");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setService(service);
        appointment.setTimeSlot(timeSlot);
        appointment.setStatus(AppointmentStatus.PENDING);

        // 🔵 BUSINESS RULE 3: Mark time slot as booked
        timeSlot.setStatus(TimeSlotStatus.BOOKED);
        timeSlotRepository.save(timeSlot);
        logger.info("   ✓ TimeSlot marked as BOOKED");

        Appointment saved = appointmentRepository.save(appointment);
        logger.info("   ✓ Appointment created successfully (ID: " + saved.getId() + ")\n");
        
        return saved;
    }

    public Appointment approveAppointment(Long appointmentId, Long adminId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        User adminUser = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ Role check
        if (!"ADMIN".equals(adminUser.getRole().name())) {
            throw new RuntimeException("Only ADMIN users can approve appointments");
        }

        appointment.setProcessedByAdmin(adminUser);
        appointment.setStatus(AppointmentStatus.APPROVED);
        return appointmentRepository.save(appointment);
    }

    public void cancelAppointment(Long id) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.CANCELLED);

        // 🔵 Free the time slot
        TimeSlot timeSlot = appointment.getTimeSlot();
        timeSlot.setStatus(TimeSlotStatus.AVAILABLE);
        timeSlotRepository.save(timeSlot);

        appointmentRepository.save(appointment);
    }

    public Appointment updateAppointmentStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        try {
            AppointmentStatus newStatus = AppointmentStatus.valueOf(status.toUpperCase());
            appointment.setStatus(newStatus);
            return appointmentRepository.save(appointment);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid appointment status: " + status);
        }
    }

    public List<Appointment> getAppointmentsByUser(Long userId) {
        return appointmentRepository.findByPatientId(userId);
    }
}
