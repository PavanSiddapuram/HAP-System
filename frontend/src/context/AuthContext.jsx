import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('hcp_user')
      const storedToken = localStorage.getItem('hcp_token')
      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser)
        setUser({ ...parsed, token: storedToken })
      }
    } catch {
      localStorage.removeItem('hcp_user')
      localStorage.removeItem('hcp_token')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    const token = data.token
    const userData = {
      email: data.email || email,
      fullName: data.fullName || data.name || email.split('@')[0]
    }
    localStorage.setItem('hcp_token', token)
    localStorage.setItem('hcp_user', JSON.stringify(userData))
    setUser({ ...userData, token })
    return data
  }, [])

  const register = useCallback(async (fullName, email, password, phone) => {
    const data = await apiRegister(fullName, email, password, phone)
    const token = data.token
    const userData = {
      email: data.email || email,
      fullName: data.fullName || fullName
    }
    localStorage.setItem('hcp_token', token)
    localStorage.setItem('hcp_user', JSON.stringify(userData))
    setUser({ ...userData, token })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hcp_token')
    localStorage.removeItem('hcp_user')
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
