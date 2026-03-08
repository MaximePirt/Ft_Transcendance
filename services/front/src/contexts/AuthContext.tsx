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

// @ts-ignore
const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost/api'

async function applyTheme(themeName: string, signal?: AbortSignal) {
	try {
		const res = await fetch(`/themes/styles/${themeName}.json`, { signal })
		const themeToApply = await res.json()

		const root = document.documentElement
		Object.entries(themeToApply.variables).forEach(([key, value]) => {
			root.style.setProperty(key, value as string)
		})
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') return
		console.error(`Erreur lors du chargement du theme "${themeName}"`, err)
		if (themeName !== 'default') return applyTheme('default', signal)
	}
}

async function applyFont(fontName: string, signal?: AbortSignal) {
	try {
		const res = await fetch(`/themes/fonts/${fontName}.json`, { signal })
		const themeToApply = await res.json()

		const root = document.documentElement
		Object.entries(themeToApply.variables).forEach(([key, value]) => {
			root.style.setProperty(key, value as string)
		})
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') return
		console.error(`Erreur lors du chargement de la police "${fontName}"`, err)
		if (fontName !== 'default') return applyFont('default', signal)
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isAuthReady, setIsAuthReady] = useState(false)

	const applyPreferredLanguage = async (username: string, signal?: AbortSignal) => {
		try {
			const userIdResponse = await fetch(`${API_BASE}/user/userid/${username}`, { signal })
			if (!userIdResponse.ok) return
			const { id } = await userIdResponse.json()

			const response = await fetch(`${API_BASE}/user/users/${id}`, { signal })
			if (!response.ok) return
			const userData = await response.json()

			if (userData?.preferredLanguage && userData.preferredLanguage !== i18n.language) {
				i18n.changeLanguage(userData.preferredLanguage)
				localStorage.setItem('language', userData.preferredLanguage)
			}

			if (userData?.theme) {
				localStorage.setItem('theme', userData.theme)
				await applyTheme(userData.theme, signal)
			}

			if (userData?.font) {
				localStorage.setItem('font', userData.font)
				await applyFont(userData.font, signal)
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return
			if (error instanceof TypeError) return
			console.warn('[Auth] failed to apply preferred language', error)
		}
	}

	useEffect(() => {
		const abortController = new AbortController()
		const storedUserRaw = localStorage.getItem('user')
		let storedUser: User | null = null

		if (storedUserRaw) {
			try {
				storedUser = JSON.parse(storedUserRaw)
			} catch {
				storedUser = null
			}
		}

		const bootstrapAuth = async () => {
			try {
				const meResponse = await fetch(`${API_BASE}/auth/me`, {
					method: 'GET',
					credentials: 'include',
					signal: abortController.signal,
				})

				if (meResponse.ok) {
					const me = await meResponse.json()
					const userData = {
						email: me?.email || '',
						username: me?.username || '',
					}
					if (userData.username) {
						setUser(userData)
						localStorage.setItem('user', JSON.stringify(userData))
						await applyPreferredLanguage(userData.username, abortController.signal)
					}
				} else if (meResponse.status === 401 || meResponse.status === 403) {
					setUser(null)
					localStorage.removeItem('user')
				} else if (storedUser?.username) {
					setUser(storedUser)
				}
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') return
				if (storedUser?.username) {
					setUser(storedUser)
				} else {
					setUser(null)
					localStorage.removeItem('user')
				}
			} finally {
				setIsAuthReady(true)
			}
		}

		void bootstrapAuth()
		return () => abortController.abort()
	}, [])

	const login = async (email: string, username: string): Promise<boolean> => {
		const rawIdentifier = email.trim()
		const candidateUsernames = rawIdentifier.includes('@')
			? [rawIdentifier, rawIdentifier.split('@')[0]]
			: [rawIdentifier]

		// let signedIn = false
		// for (const username of candidateUsernames) {
		// 	const signinResponse = await fetch(`${API_BASE}/auth/signin`, {
		// 		method: 'POST',
		// 		headers: {
		// 			'Content-Type': 'application/json',
		// 		},
		// 		credentials: 'include',
		// 		body: JSON.stringify({ username, password }),
		// 	})
		// 	if (signinResponse.ok) {
		// 		signedIn = true
		// 		break
		// 	}
		// }
		//
		// if (!signedIn) {
		// 	return false
		// }

		// const meResponse = await fetch(`${API_BASE}/auth/me`, {
		// 	method: 'GET',
		// 	credentials: 'include',
		// })
		//
		// if (!meResponse.ok) {
		// 	return false
		// }

		// const me = await meResponse.json()
		const userData = {
			email: email || rawIdentifier,
			username: username || candidateUsernames[candidateUsernames.length - 1],
		}

		setUser(userData)
		localStorage.setItem('user', JSON.stringify(userData))
		setIsAuthReady(true)
		await applyPreferredLanguage(username)
		return true
	}

	const signup = async (email: string, username: string): Promise<boolean> => {
		try {
			return await login(email, username);
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return false
			console.error('Signup error:', error)
			return false
		}
	}

	const logout = () => {
		setUser(null)
		localStorage.removeItem('user')
		localStorage.setItem('theme', 'default')
		localStorage.setItem('font', 'default')
		localStorage.setItem('auth-event', Date.now().toString())
		applyTheme('default')
		applyFont('default')
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
