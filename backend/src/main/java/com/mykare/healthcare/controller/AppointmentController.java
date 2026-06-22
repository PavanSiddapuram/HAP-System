package com.mykare.healthcare.controller;

import com.mykare.healthcare.dto.request.BookAppointmentRequest;
import com.mykare.healthcare.dto.response.AppointmentDetailResponse;
import com.mykare.healthcare.dto.response.AppointmentResponse;
import com.mykare.healthcare.entity.User;
import com.mykare.healthcare.exception.ResourceNotFoundException;
import com.mykare.healthcare.repository.UserRepository;
import com.mykare.healthcare.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints for booking, listing, viewing, and cancelling appointments.
 */
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Appointment management")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Book a new appointment")
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @Valid @RequestBody BookAppointmentRequest request,
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);
        AppointmentResponse response = appointmentService.bookAppointment(userId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List all appointments for the authenticated user")
    public ResponseEntity<List<AppointmentResponse>> getUserAppointments(
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);
        List<AppointmentResponse> appointments = appointmentService.getUserAppointments(userId);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment details including audit logs")
    public ResponseEntity<AppointmentDetailResponse> getAppointmentDetails(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);
        AppointmentDetailResponse details = appointmentService.getAppointmentDetails(userId, id);
        return ResponseEntity.ok(details);
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);
        AppointmentResponse response = appointmentService.cancelAppointment(userId, id);
        return ResponseEntity.ok(response);
    }

    /**
     * Resolve the currently authenticated user's database ID from the security principal.
     */
    private Long getAuthenticatedUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }
}
