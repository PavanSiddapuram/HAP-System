package com.mykare.healthcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Response representing an available slot.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotResponse {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private String specialization;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
}
