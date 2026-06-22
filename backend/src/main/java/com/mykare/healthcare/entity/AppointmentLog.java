package com.mykare.healthcare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Audit log recording every status change on an appointment.
 */
@Entity
@Table(name = "appointment_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    private String previousStatus;

    private String newStatus;

    private String message;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
