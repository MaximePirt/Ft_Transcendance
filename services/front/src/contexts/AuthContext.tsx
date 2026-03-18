import { createContext, useContext, useState, useEffect, useRef } from 'react'
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
	logout: () => Promise<void>
	updateUser: (patch: Partial<User>) => void
	isAuthenticated: boolean
	isAuthReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// @ts-ignore
const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost/api'

async function applyTheme(themeName: string, signal?: AbortSignal, isRetry = false) {
	try {
		const res = await fetch(`/themes/styles/${themeName}.json`, { signal })
		if (!res.ok) {
			if (!isRetry && themeName !== 'default') {
				return applyTheme('default', signal, true)
			}
			return
		}

		const themeToApply = await res.json()
		const root = document.documentElement
		Object.entries(themeToApply.variables).forEach(([key, value]) => {
			root.style.setProperty(key, value as string)
		})
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') return
		if (!isRetry && themeName !== 'default') {
			return applyTheme('default', signal, true)
		}
		if (!isRetry && themeName !== 'default') {
			console.warn(`Erreur lors du chargement du theme "${themeName}"`, err)
		}
	}
}

async function applyFont(fontName: string, signal?: AbortSignal, isRetry = false) {
	try {
		const res = await fetch(`/themes/fonts/${fontName}.json`, { signal })
		if (!res.ok) {
			if (!isRetry && fontName !== 'default') {
				return applyFont('default', signal, true)
			}
			return
		}

		const themeToApply = await res.json()
		const root = document.documentElement
		Object.entries(themeToApply.variables).forEach(([key, value]) => {
			root.style.setProperty(key, value as string)
		})
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') return
		if (!isRetry && fontName !== 'default') {
			return applyFont('default', signal, true)
		}
		if (!isRetry && fontName !== 'default') {
			console.warn(`Erreur lors du chargement de la police "${fontName}"`, err)
		}
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isAuthReady, setIsAuthReady] = useState(false)
	const presenceSocketRef = useRef<WebSocket | null>(null)
	const lastActivitySentRef = useRef(0)

	const applylang = async (username: string, signal?: AbortSignal) => {
		try {
			const userIdResponse = await fetch(`${API_BASE}/user/userid/${username}`, { signal })
			if (!userIdResponse.ok) return
			const { id } = await userIdResponse.json()

			const response = await fetch(`${API_BASE}/user/users/${id}`, { signal })
			if (!response.ok) return
			const userData = await response.json()

			if (userData?.lang && userData.lang !== i18n.language) {
				i18n.changeLanguage(userData.lang)
				localStorage.setItem('language', userData.lang)
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
						await applylang(userData.username, abortController.signal)
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

	useEffect(() => {
		if (!user) {
			if (presenceSocketRef.current) {
				presenceSocketRef.current.close()
				presenceSocketRef.current = null
			}
			return
		}

		let isDisposed = false
		let reconnectTimer: number | null = null
		let currentSocket: WebSocket | null = null

		const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

		const sendActivity = (force = false) => {
			if (!currentSocket || currentSocket.readyState !== WebSocket.OPEN) return
			const now = Date.now()
			if (!force && now - lastActivitySentRef.current < 3000) return
			lastActivitySentRef.current = now
			currentSocket.send(JSON.stringify({ type: 'activity' }))
		}

		const connect = () => {
			if (isDisposed) return
			const socket = new WebSocket(`${proto}//${window.location.host}/ws/user/friends`)
			currentSocket = socket
			presenceSocketRef.current = socket

			socket.onopen = () => {
				sendActivity(true)
			}

			socket.onclose = () => {
				if (isDisposed) return
				reconnectTimer = window.setTimeout(() => {
					connect()
				}, 1500)
			}
		}

		connect()

		const onActivity = () => sendActivity(false)
		const onVisible = () => {
			if (document.visibilityState === 'visible') sendActivity(true)
		}

		window.addEventListener('click', onActivity)
		window.addEventListener('keydown', onActivity)
		window.addEventListener('pointerdown', onActivity)
		window.addEventListener('focus', onActivity)
		document.addEventListener('visibilitychange', onVisible)

		return () => {
			isDisposed = true
			if (reconnectTimer) window.clearTimeout(reconnectTimer)
			window.removeEventListener('click', onActivity)
			window.removeEventListener('keydown', onActivity)
			window.removeEventListener('pointerdown', onActivity)
			window.removeEventListener('focus', onActivity)
			document.removeEventListener('visibilitychange', onVisible)

			if (currentSocket) {
				currentSocket.close()
			}
			if (presenceSocketRef.current === currentSocket) {
				presenceSocketRef.current = null
			}
		}
	}, [user])

	const login = async (email: string, username: string): Promise<boolean> => {
		const rawIdentifier = email.trim()

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
		let userData: User | null = null

		try {
			const meResponse = await fetch(`${API_BASE}/auth/me`, {
				method: 'GET',
				credentials: 'include',
			})

			if (meResponse.ok) {
				const me = await meResponse.json()
				if (me?.username) {
					userData = {
						email: me?.email || rawIdentifier,
						username: me.username,
					}
				}
			}
		} catch {
			userData = null
		}

		if (!userData) {
			if (!username) return false
			userData = {
				email: email || rawIdentifier,
				username,
			}
		}

		setUser(userData)
		localStorage.setItem('user', JSON.stringify(userData))
		setIsAuthReady(true)
		await applylang(userData.username)
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

	const logout = async () => {
		setUser(null)
		localStorage.removeItem('user')
		localStorage.setItem('theme', 'default')
		localStorage.setItem('font', 'default')
		localStorage.setItem('auth-event', Date.now().toString())
		applyTheme('default')
		applyFont('default')

		try {
			await fetch(`${API_BASE}/auth/signout`, {
				method: 'POST',
				credentials: 'include',
				keepalive: true,
			})
		} catch (error) {
			console.warn('[Auth] signout request failed', error)
		}
	}

	const updateUser = (patch: Partial<User>) => {
		setUser((currentUser) => {
			if (!currentUser) return currentUser
			const nextUser = { ...currentUser, ...patch }
			localStorage.setItem('user', JSON.stringify(nextUser))
			return nextUser
		})
	}

	return (
		<AuthContext.Provider value={{ user, login, signup, logout, updateUser, isAuthenticated: !!user, isAuthReady }}>
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
