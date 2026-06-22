package com.mykare.healthcare.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a doctor available for appointments.
 */
@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String specialization;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
