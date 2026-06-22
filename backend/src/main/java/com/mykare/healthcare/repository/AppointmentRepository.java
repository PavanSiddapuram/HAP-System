package com.mykare.healthcare.repository;

import com.mykare.healthcare.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.slot s JOIN FETCH a.doctor d JOIN FETCH a.user u " +
           "WHERE u.id = :userId ORDER BY a.createdAt DESC")
    List<Appointment> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.slot s JOIN FETCH a.doctor d JOIN FETCH a.user u " +
           "WHERE a.id = :id AND u.id = :userId")
    Optional<Appointment> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
