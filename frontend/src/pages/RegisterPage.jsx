import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Phone, Activity, AlertCircle, Check } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--danger)' }
    if (score <= 2) return { score: 2, label: 'Fair', color: 'var(--warning)' }
    if (score <= 3) return { score: 3, label: 'Good', color: 'var(--primary)' }
    return { score: 4, label: 'Strong', color: 'var(--success)' }
  }, [password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      await register(fullName, email, password, phone)
      navigate('/')
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="auth-card glass-card-static">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <Activity size={28} color="white" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join HealthCare Pro and manage your appointments</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <div className="form-input-wrapper">
              <User size={18} className="form-input-icon" />
              <input
                id="fullName"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div className="form-input-wrapper">
              <Mail size={18} className="form-input-icon" />
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="form-input-wrapper">
              <Phone size={18} className="form-input-icon" />
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="form-input-wrapper">
              <Lock size={18} className="form-input-icon" />
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {/* Password strength indicator */}
            {password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: 'var(--glass-border)', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength.score / 4) * 100}%`,
                    background: passwordStrength.color,
                    borderRadius: 2,
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <span style={{
                  fontSize: 'var(--font-xs)',
                  color: passwordStrength.color,
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
