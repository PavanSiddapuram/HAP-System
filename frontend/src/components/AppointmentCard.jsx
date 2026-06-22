import { Calendar, Clock, Stethoscope, X, FileText } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function AppointmentCard({ appointment, onCancel }) {
  const {
    id,
    doctorName,
    doctorSpecialization,
    appointmentDate,
    startTime,
    endTime,
    status,
    notes,
    slotDate,
    slotStartTime,
    slotEndTime
  } = appointment

  const displayDate = appointmentDate || slotDate || 'N/A'
  const displayStart = startTime || slotStartTime || ''
  const displayEnd = endTime || slotEndTime || ''
  const displayDoctor = doctorName || appointment.doctor?.name || 'Doctor'
  const displaySpec = doctorSpecialization || appointment.doctor?.specialization || ''
  const normalizedStatus = (status || 'PENDING').toUpperCase()
  const canCancel = normalizedStatus === 'PENDING' || normalizedStatus === 'CONFIRMED'

  const formatTime = (time) => {
    if (!time) return ''
    // Handle HH:mm:ss or HH:mm
    const parts = time.split(':')
    const h = parseInt(parts[0], 10)
    const m = parts[1] || '00'
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  return (
    <div className="glass-card appointment-card">
      {/* Icon */}
      <div className="appointment-card-icon">
        <Stethoscope size={22} />
      </div>

      {/* Body */}
      <div className="appointment-card-body">
        <div className="appointment-card-doctor">{displayDoctor}</div>
        {displaySpec && (
          <div className="appointment-card-detail" style={{ marginBottom: 4 }}>
            <span style={{ color: 'var(--text-tertiary)' }}>{displaySpec}</span>
          </div>
        )}
        <div className="appointment-card-detail">
          <span>
            <Calendar size={14} />
            {displayDate}
          </span>
          {displayStart && (
            <>
              <span className="detail-separator">•</span>
              <span>
                <Clock size={14} />
                {formatTime(displayStart)}
                {displayEnd ? ` – ${formatTime(displayEnd)}` : ''}
              </span>
            </>
          )}
        </div>
        {notes && (
          <div className="appointment-card-notes">
            <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
            {notes}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="appointment-card-actions">
        <StatusBadge status={normalizedStatus} />
        {canCancel && onCancel && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              onCancel(id)
            }}
            title="Cancel appointment"
          >
            <X size={14} />
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
