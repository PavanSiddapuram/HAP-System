package com.mykare.healthcare.service;

import com.mykare.healthcare.dto.response.SlotResponse;
import com.mykare.healthcare.entity.Slot;
import com.mykare.healthcare.repository.SlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Provides available slot lookup with optional doctor filtering.
 */
@Service
@RequiredArgsConstructor
public class SlotService {

    private final SlotRepository slotRepository;

    /**
     * Return all unbooked slots for a given date, optionally filtered by doctor.
     */
    @Transactional(readOnly = true)
    public List<SlotResponse> getAvailableSlots(LocalDate date, Long doctorId) {
        List<Slot> slots = slotRepository.findAvailableSlots(date, doctorId);
        return slots.stream()
                .map(this::toSlotResponse)
                .collect(Collectors.toList());
    }

    private SlotResponse toSlotResponse(Slot slot) {
        return SlotResponse.builder()
                .id(slot.getId())
                .doctorId(slot.getDoctor().getId())
                .doctorName(slot.getDoctor().getName())
                .specialization(slot.getDoctor().getSpecialization())
                .slotDate(slot.getSlotDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .build();
    }
}
