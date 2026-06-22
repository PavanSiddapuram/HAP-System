package com.mykare.healthcare.repository;

import com.mykare.healthcare.entity.Slot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {

    /**
     * Fetch available (unbooked) slots for a given date, optionally filtered by doctor.
     */
    @Query("SELECT s FROM Slot s JOIN FETCH s.doctor d " +
           "WHERE s.slotDate = :date AND s.isBooked = false " +
           "AND (:doctorId IS NULL OR d.id = :doctorId) " +
           "ORDER BY d.name, s.startTime")
    List<Slot> findAvailableSlots(@Param("date") LocalDate date,
                                  @Param("doctorId") Long doctorId);

    /**
     * Acquire a pessimistic write lock on a slot for safe concurrent booking.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Slot s WHERE s.id = :id")
    Optional<Slot> findByIdWithLock(@Param("id") Long id);
}
