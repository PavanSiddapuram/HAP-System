import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDoctors, getSlots, bookAppointment, getAppointmentDetails } from '../api/client'
import SlotPicker from '../components/SlotPicker'
import EventStatusTracker from '../components/EventStatusTracker'
import {
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react'

const BOOKING_STEPS = ['Select Doctor', 'Choose Date', 'Pick Time', 'Confirm']

export default function BookAppointmentPage() {
  const navigate = useNavigate()

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(0)

  // Step 1 — doctors
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorsLoading, setDoctorsLoading] = useState(true)

  // Step 2 — date
  const [selectedDate, setSelectedDate] = useState('')

  // Step 3 — slots
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Step 4 — notes & confirm
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  // Post-booking tracking
  const [showTracker, setShowTracker] = useState(false)
  const [trackerStep, setTrackerStep] = useState(0)
  const [trackerStatus, setTrackerStatus] = useState('active')
  const [bookedAppointmentId, setBookedAppointmentId] = useState(null)

  // Load doctors
  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      const data = await getDoctors()
      setDoctors(Array.isArray(data) ? data : [])
    } catch {
      setDoctors([])
    } finally {
      setDoctorsLoading(false)
    }
  }

  // Load slots when date or doctor changes
  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      loadSlots()
    }
  }, [selectedDate, selectedDoctor])

  const loadSlots = async () => {
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const data = await getSlots(selectedDate, selectedDoctor.id)
      setSlots(Array.isArray(data) ? data : [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0]

  // Navigate steps
  const canGoNext = () => {
    switch (currentStep) {
      case 0: return !!selectedDoctor
      case 1: return !!selectedDate
      case 2: return !!selectedSlot
      case 3: return true
      default: return false
    }
  }

  const goNext = () => {
    if (canGoNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1)
      setError('')
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  // Book appointment
  const handleBook = async () => {
    if (!selectedSlot) return
    setBooking(true)
    setError('')

    try {
      // Step 1 — booking
      setShowTracker(true)
      setTrackerStep(0)
      setTrackerStatus('active')

      const result = await bookAppointment(selectedSlot.id, notes)
      const appointmentId = result?.id || result?.appointmentId

      // Step 2 — event published
      setTrackerStep(1)

      if (appointmentId) {
        setBookedAppointmentId(appointmentId)
      }

      // Step 3 — processing (simulated delay)
      setTimeout(() => {
        setTrackerStep(2)
      }, 1500)

      // Step 4 — confirmed (poll or simulate)
      setTimeout(() => {
        setTrackerStep(3)
        setTrackerStatus('done')
        setBooking(false)

        // Try polling for confirmed status
        if (appointmentId) {
          pollForConfirmation(appointmentId)
        }
      }, 3500)
    } catch (err) {
      setShowTracker(false)
      setBooking(false)
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to book appointment. Please try again.'
      setError(message)
    }
  }

  const pollForConfirmation = async (id) => {
    try {
      // Short poll — just one attempt after a delay
      setTimeout(async () => {
        try {
          const details = await getAppointmentDetails(id)
          if (details?.status?.toUpperCase() === 'CONFIRMED') {
            setTrackerStep(3)
            setTrackerStatus('done')
          }
        } catch {
          // Silent fail on polling
        }
      }, 2000)
    } catch {
      // Ignore
    }
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

  // Render booking complete
  if (showTracker) {
    return (
      <div className="page-container">
        <div className="bg-orb bg-orb-1" />

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ marginBottom: 'var(--space-sm)' }}>
            {trackerStatus === 'done' ? (
              <span className="gradient-text">Appointment Booked! 🎉</span>
            ) : (
              'Booking in progress...'
            )}
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }}>
            {trackerStatus === 'done'
              ? 'Your appointment has been successfully processed'
              : 'Please wait while we process your appointment'}
          </p>
        </div>

        <EventStatusTracker currentStep={trackerStep} status={trackerStatus} />

        {/* Summary card */}
        <div className="glass-card-static mt-xl" style={{ maxWidth: 500, margin: '32px auto 0' }}>
          <h4 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-base)' }}>
            Appointment Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Doctor</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {selectedDoctor?.name || selectedDoctor?.fullName || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Date</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Time</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {formatTime(selectedSlot?.startTime || selectedSlot?.start)} – {formatTime(selectedSlot?.endTime || selectedSlot?.end)}
              </span>
            </div>
            {notes && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Notes</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 200, textAlign: 'right' }}>
                  {notes}
                </span>
              </div>
            )}
          </div>
        </div>

        {trackerStatus === 'done' && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/appointments')}>
              View My Appointments
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="bg-orb bg-orb-1" />

      <h1 style={{ marginBottom: 'var(--space-sm)' }}>Book Appointment</h1>
      <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
        Follow the steps below to schedule your appointment
      </p>

      {/* Step Indicator */}
      <div className="step-indicator">
        {BOOKING_STEPS.map((label, index) => (
          <div key={label} className="step-item">
            <div
              className={`step-circle ${
                index < currentStep ? 'completed' : index === currentStep ? 'active' : ''
              }`}
            >
              {index < currentStep ? <Check size={16} strokeWidth={3} /> : index + 1}
            </div>
            {index < BOOKING_STEPS.length - 1 && (
              <div className={`step-line ${index < currentStep ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="auth-error mb-lg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="booking-step-content" key={currentStep}>
        {/* Step 1 — Select Doctor */}
        {currentStep === 0 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>
              <Stethoscope size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Select a Doctor
            </h3>
            {doctorsLoading ? (
              <div className="doctor-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton skeleton-card" style={{ height: 160 }} />
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="doctor-grid">
                {doctors.map((doctor) => {
                  const isSelected = selectedDoctor?.id === doctor.id
                  const displayName = doctor.name || doctor.fullName || 'Doctor'
                  const initials = displayName
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <div
                      key={doctor.id}
                      className={`doctor-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className="doctor-avatar">{initials}</div>
                      <div className="doctor-name">{displayName}</div>
                      {(doctor.specialization || doctor.specialty) && (
                        <div className="doctor-specialization">
                          <Stethoscope size={14} />
                          {doctor.specialization || doctor.specialty}
                        </div>
                      )}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Check size={14} color="white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="glass-card-static empty-state">
                <div className="empty-state-icon">
                  <Stethoscope size={32} />
                </div>
                <div className="empty-state-title">No doctors available</div>
                <div className="empty-state-description">
                  No doctors are currently registered in the system.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Select Date */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>
              <Calendar size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Choose a Date
            </h3>
            <div className="glass-card-static" style={{ maxWidth: 400 }}>
              <div className="form-group">
                <label className="form-label">Appointment Date</label>
                <input
                  type="date"
                  className="form-input no-icon"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  style={{
                    colorScheme: 'dark',
                    cursor: 'pointer'
                  }}
                />
              </div>
              {selectedDoctor && (
                <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
                  Showing availability for <strong style={{ color: 'var(--primary)' }}>
                    {selectedDoctor.name || selectedDoctor.fullName}
                  </strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Pick Time */}
        {currentStep === 2 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>
              <Clock size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Pick a Time Slot
            </h3>
            <p style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
              Available slots for <strong style={{ color: 'var(--text-primary)' }}>{selectedDate}</strong>
            </p>
            {slotsLoading ? (
              <div className="slot-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : (
              <SlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
              />
            )}
          </div>
        )}

        {/* Step 4 — Confirm */}
        {currentStep === 3 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>
              <FileText size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Review & Confirm
            </h3>

            {/* Summary */}
            <div className="glass-card-static" style={{ marginBottom: 'var(--space-lg)' }}>
              <h4 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-base)' }}>
                Appointment Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stethoscope size={14} /> Doctor
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {selectedDoctor?.name || selectedDoctor?.fullName}
                  </span>
                </div>
                {(selectedDoctor?.specialization || selectedDoctor?.specialty) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Specialization</span>
                    <span style={{ fontWeight: 500 }}>
                      {selectedDoctor.specialization || selectedDoctor.specialty}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> Date
                  </span>
                  <span style={{ fontWeight: 500 }}>{selectedDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} /> Time
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {formatTime(selectedSlot?.startTime || selectedSlot?.start)} – {formatTime(selectedSlot?.endTime || selectedSlot?.end)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label">
                Additional Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Any symptoms, concerns, or information for the doctor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleBook}
              disabled={booking}
            >
              {booking ? (
                <>
                  <span className="spinner spinner-sm" />
                  Booking...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="booking-navigation">
        <button
          className="btn btn-ghost"
          onClick={goBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {currentStep < 3 && (
          <button
            className="btn btn-primary"
            onClick={goNext}
            disabled={!canGoNext()}
          >
            Next
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
