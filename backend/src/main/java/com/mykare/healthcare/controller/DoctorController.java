package com.mykare.healthcare.controller;

import com.mykare.healthcare.dto.response.DoctorResponse;
import com.mykare.healthcare.entity.Doctor;
import com.mykare.healthcare.repository.DoctorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Endpoint for listing active doctors.
 */
@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Doctor listing")
public class DoctorController {

    private final DoctorRepository doctorRepository;

    @GetMapping
    @Operation(summary = "List all active doctors")
    public ResponseEntity<List<DoctorResponse>> getAllActiveDoctors() {
        List<DoctorResponse> doctors = doctorRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(doctors);
    }

    private DoctorResponse toResponse(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .specialization(doctor.getSpecialization())
                .build();
    }
}
