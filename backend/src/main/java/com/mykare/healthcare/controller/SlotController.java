package com.mykare.healthcare.controller;

import com.mykare.healthcare.dto.response.SlotResponse;
import com.mykare.healthcare.service.SlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Endpoint for querying available appointment slots.
 */
@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
@Tag(name = "Slots", description = "Available slot lookup")
public class SlotController {

    private final SlotService slotService;

    @GetMapping
    @Operation(summary = "Get available slots for a date, optionally filtered by doctor")
    public ResponseEntity<List<SlotResponse>> getAvailableSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId) {

        List<SlotResponse> slots = slotService.getAvailableSlots(date, doctorId);
        return ResponseEntity.ok(slots);
    }
}
