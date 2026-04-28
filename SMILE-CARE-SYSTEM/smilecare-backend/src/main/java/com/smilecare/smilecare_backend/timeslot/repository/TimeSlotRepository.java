package com.smilecare.smilecare_backend.timeslot.repository;

import com.smilecare.smilecare_backend.timeslot.model.TimeSlot;
import com.smilecare.smilecare_backend.timeslot.model.TimeSlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    
    /**
     * Find all available time slots (status = AVAILABLE)
     * Uses database-level filtering instead of loading all records into memory
     */
    @Query("SELECT ts FROM TimeSlot ts WHERE ts.status = 'AVAILABLE' ORDER BY ts.date ASC, ts.startTime ASC")
    List<TimeSlot> findAllAvailable();
    
    /**
     * Find available time slots for a specific service
     * Uses JOIN FETCH to eagerly load the service relationship
     * @param serviceId the service ID to filter by
     */
    @Query("SELECT DISTINCT ts FROM TimeSlot ts JOIN FETCH ts.service WHERE ts.service.id = :serviceId AND ts.status = 'AVAILABLE' ORDER BY ts.date ASC, ts.startTime ASC")
    List<TimeSlot> findAvailableByService(@Param("serviceId") Long serviceId);
    
    /**
     * Find available time slots for a specific date
     * @param date the date to filter by
     */
    @Query("SELECT ts FROM TimeSlot ts WHERE ts.date = :date AND ts.status = 'AVAILABLE' ORDER BY ts.startTime ASC")
    List<TimeSlot> findAvailableByDate(@Param("date") LocalDate date);
    
    /**
     * Find available time slots for a specific service and date
     * Uses JOIN FETCH to eagerly load the service relationship
     * @param serviceId the service ID
     * @param date the date
     */
    @Query("SELECT DISTINCT ts FROM TimeSlot ts JOIN FETCH ts.service WHERE ts.service.id = :serviceId AND ts.date = :date AND ts.status = 'AVAILABLE' ORDER BY ts.startTime ASC")
    List<TimeSlot> findAvailableByServiceAndDate(@Param("serviceId") Long serviceId, @Param("date") LocalDate date);
    
    /**
     * Find available time slots on or after a specific date
     * @param fromDate the start date (inclusive)
     */
    @Query("SELECT ts FROM TimeSlot ts WHERE ts.date >= :fromDate AND ts.status = 'AVAILABLE' ORDER BY ts.date ASC, ts.startTime ASC")
    List<TimeSlot> findAvailableFromDate(@Param("fromDate") LocalDate fromDate);
    
    /**
     * Find available time slots for a service on or after a specific date
     * Uses JOIN FETCH to eagerly load the service relationship
     * @param serviceId the service ID
     * @param fromDate the start date (inclusive)
     */
    @Query("SELECT DISTINCT ts FROM TimeSlot ts JOIN FETCH ts.service WHERE ts.service.id = :serviceId AND ts.date >= :fromDate AND ts.status = 'AVAILABLE' ORDER BY ts.date ASC, ts.startTime ASC")
    List<TimeSlot> findAvailableByServiceFromDate(@Param("serviceId") Long serviceId, @Param("fromDate") LocalDate fromDate);

    List<TimeSlot> findByServiceIdAndDate(Long serviceId, LocalDate date);
    
    // Find all slots across all services on a specific date where status is not explicitly available
    // AND it has an active appointment (avoids "ghost" booked slots from before the fix)
    @Query("SELECT DISTINCT ts FROM TimeSlot ts " +
           "WHERE ts.date = :date " +
           "AND ts.status != 'AVAILABLE' " +
           "AND EXISTS (" +
           "  SELECT 1 FROM Appointment a " +
           "  WHERE a.timeSlot = ts AND a.status IN ('PENDING', 'APPROVED', 'ARRIVED', 'COMPLETED')" +
           ")")
    List<TimeSlot> findBookedOrLockedByDate(@Param("date") LocalDate date);
    
    // Find all slots across all services on a specific date (legacy fallback)
    List<TimeSlot> findByDate(LocalDate date);
}
