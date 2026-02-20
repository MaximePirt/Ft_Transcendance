import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
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

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost/api'

async function applyTheme(themeName: string) {
  try {
    const res = await fetch(`/themes/styles/${themeName}.json`)
    const themeToApply = await res.json()

    const root = document.documentElement
    Object.entries(themeToApply.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })
  } catch (err) {
    console.error(`Erreur lors du chargement du theme "${themeName}"`, err)
    if (themeName !== 'default') return applyTheme('default')
  }
}

async function applyFont(fontName: string) {
  try {
    const res = await fetch(`/themes/fonts/${fontName}.json`)
    const themeToApply = await res.json()

    const root = document.documentElement
    Object.entries(themeToApply.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })
  } catch (err) {
    console.error(`Erreur lors du chargement de la police "${fontName}"`, err)
    if (fontName !== 'default') return applyFont('default')
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  const isViewingAnotherPublicProfile = (username: string) => {
    const path = window.location.pathname
    if (!path.startsWith('/profile/')) return false
    const routeUsername = decodeURIComponent(path.replace('/profile/', '').trim())
    if (!routeUsername) return false
    return routeUsername !== username
  }

  const applyPreferredLanguage = async (username: string) => {
    try {
      const userIdResponse = await fetch(`${API_BASE}/user/userid/${username}`)
      if (!userIdResponse.ok) return
      const { id } = await userIdResponse.json()

      const response = await fetch(`${API_BASE}/user/users/${id}`)
      if (!response.ok) return
      const userData = await response.json()

      if (userData?.preferredLanguage && userData.preferredLanguage !== i18n.language) {
        i18n.changeLanguage(userData.preferredLanguage)
        localStorage.setItem('language', userData.preferredLanguage)
      }

      if (userData?.theme) {
        localStorage.setItem('theme', userData.theme)
        await applyTheme(userData.theme)
      }

      if (userData?.font) {
        localStorage.setItem('font', userData.font)
        await applyFont(userData.font)
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
      if (parsed?.username && !isViewingAnotherPublicProfile(parsed.username)) {
        applyPreferredLanguage(parsed.username)
      }
    }
    setIsAuthReady(true)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const rawIdentifier = email.trim()
      const candidateUsernames = rawIdentifier.includes('@')
        ? [rawIdentifier, rawIdentifier.split('@')[0]]
        : [rawIdentifier]

      let signedIn = false
      for (const username of candidateUsernames) {
        const signinResponse = await fetch(`${API_BASE}/auth/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        })
        if (signinResponse.ok) {
          signedIn = true
          break
        }
      }

      if (!signedIn) {
        return false
      }

      const meResponse = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!meResponse.ok) {
        return false
      }

      const me = await meResponse.json()
      const userData = {
        email: me?.email || rawIdentifier,
        username: me?.username || candidateUsernames[candidateUsernames.length - 1],
      }

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
      const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, username, password }),
      })

      if (!signupResponse.ok) {
        return false
      }

      return await login(username, password)
    } catch (error) {
      console.error('Signup error:', error)
      return false
    }
  }

  const logout = () => {
    fetch(`${API_BASE}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    }).catch((error) => {
      console.warn('[Auth] signout request failed', error)
    })
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
