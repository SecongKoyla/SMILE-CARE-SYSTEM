package com.smilecare.smilecare_backend.appointment.repository;

import com.smilecare.smilecare_backend.appointment.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    /**
     * Find all appointments with all relationships eagerly loaded (JOIN FETCH)
     * This prevents N+1 queries and lazy-loading issues outside transactions
     */
    @Query("SELECT DISTINCT a FROM Appointment a " +
           "JOIN FETCH a.patient " +
           "JOIN FETCH a.service " +
           "JOIN FETCH a.timeSlot ts " +
           "JOIN FETCH ts.service")
    List<Appointment> findAllWithRelationships();
    
    /**
     * Find appointments by patient with all relationships eagerly loaded
     */
    @Query("SELECT DISTINCT a FROM Appointment a " +
           "JOIN FETCH a.patient " +
           "JOIN FETCH a.service " +
           "JOIN FETCH a.timeSlot ts " +
           "JOIN FETCH ts.service " +
           "WHERE a.patient.id = :patientId")
    List<Appointment> findByPatientIdWithRelationships(@Param("patientId") Long patientId);
    
    List<Appointment> findByPatientId(Long patientId);
}
