package com.mykare.healthcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Detailed appointment response including audit log history.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentDetailResponse {
    private Long id;
    private String doctorName;
    private String specialization;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AppointmentLogResponse> logs;
}
