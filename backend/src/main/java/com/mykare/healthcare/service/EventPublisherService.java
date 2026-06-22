package com.mykare.healthcare.service;

import com.mykare.healthcare.config.RabbitMQConfig;
import com.mykare.healthcare.entity.Appointment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Publishes appointment lifecycle events to RabbitMQ.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publish an event when a new appointment is created.
     */
    public void publishAppointmentCreated(Appointment appointment) {
        Map<String, Object> event = buildEventPayload(appointment);
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.CREATED_ROUTING_KEY,
                    event);
            log.info("Published appointment.created event for appointmentId={}",
                    appointment.getId());
        } catch (Exception e) {
            log.error("Failed to publish appointment.created event for appointmentId={}: {}",
                    appointment.getId(), e.getMessage());
        }
    }

    /**
     * Publish an event when an appointment is cancelled.
     */
    public void publishAppointmentCancelled(Appointment appointment) {
        Map<String, Object> event = buildEventPayload(appointment);
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.CANCELLED_ROUTING_KEY,
                    event);
            log.info("Published appointment.cancelled event for appointmentId={}",
                    appointment.getId());
        } catch (Exception e) {
            log.error("Failed to publish appointment.cancelled event for appointmentId={}: {}",
                    appointment.getId(), e.getMessage());
        }
    }

    private Map<String, Object> buildEventPayload(Appointment appointment) {
        Map<String, Object> event = new HashMap<>();
        event.put("appointmentId", appointment.getId());
        event.put("userId", appointment.getUser().getId());
        event.put("userEmail", appointment.getUser().getEmail());
        event.put("userName", appointment.getUser().getFullName());
        event.put("doctorName", appointment.getDoctor().getName());
        event.put("slotDate", appointment.getSlot().getSlotDate().toString());
        event.put("startTime", appointment.getSlot().getStartTime().toString());
        event.put("endTime", appointment.getSlot().getEndTime().toString());
        event.put("status", appointment.getStatus().name());
        return event;
    }
}
