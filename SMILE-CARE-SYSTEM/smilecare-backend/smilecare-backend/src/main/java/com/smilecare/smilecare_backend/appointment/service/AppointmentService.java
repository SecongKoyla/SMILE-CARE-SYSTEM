package com.smilecare.smilecare_backend.appointment.service;

import com.smilecare.smilecare_backend.appointment.dto.AppointmentRequest;
import com.smilecare.smilecare_backend.appointment.dto.AppointmentResponseDTO;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.logging.Logger;

@Service
@Transactional
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

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> getAllAppointments() {
        try {
            logger.info("📋 Fetching all appointments with eager loading");
            // ✅ Use custom query with JOIN FETCH to eagerly load all relationships
            List<Appointment> appointments = appointmentRepository.findAllWithRelationships();
            logger.info("📦 Loaded " + appointments.size() + " appointments from database");
            // ✅ Convert to DTOs while still inside transaction (no lazy-loading needed)
            List<AppointmentResponseDTO> dtos = convertToDTOs(appointments);
            logger.info("✅ Converted to DTOs: " + dtos.size());
            return dtos;
        } catch (Exception e) {
            logger.severe("❌ Error in getAllAppointments: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch appointments: " + e.getMessage(), e);
        }
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

        // 🔵 HANDLE TEMPORARY SLOTS (Negative IDs from frontend dynamic generation)
        TimeSlot timeSlot;
        
        if (request.getTimeSlotId() < 0) {
            // Temporary slot generated on frontend - create it now
            logger.info("   🔵 Creating temporary slot (ID: " + request.getTimeSlotId() + ")");
            
            if (request.getStartTime() == null || request.getEndTime() == null || request.getAppointmentDate() == null) {
                throw new RuntimeException("For temporary slots, startTime, endTime, and appointmentDate are required");
            }
            
            timeSlot = new TimeSlot();
            timeSlot.setService(service);
            timeSlot.setDate(request.getAppointmentDate());
            timeSlot.setStartTime(request.getStartTime());
            timeSlot.setEndTime(request.getEndTime());
            timeSlot.setStatus(TimeSlotStatus.AVAILABLE);
            
            logger.info("   ✓ Temporary TimeSlot created: " + request.getAppointmentDate() + " " + 
                        request.getStartTime() + " - " + request.getEndTime());
        } else {
            // Existing slot from database
            timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
                    .orElseThrow(() -> new RuntimeException("Time slot not found"));
            logger.info("   ✓ TimeSlot found: " + timeSlot.getDate() + " " + timeSlot.getStartTime());
        }

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

        // 🔴 BUSINESS RULE 2: Prevent booking if already booked (only for persistent slots)
        if (request.getTimeSlotId() > 0 && timeSlot.getStatus() == TimeSlotStatus.BOOKED) {
            throw new RuntimeException("Time slot already booked!");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setService(service);
        appointment.setTimeSlot(timeSlot);
        appointment.setStatus(AppointmentStatus.PENDING);

        // 🔵 BUSINESS RULE 3: Mark time slot as booked and save
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

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> getAppointmentsByUser(Long userId) {
        try {
            logger.info("📋 Fetching appointments for user " + userId + " with eager loading");
            // ✅ Use custom query with JOIN FETCH to eagerly load all relationships
            List<Appointment> appointments = appointmentRepository.findByPatientIdWithRelationships(userId);
            logger.info("📦 Loaded " + appointments.size() + " appointments from database");
            // ✅ Convert to DTOs while still inside transaction (no lazy-loading needed)
            List<AppointmentResponseDTO> dtos = convertToDTOs(appointments);
            logger.info("✅ Converted to DTOs: " + dtos.size());
            return dtos;
        } catch (Exception e) {
            logger.severe("❌ Error in getAppointmentsByUser: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch appointments for user: " + e.getMessage(), e);
        }
    }

    /**
     * Convert Appointment entity to AppointmentResponseDTO
     * Excludes sensitive data like profilePhoto
     */
    private AppointmentResponseDTO convertToDTO(Appointment appointment) {
        if (appointment == null) {
            return null;
        }

        AppointmentResponseDTO.UserDTO patientDTO = null;
        if (appointment.getPatient() != null) {
            patientDTO = new AppointmentResponseDTO.UserDTO(
                appointment.getPatient().getId(),
                appointment.getPatient().getFullName(),
                appointment.getPatient().getEmail(),
                appointment.getPatient().getRole().name()
            );
        }

        AppointmentResponseDTO.UserDTO adminDTO = null;
        if (appointment.getProcessedByAdmin() != null) {
            adminDTO = new AppointmentResponseDTO.UserDTO(
                appointment.getProcessedByAdmin().getId(),
                appointment.getProcessedByAdmin().getFullName(),
                appointment.getProcessedByAdmin().getEmail(),
                appointment.getProcessedByAdmin().getRole().name()
            );
        }

        AppointmentResponseDTO.ServiceDTO serviceDTO = null;
        if (appointment.getService() != null) {
            serviceDTO = new AppointmentResponseDTO.ServiceDTO(
                appointment.getService().getId(),
                appointment.getService().getName(),
                appointment.getService().getDescription(),
                appointment.getService().getPrice(),
                appointment.getService().getDuration(),
                appointment.getService().getIcon()
            );
        }

        AppointmentResponseDTO.TimeSlotDTO timeSlotDTO = null;
        if (appointment.getTimeSlot() != null) {
            AppointmentResponseDTO.ServiceDTO slotServiceDTO = null;
            if (appointment.getTimeSlot().getService() != null) {
                slotServiceDTO = new AppointmentResponseDTO.ServiceDTO(
                    appointment.getTimeSlot().getService().getId(),
                    appointment.getTimeSlot().getService().getName(),
                    appointment.getTimeSlot().getService().getDescription(),
                    appointment.getTimeSlot().getService().getPrice(),
                    appointment.getTimeSlot().getService().getDuration(),
                    appointment.getTimeSlot().getService().getIcon()
                );
            }

            timeSlotDTO = new AppointmentResponseDTO.TimeSlotDTO(
                appointment.getTimeSlot().getId(),
                slotServiceDTO,
                appointment.getTimeSlot().getDate(),
                appointment.getTimeSlot().getStartTime(),
                appointment.getTimeSlot().getEndTime(),
                appointment.getTimeSlot().getStatus().name()
            );
        }

        return new AppointmentResponseDTO(
            appointment.getId(),
            patientDTO,
            adminDTO,
            serviceDTO,
            timeSlotDTO,
            appointment.getStatus().name(),
            appointment.getCreatedAt()
        );
    }

    /**
     * Convert list of Appointments to DTOs
     * All lazy-loading should be complete at this point due to JOIN FETCH
     */
    public List<AppointmentResponseDTO> convertToDTOs(List<Appointment> appointments) {
        try {
            return appointments.stream()
                .map(this::convertToDTO)
                .toList();
        } catch (Exception e) {
            logger.severe("Error converting appointments to DTOs: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to convert appointments to DTOs: " + e.getMessage(), e);
        }
    }
}
