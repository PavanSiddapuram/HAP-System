import { Clock } from 'lucide-react'

export default function SlotPicker({ slots = [], selectedSlot, onSelect }) {
  if (!slots || slots.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
        <div className="empty-state-icon">
          <Clock size={32} />
        </div>
        <div className="empty-state-title">No slots available</div>
        <div className="empty-state-description">
          No time slots are available for the selected date and doctor. Please try a different date.
        </div>
      </div>
    )
  }

  const formatTime = (time) => {
    if (!time) return ''
    const parts = time.split(':')
    const h = parseInt(parts[0], 10)
    const m = parts[1] || '00'
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  return (
    <div className="slot-grid">
      {slots.map((slot) => {
        const isSelected = selectedSlot && (selectedSlot.id === slot.id)
        const isBooked = slot.booked || slot.isBooked
        const startTime = slot.startTime || slot.start
        const endTime = slot.endTime || slot.end

        return (
          <div
            key={slot.id}
            className={`slot-card ${isSelected ? 'selected' : ''} ${isBooked ? 'slot-disabled' : ''}`}
            onClick={() => {
              if (!isBooked) onSelect(slot)
            }}
            role="button"
            tabIndex={isBooked ? -1 : 0}
            aria-label={`Time slot ${formatTime(startTime)} to ${formatTime(endTime)}${isBooked ? ' (unavailable)' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!isBooked) onSelect(slot)
              }
            }}
          >
            <div className="slot-time">
              {formatTime(startTime)}
            </div>
            <div className="slot-label">
              {isBooked ? 'Booked' : `to ${formatTime(endTime)}`}
            </div>
          </div>
        )
      })}
    </div>
  )
}
