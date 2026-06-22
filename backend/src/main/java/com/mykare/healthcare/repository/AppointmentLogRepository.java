package com.mykare.healthcare.repository;

import com.mykare.healthcare.entity.AppointmentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentLogRepository extends JpaRepository<AppointmentLog, Long> {

    List<AppointmentLog> findByAppointmentIdOrderByTimestampDesc(Long appointmentId);
}
