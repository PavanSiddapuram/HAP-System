package com.mykare.healthcare.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for booking an appointment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookAppointmentRequest {

    @NotNull(message = "Slot ID is required")
    private Long slotId;

    private String notes;
}
