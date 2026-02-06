import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import i18n from '../i18n'

interface User {
  email: string
  username: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isAuthReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  const applyPreferredLanguage = async (username: string) => {
    try {
      const userIdResponse = await fetch(`${API_BASE}/userid/${username}`)
      if (!userIdResponse.ok) return
      const { id } = await userIdResponse.json()

      const response = await fetch(`${API_BASE}/users/${id}`)
      if (!response.ok) return
      const userData = await response.json()

      if (userData?.preferredLanguage && userData.preferredLanguage !== i18n.language) {
        i18n.changeLanguage(userData.preferredLanguage)
        localStorage.setItem('language', userData.preferredLanguage)
      }
    } catch (error) {
      console.warn('[Auth] failed to apply preferred language', error)
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUser(parsed)
      if (parsed?.username) {
        applyPreferredLanguage(parsed.username)
      }
    }
    setIsAuthReady(true)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userData = { email, username: email.split('@')[0] }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      setIsAuthReady(true)
      await applyPreferredLanguage(userData.username)
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const signup = async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      const userData = { email, username }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      setIsAuthReady(true)
      await applyPreferredLanguage(userData.username)
      return true
    } catch (error) {
      console.error('Signup error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
