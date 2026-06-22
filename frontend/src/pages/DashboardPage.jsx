import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAppointments } from '../api/client'
import AppointmentCard from '../components/AppointmentCard'
import {
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  Plus,
  ClipboardList,
  Activity
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const data = await getAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const total = appointments.length
  const pending = appointments.filter(a => (a.status || '').toUpperCase() === 'PENDING').length
  const confirmed = appointments.filter(a => (a.status || '').toUpperCase() === 'CONFIRMED').length
  const cancelled = appointments.filter(a => (a.status || '').toUpperCase() === 'CANCELLED').length

  const recentAppointments = [...appointments]
    .sort((a, b) => {
      const dateA = a.appointmentDate || a.slotDate || ''
      const dateB = b.appointmentDate || b.slotDate || ''
      return dateB.localeCompare(dateA)
    })
    .slice(0, 5)

  const stats = [
    {
      label: 'Total Appointments',
      value: total,
      icon: CalendarDays,
      colorClass: 'primary'
    },
    {
      label: 'Pending',
      value: pending,
      icon: CalendarClock,
      colorClass: 'warning'
    },
    {
      label: 'Confirmed',
      value: confirmed,
      icon: CalendarCheck,
      colorClass: 'success'
    },
    {
      label: 'Cancelled',
      value: cancelled,
      icon: CalendarX2,
      colorClass: 'danger'
    }
  ]

  return (
    <div className="page-container">
      {/* Decorative */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Welcome */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          Good {getGreeting()},{' '}
          <span className="gradient-text">{user?.fullName || 'there'}</span> 👋
        </h1>
        <p className="welcome-subtitle">
          Here's an overview of your healthcare appointments
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 140 }} />
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="glass-card stat-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`stat-card-icon ${stat.colorClass}`}>
                <stat.icon size={22} />
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions mb-xl">
        <button
          className="btn btn-primary"
          onClick={() => navigate('/book')}
        >
          <Plus size={18} />
          Book New Appointment
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/appointments')}
        >
          <ClipboardList size={18} />
          View All Appointments
        </button>
      </div>

      {/* Recent Appointments */}
      <div className="section-header">
        <h2 className="section-title">Recent Appointments</h2>
      </div>

      {loading ? (
        <div className="appointment-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 88 }} />
          ))}
        </div>
      ) : recentAppointments.length > 0 ? (
        <div className="appointment-list">
          {recentAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card-static empty-state">
          <div className="empty-state-icon">
            <Activity size={32} />
          </div>
          <div className="empty-state-title">No appointments yet</div>
          <div className="empty-state-description">
            Get started by booking your first appointment with a healthcare professional.
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/book')}>
            <Plus size={18} />
            Book Appointment
          </button>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
