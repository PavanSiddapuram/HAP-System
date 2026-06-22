package com.mykare.healthcare.service;

import com.mykare.healthcare.dto.request.BookAppointmentRequest;
import com.mykare.healthcare.dto.response.AppointmentDetailResponse;
import com.mykare.healthcare.dto.response.AppointmentLogResponse;
import com.mykare.healthcare.dto.response.AppointmentResponse;
import com.mykare.healthcare.entity.*;
import com.mykare.healthcare.entity.enums.AppointmentStatus;
import com.mykare.healthcare.exception.BadRequestException;
import com.mykare.healthcare.exception.ConflictException;
import com.mykare.healthcare.exception.ResourceNotFoundException;
import com.mykare.healthcare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Core appointment booking, cancellation, and retrieval logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final SlotRepository slotRepository;
    private final UserRepository userRepository;
    private final AppointmentLogRepository appointmentLogRepository;
    private final EventPublisherService eventPublisherService;

    /**
     * Book a new appointment with pessimistic locking on the slot to prevent double-booking.
     */
    @Transactional
    public AppointmentResponse bookAppointment(Long userId, BookAppointmentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Acquire a pessimistic write lock on the slot
        Slot slot = slotRepository.findByIdWithLock(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Slot not found with id: " + request.getSlotId()));

        if (Boolean.TRUE.equals(slot.getIsBooked())) {
            throw new ConflictException("This slot is already booked. Please choose another slot.");
        }

        // Mark the slot as booked
        slot.setIsBooked(true);
        slotRepository.save(slot);

        // Create the appointment
        Appointment appointment = Appointment.builder()
                .user(user)
                .slot(slot)
                .doctor(slot.getDoctor())
                .status(AppointmentStatus.PENDING)
                .notes(request.getNotes())
                .build();
        appointmentRepository.save(appointment);

        // Create audit log
        AppointmentLog logEntry = AppointmentLog.builder()
                .appointment(appointment)
                .previousStatus(null)
                .newStatus(AppointmentStatus.PENDING.name())
                .message("Appointment created")
                .build();
        appointmentLogRepository.save(logEntry);

        // Publish event (after transaction commits to avoid DB race condition with worker)
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisherService.publishAppointmentCreated(appointment);
                }
            });
        } else {
            eventPublisherService.publishAppointmentCreated(appointment);
        }

        log.info("Appointment booked: id={}, userId={}, slotId={}",
                appointment.getId(), userId, slot.getId());

        return toAppointmentResponse(appointment);
    }

    /**
     * Cancel an existing appointment, releasing the slot for rebooking.
     */
    @Transactional
    public AppointmentResponse cancelAppointment(Long userId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + appointmentId));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Appointment is already cancelled");
        }

        String previousStatus = appointment.getStatus().name();
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);

        // Release the slot
        Slot slot = appointment.getSlot();
        slot.setIsBooked(false);
        slotRepository.save(slot);

        // Create audit log
        AppointmentLog logEntry = AppointmentLog.builder()
                .appointment(appointment)
                .previousStatus(previousStatus)
                .newStatus(AppointmentStatus.CANCELLED.name())
                .message("Appointment cancelled by user")
                .build();
        appointmentLogRepository.save(logEntry);

        // Publish event (after transaction commits to avoid DB race condition with worker)
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisherService.publishAppointmentCancelled(appointment);
                }
            });
        } else {
            eventPublisherService.publishAppointmentCancelled(appointment);
        }

        log.info("Appointment cancelled: id={}, userId={}", appointmentId, userId);

        return toAppointmentResponse(appointment);
    }

    /**
     * Get all appointments for a user, ordered by creation date descending.
     */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUserAppointments(Long userId) {
        return appointmentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toAppointmentResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get detailed appointment info including audit logs.
     */
    @Transactional(readOnly = true)
    public AppointmentDetailResponse getAppointmentDetails(Long userId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + appointmentId));

        List<AppointmentLogResponse> logs = appointmentLogRepository
                .findByAppointmentIdOrderByTimestampDesc(appointmentId)
                .stream()
                .map(this::toLogResponse)
                .collect(Collectors.toList());

        return AppointmentDetailResponse.builder()
                .id(appointment.getId())
                .doctorName(appointment.getDoctor().getName())
                .specialization(appointment.getDoctor().getSpecialization())
                .slotDate(appointment.getSlot().getSlotDate())
                .startTime(appointment.getSlot().getStartTime())
                .endTime(appointment.getSlot().getEndTime())
                .status(appointment.getStatus().name())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .logs(logs)
                .build();
    }

    private AppointmentResponse toAppointmentResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .doctorName(appointment.getDoctor().getName())
                .specialization(appointment.getDoctor().getSpecialization())
                .slotDate(appointment.getSlot().getSlotDate())
                .startTime(appointment.getSlot().getStartTime())
                .endTime(appointment.getSlot().getEndTime())
                .status(appointment.getStatus().name())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .build();
    }

    private AppointmentLogResponse toLogResponse(AppointmentLog log) {
        return AppointmentLogResponse.builder()
                .id(log.getId())
                .previousStatus(log.getPreviousStatus())
                .newStatus(log.getNewStatus())
                .message(log.getMessage())
                .timestamp(log.getTimestamp())
                .build();
    }
}
