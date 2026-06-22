import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Heart,
  Activity,
  LayoutDashboard,
  CalendarPlus,
  ClipboardList,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand" onClick={closeMobile}>
          <div className="navbar-brand-icon">
            <Activity size={20} />
          </div>
          <span>HealthCare<span className="gradient-text"> Pro</span></span>
        </NavLink>

        {/* Desktop Nav */}
        <div className={`navbar-nav ${mobileOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink
            to="/book"
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <CalendarPlus size={18} />
            Book Appointment
          </NavLink>
          <NavLink
            to="/appointments"
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <ClipboardList size={18} />
            My Appointments
          </NavLink>
        </div>

        {/* User section */}
        <div className="navbar-user">
          <div className="navbar-greeting">
            Hello, <strong>{user?.fullName || 'User'}</strong>
          </div>
          <button className="navbar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
