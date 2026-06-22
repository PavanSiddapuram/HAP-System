package com.mykare.healthcare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a notification sent for an appointment event.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String recipient;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime sentAt;
}
