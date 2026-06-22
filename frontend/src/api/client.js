import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor — attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hcp_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 unauthorized
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hcp_token')
      localStorage.removeItem('hcp_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth API ────────────────────────────────────────────────────────────

export async function login(email, password) {
  const response = await client.post('/auth/login', { email, password })
  return response.data
}

export async function register(fullName, email, password, phone) {
  const response = await client.post('/auth/register', {
    fullName,
    email,
    password,
    phone
  })
  return response.data
}

// ── Doctors API ─────────────────────────────────────────────────────────

export async function getDoctors() {
  const response = await client.get('/doctors')
  return response.data
}

// ── Slots API ───────────────────────────────────────────────────────────

export async function getSlots(date, doctorId) {
  const params = { date }
  if (doctorId) params.doctorId = doctorId
  const response = await client.get('/slots', { params })
  return response.data
}

// ── Appointments API ────────────────────────────────────────────────────

export async function bookAppointment(slotId, notes) {
  const response = await client.post('/appointments', { slotId, notes })
  return response.data
}

export async function getAppointments() {
  const response = await client.get('/appointments')
  return response.data
}

export async function getAppointmentDetails(id) {
  const response = await client.get(`/appointments/${id}`)
  return response.data
}

export async function cancelAppointment(id) {
  const response = await client.put(`/appointments/${id}/cancel`)
  return response.data
}

export default client
