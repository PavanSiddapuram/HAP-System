package com.mykare.healthcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response representing a single audit log entry.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentLogResponse {
    private Long id;
    private String previousStatus;
    private String newStatus;
    private String message;
    private LocalDateTime timestamp;
}
