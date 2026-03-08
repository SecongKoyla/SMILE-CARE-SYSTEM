package com.smilecare.smilecare_backend.service;

import com.smilecare.smilecare_backend.dto.AppointmentRequest;
import com.smilecare.smilecare_backend.model.*;
import com.smilecare.smilecare_backend.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DentalServiceRepository dentalServiceRepository;
    private final TimeSlotRepository timeSlotRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            DentalServiceRepository serviceRepository,
            TimeSlotRepository timeSlotRepository) {

        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.dentalServiceRepository = serviceRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment bookAppointment(AppointmentRequest request) {

        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        DentalService service = dentalServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        // 🔴 BUSINESS RULE 1: Prevent booking if already booked
        if (timeSlot.getStatus() == TimeSlotStatus.BOOKED) {
            throw new RuntimeException("Time slot already booked!");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setService(service);
        appointment.setTimeSlot(timeSlot);
        appointment.setStatus(AppointmentStatus.PENDING);

        // 🔵 BUSINESS RULE 2: Mark time slot as booked
        timeSlot.setStatus(TimeSlotStatus.BOOKED);
        timeSlotRepository.save(timeSlot);

        return appointmentRepository.save(appointment);
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

}
