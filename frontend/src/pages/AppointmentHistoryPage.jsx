import { useState, useEffect } from 'react'
import { getAppointments, cancelAppointment } from '../api/client'
import AppointmentCard from '../components/AppointmentCard'
import {
  ClipboardList,
  AlertCircle,
  X,
  Calendar
} from 'lucide-react'

const FILTER_TABS = ['All', 'Pending', 'Confirmed', 'Cancelled']

export default function AppointmentHistoryPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [error, setError] = useState('')

  // Cancel modal
  const [cancelId, setCancelId] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const data = await getAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = activeFilter === 'All'
    ? appointments
    : appointments.filter(a =>
        (a.status || '').toUpperCase() === activeFilter.toUpperCase()
      )

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.appointmentDate || a.slotDate || ''
    const dateB = b.appointmentDate || b.slotDate || ''
    return dateB.localeCompare(dateA)
  })

  const handleCancelRequest = (id) => {
    setCancelId(id)
  }

  const handleCancelConfirm = async () => {
    if (!cancelId) return
    setCancelling(true)
    setError('')
    try {
      await cancelAppointment(cancelId)
      // Update locally
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === cancelId ? { ...a, status: 'CANCELLED' } : a
        )
      )
      setCancelId(null)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to cancel appointment.'
      )
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="page-container">
      <div className="bg-orb bg-orb-1" />

      <div className="section-header">
        <h1>My Appointments</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="auth-error mb-lg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
            {!loading && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                ({tab === 'All'
                  ? appointments.length
                  : appointments.filter(a =>
                      (a.status || '').toUpperCase() === tab.toUpperCase()
                    ).length
                })
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="appointment-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 88 }} />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="appointment-list">
          {sorted.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={handleCancelRequest}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card-static empty-state">
          <div className="empty-state-icon">
            <Calendar size={32} />
          </div>
          <div className="empty-state-title">
            {activeFilter === 'All'
              ? 'No appointments found'
              : `No ${activeFilter.toLowerCase()} appointments`}
          </div>
          <div className="empty-state-description">
            {activeFilter === 'All'
              ? 'You haven\'t booked any appointments yet. Start by booking one!'
              : `You don't have any ${activeFilter.toLowerCase()} appointments at the moment.`}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelId && (
        <div className="modal-overlay" onClick={() => !cancelling && setCancelId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cancel Appointment</h3>
              <button
                className="modal-close"
                onClick={() => !cancelling && setCancelId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setCancelId(null)}
                disabled={cancelling}
              >
                Keep Appointment
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancelConfirm}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
