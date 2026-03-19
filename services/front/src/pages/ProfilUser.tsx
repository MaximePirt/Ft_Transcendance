import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ThemeSelector from '../content/ThemeSelector'
import FontSelector from '../content/FontSelector'
import DataRequester from '../content/DataRequester'
import DataDeleter from '../content/DataDeleter'
import { runtimeEnv } from '../runtime-env'

import '../App.css'

// @ts-ignore
const API_BASE = runtimeEnv.API_URL ?? 'https://localhost/api'

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
			console.warn(`Erreur lors du chargement du thème "${themeName}"`, err)
		}
		return
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
		return
	}
}

const languages = [
	{ code: 'fr', lang: 'Français' },
	{ code: 'en', lang: 'English' },
	{ code: 'ar', lang: 'العربية' },
]


//en attendant la data base
const defaultUserProfile = {
	username: '',
	email: '',
	joinYear: new Date().getFullYear(),
	favorites: ['cinema', 'music', 'computer_science'],
}

type Friend = {
	id: string
	username: string
	status: 'online' | 'offline'
}

type FriendRequest = {
	id: string
	username: string
	status: 'online' | 'offline'
	type: 'received' | 'sent'
}

type Sticker = {
	id: string
	symbol: string
	url?: string
	x: number
	y: number
}

type BadgeOption = {
	id: string
	text: string
	requiredAchievementKey?: string
}

type RecentMatch = {
	sessionId: string
	mode: string
	status: string
	startedAt: string
	endedAt: string
	totalQuestions: number
	score: number
	correctAnswers: number
	answeredCount: number
}

type GameStats = {
	totalMatches: number
	wins: number
	totalScore: number
	answered: number
	correct: number
	winRate: number
	accuracy: number
}

type Achievement = {
	key: string
	metric: string
	target: number
	value: number
	progressPercent: number
	unlocked: boolean
	points: number
}

type AchievementSummary = {
	unlockedCount: number
	totalCount: number
	unlockedPoints: number
	totalPoints: number
	progressPercent: number
}

type AchievementPayload = {
	summary: AchievementSummary
	unlocked: Achievement[]
	inProgress: Achievement[]
	all: Achievement[]
}

const defaultGameStats: GameStats = {
	totalMatches: 0,
	wins: 0,
	totalScore: 0,
	answered: 0,
	correct: 0,
	winRate: 0,
	accuracy: 0,
}

const defaultAchievementSummary: AchievementSummary = {
	unlockedCount: 0,
	totalCount: 0,
	unlockedPoints: 0,
	totalPoints: 0,
	progressPercent: 0,
}

const defaultAchievements: AchievementPayload = {
	summary: defaultAchievementSummary,
	unlocked: [],
	inProgress: [],
	all: [],
}


// truc a la con avec les stickers a tout moment ca degage
const stickerPalette = [
	{ id: 'spark', symbol: '✨' },
	{ id: 'zap', symbol: '⚡' },
	{ id: 'thumb', symbol: '👍' },
	{ id: 'fire', symbol: '🔥' },
	{ id: 'heart', symbol: '❤️' },
	{ id: 'star', symbol: '⭐' },
	{ id: 'jeux_video', symbol: '🎮', url: '/theme-icons/JeuxVidéo.png' },
	{ id: 'jeux_video2', symbol: '🎮', url: '/theme-icons/JeuxVidéo.gif' },
]

const bgPresets = ['#0f0f10', '#111827', '#1f2937', '#0b5fff', '#8b5cf6', '#10b981', '#eab308']

const badgeOptions: BadgeOption[] = [
	{ id: 'cinema', text: 'profile_title_cinema' },
	{ id: 'quiz_master', text: 'profile_title_quiz_master' },
	{ id: 'speedrunner', text: 'profile_title_speedrunner' },
	{ id: 'pixel', text: 'profile_title_pixel' },
	{ id: 'music', text: 'profile_title_music' },
	{ id: 'first_match', text: 'achievement_first_match_title', requiredAchievementKey: 'first_match' },
	{ id: 'winning_start', text: 'achievement_winning_start_title', requiredAchievementKey: 'winning_start' },
	{ id: 'accuracy_pro', text: 'achievement_accuracy_pro_title', requiredAchievementKey: 'accuracy_pro' },
]

const DEFAULT_AVATAR = '/avatar/Default.png'
const DEFAULT_AVATAR_CHOICES = ['/avatar/Default.png', '/avatar/Default2.png', '/avatar/Default3.png']

const MAX_STICKERS = 3
const MAX_BADGES = 2

function ProfilUser() {
	const navigate = useNavigate()
	const { username: routeUsername, userId: routeUserId } = useParams()
	const { t, i18n } = useTranslation()
	const { user, isAuthenticated, isAuthReady, updateUser } = useAuth()
	const hasProfileParam = Boolean(routeUsername || routeUserId)
	const isPublicView = hasProfileParam && (!routeUsername || routeUsername !== user?.username)
	const canEdit = !isPublicView
	const profileUsername = routeUsername || user?.username || ''
	const dropZoneRef = useRef<HTMLDivElement | null>(null)
	const avatarInputRef = useRef<HTMLInputElement | null>(null)
	const friendWsRef = useRef<WebSocket | null>(null)
	const [bgColor, setBgColor] = useState('#0f0f10')
	const [stickers, setStickers] = useState<Sticker[]>([])
	const [badges, setBadges] = useState<string[]>([])
	const [description, setDescription] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [saveError, setSaveError] = useState('')
	const [saveSuccess, setSaveSuccess] = useState(false)
	const [usernameInput, setUsernameInput] = useState('')
	const [usernameError, setUsernameError] = useState('')
	const [usernameSuccess, setUsernameSuccess] = useState('')
	const [avatarUrl, setAvatarUrl] = useState('')
	const [selectedAvatarFileName, setSelectedAvatarFileName] = useState('')
	const [avatarUploading, setAvatarUploading] = useState(false)
	const [avatarError, setAvatarError] = useState('')
	const [avatarSuccess, setAvatarSuccess] = useState(false)
	const [friends, setFriends] = useState<Friend[]>([])
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
	const [friendSearchInput, setFriendSearchInput] = useState('')
	const [friendActionError, setFriendActionError] = useState('')
	const [friendActionSuccess, setFriendActionSuccess] = useState('')
	const [userProfile, setUserProfile] = useState(defaultUserProfile)
	const [gameStats, setGameStats] = useState<GameStats>(defaultGameStats)
	const [achievements, setAchievements] = useState<AchievementPayload>(defaultAchievements)
	const [achievementsLoading, setAchievementsLoading] = useState(false)
	const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
	const [recentMatchesLoading, setRecentMatchesLoading] = useState(false)
	const [profileNotFound, setProfileNotFound] = useState(false)
	const [resolvedProfileUserId, setResolvedProfileUserId] = useState<number | null>(null)
	const [profileResolutionDone, setProfileResolutionDone] = useState(false)

	const totalQuestions = gameStats.answered
	const correctAnswers = gameStats.correct
	const accuracy = Number.isFinite(gameStats.accuracy) ? Math.round(gameStats.accuracy) : 0
	const safeAccuracy = Math.max(0, Math.min(100, accuracy))
	const achievementByKey = new Map(achievements.all.map((achievement) => [achievement.key, achievement]))
	const isBadgeUnlocked = (badge: BadgeOption) => {
		if (!badge.requiredAchievementKey) return true
		return Boolean(achievementByKey.get(badge.requiredAchievementKey)?.unlocked)
	}
	const selectableBadgeSet = new Set(badgeOptions.filter((badge) => isBadgeUnlocked(badge)).map((badge) => badge.id))
	const activeBadges = badges.filter((id) => selectableBadgeSet.has(id)).slice(0, MAX_BADGES)
	const visibleBadges = activeBadges

	const formatMatchDate = (dateValue?: string) => {
		if (!dateValue) return '-'
		const date = new Date(dateValue)
		if (Number.isNaN(date.getTime())) return dateValue
		return date.toLocaleString(i18n.language)
	}

	const getMatchStatusLabel = (status: string) => {
		if (status === 'completed') return t('profile_match_status_completed')
		if (status === 'abandoned') return t('profile_match_status_abandoned')
		if (status === 'in_progress') return t('profile_match_status_in_progress')
		return status
	}

	const mapFriendMessage = (message?: string) => {
		const normalized = (message || '').toLowerCase()
		if (normalized.includes('user not found')) return t('profile_friend_user_not_found')
		if (normalized.includes('already friend')) return t('profile_friend_already_friend')
		if (normalized.includes('already sent')) return t('profile_friend_request_already_sent')
		if (normalized.includes('no auth cookie') || normalized.includes('unauthorized')) return t('save_error_not_authenticated')
		return ''
	}

	const applyPresenceToSocialLists = (targetUserId: string, online: boolean) => {
		const nextStatus: Friend['status'] = online ? 'online' : 'offline'
		setFriends((current) => current.map((friend) => (
			friend.id === targetUserId ? { ...friend, status: nextStatus } : friend
		)))
		setFriendRequests((current) => current.map((request) => (
			request.id === targetUserId ? { ...request, status: nextStatus } : request
		)))
	}

	const removeUserFromSocialLists = (targetUserId: string) => {
		setFriends((current) => current.filter((friend) => friend.id !== targetUserId))
		setFriendRequests((current) => current.filter((request) => request.id !== targetUserId))
	}

	const resolveUserId = async ({ username, userId }: { username?: string; userId?: string | number }, signal?: AbortSignal) => {
		const numericUserId = Number(userId)
		if (Number.isInteger(numericUserId) && numericUserId > 0) return numericUserId

		const normalizedUsername = String(username || '').trim()
		if (!normalizedUsername) {
			throw new Error('Missing user identifier')
		}

		const userIdResponse = await fetch(`${API_BASE}/user/userid/soft/${encodeURIComponent(normalizedUsername)}`, { signal })
		if (!userIdResponse.ok) throw new Error('Failed to resolve user id')
		const { id } = await userIdResponse.json()
		if (id === null || id === undefined) throw new Error('User not found')
		const resolvedId = Number(id)
		if (!Number.isInteger(resolvedId) || resolvedId <= 0) throw new Error('Invalid user id')
		return resolvedId
	}

	const isUserNotFoundError = (error: unknown) => (
		error instanceof Error && error.message.includes('User not found')
	)

	const loadFriends = async (username: string, signal?: AbortSignal) => {
		const userIdResponse = await fetch(`${API_BASE}/user/userid/${encodeURIComponent(username)}`, { signal })
		if (!userIdResponse.ok) throw new Error('Failed to resolve user id')
		const { id } = await userIdResponse.json()

		const response = await fetch(`${API_BASE}/user/${id}/friends`, { signal })
		if (!response.ok) throw new Error('Failed to load friends')
		const data = await response.json()
		const list = data?.result?.friends || data?.friends || []
		const normalized = list.map((friend: { id: number | string; username: string; onlineStatus: number | boolean }) => ({
			id: String(friend.id),
			username: friend.username,
			status: friend.onlineStatus ? 'online' : 'offline',
		}))
		setFriends(normalized)
	}

	const loadFriendRequests = async (signal?: AbortSignal) => {
		const response = await fetch(`${API_BASE}/user/friends/requests`, {
			credentials: 'include',
			signal,
		})
		if (!response.ok) throw new Error('Failed to load friend requests')
		const data = await response.json()
		const received = Array.isArray(data?.received) ? data.received : []
		const sent = Array.isArray(data?.sent) ? data.sent : []
		const normalizedReceived: FriendRequest[] = received.map((request: { id: number | string; username: string; onlineStatus: number | boolean }) => ({
			id: String(request.id),
			username: request.username,
			status: request.onlineStatus ? 'online' : 'offline',
			type: 'received',
		}))
		const normalizedSent: FriendRequest[] = sent.map((request: { id: number | string; username: string; onlineStatus: number | boolean }) => ({
			id: String(request.id),
			username: request.username,
			status: request.onlineStatus ? 'online' : 'offline',
			type: 'sent',
		}))
		setFriendRequests([...normalizedReceived, ...normalizedSent])
	}

	const loadRecentMatches = async ({ username, userId }: { username?: string; userId?: string | number }, signal?: AbortSignal) => {
		setRecentMatchesLoading(true)
		try {
			const id = await resolveUserId({ username, userId }, signal)

			const historyResponse = await fetch(`${API_BASE}/user/${id}/matches?limit=3`, { signal })
			if (!historyResponse.ok) throw new Error('Failed to load match history')
			const data = await historyResponse.json()
			const list = Array.isArray(data?.result) ? data.result : []
			const normalized: RecentMatch[] = list.slice(0, 3).map((match: {
				sessionId: number | string
				mode?: string
				status?: string
				startedAt?: string
				endedAt?: string
				totalQuestions?: number
				score?: number
				correctAnswers?: number
				answeredCount?: number
			}) => ({
				sessionId: String(match.sessionId),
				mode: String(match.mode || 'random'),
				status: String(match.status || 'completed'),
				startedAt: String(match.startedAt || ''),
				endedAt: String(match.endedAt || ''),
				totalQuestions: Number(match.totalQuestions || 0),
				score: Number(match.score || 0),
				correctAnswers: Number(match.correctAnswers || 0),
				answeredCount: Number(match.answeredCount || 0),
			}))
			setRecentMatches(normalized)
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return
			if (error instanceof TypeError) return
			if (isUserNotFoundError(error)) return
			console.warn('[Profile] failed to load recent matches', error)
			setRecentMatches([])
		} finally {
			setRecentMatchesLoading(false)
		}
	}

	const loadGameStats = async ({ username, userId }: { username?: string; userId?: string | number }, signal?: AbortSignal) => {
		try {
			const id = await resolveUserId({ username, userId }, signal)

			const statsResponse = await fetch(`${API_BASE}/user/${id}/stats`, { signal })
			if (!statsResponse.ok) throw new Error('Failed to load game stats')
			const data = await statsResponse.json()
			const stats = data?.result || {}
			setGameStats({
				totalMatches: Number(stats.total_matches || 0),
				wins: Number(stats.wins || 0),
				totalScore: Number(stats.total_score || 0),
				answered: Number(stats.answered || 0),
				correct: Number(stats.correct || 0),
				winRate: Number(stats.win_rate || 0),
				accuracy: Number(stats.accuracy || 0),
			})
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return
			if (error instanceof TypeError) return
			if (isUserNotFoundError(error)) return
			console.warn('[Profile] failed to load game stats', error)
			setGameStats(defaultGameStats)
		}
	}

	const loadAchievements = async ({ username, userId }: { username?: string; userId?: string | number }, signal?: AbortSignal) => {
		setAchievementsLoading(true)
		try {
			const id = await resolveUserId({ username, userId }, signal)

			const response = await fetch(`${API_BASE}/user/${id}/achievements`, { signal })
			if (!response.ok) throw new Error('Failed to load achievements')
			const data = await response.json()
			const payload = data?.result || {}
			const summary = payload?.summary || {}
			const normalized: AchievementPayload = {
				summary: {
					unlockedCount: Number(summary.unlockedCount || 0),
					totalCount: Number(summary.totalCount || 0),
					unlockedPoints: Number(summary.unlockedPoints || 0),
					totalPoints: Number(summary.totalPoints || 0),
					progressPercent: Number(summary.progressPercent || 0),
				},
				unlocked: Array.isArray(payload?.unlocked) ? payload.unlocked : [],
				inProgress: Array.isArray(payload?.inProgress) ? payload.inProgress : [],
				all: Array.isArray(payload?.all) ? payload.all : [],
			}
			setAchievements(normalized)
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return
			if (error instanceof TypeError) return
			if (isUserNotFoundError(error)) return
			console.warn('[Profile] failed to load achievements', error)
		} finally {
			setAchievementsLoading(false)
		}
	}

	const normalizeAvatarUrl = (url?: string) => {
		if (!url) return ''
		const trimmed = String(url).trim()
		if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return ''
		return trimmed
	}
	const resolveAvatarUrl = (url: string) => {
		if (url.startsWith('https://') || url.startsWith('http://')) return url
		if (url.startsWith('/avatar/')) return url
		if (url.startsWith('/user/avatar/')) return url
		if (url.startsWith('/uploads/')) return `${API_BASE}/user${url}`
		return `${API_BASE}${url}`
	}


	// Rediriger si non authentifié
	useEffect(() => {
		if (isPublicView) return
		if (!isAuthReady) return
		if (!isAuthenticated) {
			navigate('/')
		}
	}, [isAuthenticated, isAuthReady, isPublicView, navigate])

	// Charger les données de l'utilisateur
	useEffect(() => {
		if (user && !isPublicView) {
			setUserProfile({
				username: user.username,
				email: user.email,
				joinYear: new Date().getFullYear(),
				favorites: ['cinema', 'music', 'computer_science'],
			})
			setUsernameInput(user.username)
		}
	}, [user, isPublicView])

	// Supprimé: la logique d'application automatique du thème/font d'un autre utilisateur
	// causait des conflits et bugs de timing

	useEffect(() => {
		if (!routeUserId && !profileUsername) return
		const abortController = new AbortController()
		let isActive = true
		setProfileNotFound(false)
		setResolvedProfileUserId(null)
		setProfileResolutionDone(false)

		// Charger les données depuis le serveur en priorité
		const loadProfileCard = async () => {
			try {
				const id = await resolveUserId({ username: profileUsername, userId: routeUserId }, abortController.signal)

				const response = await fetch(`${API_BASE}/user/users/soft/${id}`, {
					signal: abortController.signal,
				})
				if (response.ok) {
					if (!isActive) return
					const payload = await response.json()
					const userData = payload?.user || null
					if (!userData) {
						throw new Error('User not found')
					}
					setProfileNotFound(false)
					setResolvedProfileUserId(id)
					setProfileResolutionDone(true)
					setUserProfile({
						username: userData.username || profileUsername,
						email: userData.email || '',
						joinYear: new Date(userData.created_at || Date.now()).getFullYear(),
						favorites: ['cinema', 'music', 'computer_science'],
					})
					setAvatarUrl(normalizeAvatarUrl(userData.avatarUrl))
					setBgColor(userData.profileCardBgColor || '#0f0f10')
					setStickers([])
					setBadges([])
					setDescription(String(userData.profileCardDescription || '').slice(0, 40))

					// Charger les données de personnalisation depuis le serveur
					if (userData.profileCardStickers) {
						try {
							const parsed = JSON.parse(userData.profileCardStickers)
							if (Array.isArray(parsed)) {
								setStickers(parsed)
							}
						} catch (e) {
							console.warn('Failed to parse stickers', e)
						}
					}

					if (userData.profileCardTitles) {
						try {
							const parsed = JSON.parse(userData.profileCardTitles)
							if (Array.isArray(parsed) && parsed.length) {
								setBadges(parsed.slice(0, MAX_BADGES))
							}
						} catch (e) {
							console.warn('Failed to parse badges', e)
						}
					}

					if (canEdit) {
						if (userData.theme) localStorage.setItem('theme', userData.theme)
						if (userData.font) localStorage.setItem('font', userData.font)
					}

					// Note: On n'applique plus le thème/font d'un utilisateur visité pour éviter les conflits

					return
				}
			} catch (e) {
				if (e instanceof DOMException && e.name === 'AbortError') return
				if (e instanceof TypeError) return
				if (isUserNotFoundError(e)) {
					setProfileNotFound(true)
					setResolvedProfileUserId(null)
					setProfileResolutionDone(true)
					navigate('/', { replace: true })
					return
				}
				setProfileResolutionDone(true)
				console.warn('[ProfileCard] failed to load from server, trying localStorage', e)
				try {
					const stored = localStorage.getItem('profileCard')
					if (stored && canEdit) {
						const data = JSON.parse(stored)
						if (data.stickers) setStickers(data.stickers)
						if (data.badges) setBadges(data.badges)
						if (data.titles) setBadges(data.titles)
						if (data.bgColor) setBgColor(data.bgColor)
						if (data.description) setDescription(data.description)
					}
				} catch (e) {
					console.warn('[ProfileCard] failed to load from localStorage', e)
				}
			}
		}

		void loadProfileCard()

		return () => {
			isActive = false
			abortController.abort()
		}
	}, [profileUsername, routeUserId, canEdit, isPublicView, navigate])

	useEffect(() => {
		if (!user || !canEdit) return
		const abortController = new AbortController()
		const refreshFriends = async () => {
			try {
				await Promise.all([loadFriends(user.username, abortController.signal), loadFriendRequests(abortController.signal)])
			} catch (e) {
				if (e instanceof Error && e.name === 'AbortError') return
				if (e instanceof TypeError) return
				console.warn('[Profile] failed to load social data', e)
			}
		}

		void refreshFriends()

		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				void refreshFriends()
			}
		}

		document.addEventListener('visibilitychange', onVisibilityChange)

		return () => {
			abortController.abort()
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
	}, [user, canEdit])

	useEffect(() => {
		if (!user || !canEdit) return
		let isDisposed = false
		let reconnectTimer: number | null = null
		let currentSocket: WebSocket | null = null

		const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

		const connect = () => {
			if (isDisposed) return
			const socket = new WebSocket(`${proto}//${window.location.host}/ws/user/friends`)
			currentSocket = socket
			friendWsRef.current = socket

			socket.onopen = () => {
				console.log('[Profile] Friends WebSocket connected')
			}

			socket.onmessage = async (event) => {
				try {
					const msg = JSON.parse(event.data)
					if (msg?.type === 'presence_updated') {
						const targetUserId = String(msg?.payload?.userId || '')
						if (targetUserId) {
							applyPresenceToSocialLists(targetUserId, Boolean(msg?.payload?.online))
						}
						return
					}
					if (msg?.type === 'friend_updated' && msg?.payload?.reason === 'account_deleted') {
						const removedUserId = String(msg?.payload?.userId || '')
						if (removedUserId) {
							removeUserFromSocialLists(removedUserId)
						}
						return
					}
					if (msg?.type === 'friend_updated' || msg?.type === 'friend_request_received') {
						await Promise.all([loadFriends(user.username), loadFriendRequests()])
					}
				} catch (error) {
					console.warn('[Profile] Friends WebSocket message error', error)
				}
			}

			socket.onerror = (error) => {
				console.error('[Profile] Friends WebSocket error', error)
			}

			socket.onclose = () => {
				if (isDisposed) return
				reconnectTimer = window.setTimeout(() => {
					connect()
				}, 1500)
			}
		}

		connect()

		return () => {
			isDisposed = true
			if (reconnectTimer) window.clearTimeout(reconnectTimer)
			if (currentSocket) {
				currentSocket.close()
			}
			if (friendWsRef.current === currentSocket) {
				friendWsRef.current = null
			}
		}
	}, [user, canEdit])

	useEffect(() => {
		if (profileNotFound) {
			setRecentMatches([])
			setGameStats(defaultGameStats)
			setAchievements(defaultAchievements)
			return
		}

		if (hasProfileParam) {
			if (!profileResolutionDone) return
			if (!resolvedProfileUserId) {
				setRecentMatches([])
				setGameStats(defaultGameStats)
				setAchievements(defaultAchievements)
				return
			}
		}

		if (!routeUserId && !profileUsername) {
			setRecentMatches([])
			setGameStats(defaultGameStats)
			if (isAuthenticated) {
				setAchievements(defaultAchievements)
			}
			return
		}
		const abortController = new AbortController()
		const resolvedUserIdForTarget = resolvedProfileUserId ?? undefined
		const profileTarget = hasProfileParam
			? { userId: resolvedUserIdForTarget }
			: { username: profileUsername, userId: routeUserId }
		void loadRecentMatches(profileTarget, abortController.signal)
		void loadGameStats(profileTarget, abortController.signal)
		void loadAchievements(profileTarget, abortController.signal)
		return () => abortController.abort()
	}, [profileUsername, routeUserId, hasProfileParam, resolvedProfileUserId, profileResolutionDone, profileNotFound, isAuthenticated])

	useEffect(() => {
		setBadges((prev) => prev.filter((id) => selectableBadgeSet.has(id)).slice(0, MAX_BADGES))
	}, [achievements.all])

	useEffect(() => {
		document.documentElement.dir = i18n.dir()
	}, [i18n, i18n.language])

	// Auto-save désactivé (sauvegarde manuelle uniquement)

	const handleSaveNow = async () => {
		if (!user || !canEdit) return
		setIsSaving(true)
		setSaveError('')
		setSaveSuccess(false)
		setUsernameError('')
		setUsernameSuccess('')
		try {
			const nextUsername = usernameInput.trim()
			const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/
			if (!usernameRegex.test(nextUsername)) {
				setUsernameError(t('signup_error_username_format'))
				return
			}

			const userResponse = await fetch(`${API_BASE}/user/userid/${encodeURIComponent(user.username)}`)
			if (!userResponse.ok) {
				const text = await userResponse.text()
				throw new Error(t('save_error_user_id', { status: userResponse.status, detail: text || '-' }))
			}
			const { id } = await userResponse.json()

			const response = await saveProfileToServer(id, nextUsername)
			if (!response.ok) {
				const payload = await response.json().catch(() => null)
				const detail = payload?.error || payload?.message || '-'
				if (response.status === 409) {
					const conflictMessage = String(detail)
					if (conflictMessage.toLowerCase().includes('username')) {
						setUsernameError(conflictMessage)
						return
					}
					throw new Error(conflictMessage)
				}
				throw new Error(t('save_error_api', { status: response.status, detail }))
			}

			if (nextUsername !== user.username) {
				updateUser({ username: nextUsername })
				setUserProfile((prev) => ({ ...prev, username: nextUsername }))
				setUsernameSuccess(t('save_success'))
			}

			setSaveSuccess(true)
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : t('save_error_generic'))
		} finally {
			setIsSaving(false)
		}
	}

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!user || !canEdit) return
		const file = e.target.files?.[0]
		if (!file) return
		setSelectedAvatarFileName(file.name)
		setAvatarError('')
		setAvatarSuccess(false)
		if (file.size > 2 * 1024 * 1024) {
			setAvatarError(t('profile_avatar_error_size'))
			e.target.value = ''
			setSelectedAvatarFileName('')
			return
		}
		if (!['image/png', 'image/jpeg'].includes(file.type)) {
			setAvatarError(t('profile_avatar_error_type'))
			e.target.value = ''
			setSelectedAvatarFileName('')
			return
		}
		setAvatarUploading(true)
		try {
			const userResponse = await fetch(`${API_BASE}/user/userid/${user.username}`)
			if (!userResponse.ok) {
				const text = await userResponse.text()
				throw new Error(t('profile_avatar_error_user_id', { status: userResponse.status, detail: text || '-' }))
			}
			const { id } = await userResponse.json()
			const formData = new FormData()
			formData.append('file', file)
			const uploadResponse = await fetch(`${API_BASE}/user/${id}/avatar`, {
				method: 'PATCH',
				credentials: 'include',
				body: formData,
			})
			if (!uploadResponse.ok) {
				const text = await uploadResponse.text()
				throw new Error(t('profile_avatar_error_api', { status: uploadResponse.status, detail: text || '-' }))
			}
			const data = await uploadResponse.json()
			if (data?.avatarUrl) setAvatarUrl(data.avatarUrl)
			setAvatarSuccess(true)
			e.target.value = ''
			setSelectedAvatarFileName('')
		} catch (err) {
			setAvatarError(err instanceof Error ? err.message : t('profile_avatar_error_generic'))
		} finally {
			setAvatarUploading(false)
		}
	}

	const handleBrowseAvatar = () => {
		if (avatarUploading) return
		avatarInputRef.current?.click()
	}

	const handleSelectDefaultAvatar = async (defaultAvatarPath: string) => {
		if (!user || !canEdit) return
		setAvatarError('')
		setAvatarSuccess(false)
		setAvatarUploading(true)
		try {
			const userResponse = await fetch(`${API_BASE}/user/userid/${encodeURIComponent(user.username)}`)
			if (!userResponse.ok) {
				const text = await userResponse.text()
				throw new Error(t('profile_avatar_error_user_id', { status: userResponse.status, detail: text || '-' }))
			}
			const { id } = await userResponse.json()
			const updateResponse = await fetch(`${API_BASE}/user/${id}`, {
				method: 'PATCH',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ avatarUrl: defaultAvatarPath }),
			})
			if (!updateResponse.ok) {
				const text = await updateResponse.text()
				throw new Error(t('profile_avatar_error_api', { status: updateResponse.status, detail: text || '-' }))
			}
			setAvatarUrl(defaultAvatarPath)
			if (avatarInputRef.current) avatarInputRef.current.value = ''
			setSelectedAvatarFileName('')
			setAvatarSuccess(true)
		} catch (err) {
			setAvatarError(err instanceof Error ? err.message : t('profile_avatar_error_generic'))
		} finally {
			setAvatarUploading(false)
		}
	}

	const saveProfileToServer = async (userId: number | string, usernameToSave: string): Promise<Response> => {
		const langToSave = i18n.language

		return fetch(`${API_BASE}/user/${userId}`, {
			method: 'PATCH',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: usernameToSave,
				profileCardBgColor: bgColor,
				profileCardStickers: JSON.stringify(stickers),
				profileCardTitles: JSON.stringify(badges),
				profileCardDescription: description,
				lang: langToSave,
				theme: localStorage.getItem('theme') || 'default',
				font: localStorage.getItem('font') || 'default',
			})
		})
	}

	type StickerPayload = { symbol: string; url?: string }

	const addSticker = (payload: StickerPayload, x = 50, y = 50) => {
		if (!canEdit) return
		setStickers((prev) => {
			if (prev.length >= MAX_STICKERS) return prev
			return [...prev, { id: `${Date.now()}-${prev.length}`, symbol: payload.symbol, url: payload.url, x, y }]
		})
	}

	const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, payload: StickerPayload) => {
		if (!canEdit) return
		e.dataTransfer.setData('application/json', JSON.stringify(payload))
		e.dataTransfer.effectAllowed = 'copy'
	}

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		if (!canEdit) return
		e.preventDefault()
		if (stickers.length >= MAX_STICKERS) return
		let payload: StickerPayload | null = null
		try {
			const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
			if (raw) payload = JSON.parse(raw)
		} catch (err) {
			console.warn('[ProfileCard] drop parse failed', err)
		}
		if (!payload || !payload.symbol || !dropZoneRef.current) return
		const rect = dropZoneRef.current.getBoundingClientRect()
		const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100)
		const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 0), 100)
		addSticker(payload, x, y)
	}

	const handleReset = () => {
		if (!canEdit) return
		setStickers([])
		setBgColor('#0f0f10')
		setBadges([])
		setDescription('')
		localStorage.setItem('theme', 'default')
		localStorage.setItem('font', 'default')
		applyTheme('default')
		applyFont('default')
		window.dispatchEvent(new CustomEvent('theme-font-reset'))
	}

	const toggleBadge = (id: string) => {
		if (!canEdit) return
		if (!selectableBadgeSet.has(id)) return
		setBadges((prev) => {
			const sanitized = prev.filter((badgeId) => selectableBadgeSet.has(badgeId)).slice(0, MAX_BADGES)
			if (sanitized.includes(id)) return sanitized.filter((badgeId) => badgeId !== id)
			if (sanitized.length >= MAX_BADGES) return sanitized
			return [...sanitized, id]
		})
	}

	const handleRemove = (id: string) => {
		if (!canEdit) return
		setStickers((prev) => prev.filter((s) => s.id !== id))
	}

	const handleRemoveFriend = async (id: string) => {
		if (!canEdit) return
		setFriendActionError('')
		setFriendActionSuccess('')
		try {
			const response = await fetch(`${API_BASE}/user/${id}/friends`, {
				method: 'DELETE',
				credentials: 'include',
			})
			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.ok) {
				throw new Error(data?.message || 'Unable to remove friend')
			}
			if (user) {
				await Promise.all([loadFriends(user.username), loadFriendRequests()])
			}
			setFriendActionSuccess(t('save_success'))
		} catch (e) {
			setFriendActionError(e instanceof Error ? e.message : t('save_error_generic'))
		}
	}

	const handleAcceptRequest = async (id: string) => {
		if (!canEdit || !user) return
		setFriendActionError('')
		setFriendActionSuccess('')
		try {
			const response = await fetch(`${API_BASE}/user/${id}/friends`, {
				method: 'POST',
				credentials: 'include',
			})
			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.ok) {
				throw new Error(data?.message || 'Unable to accept friend request')
			}
			await Promise.all([loadFriends(user.username), loadFriendRequests()])
			setFriendActionSuccess(t('save_success'))
		} catch (e) {
			setFriendActionError(e instanceof Error ? e.message : t('save_error_generic'))
		}
	}

	const handleDeclineRequest = async (id: string) => {
		if (!canEdit || !user) return
		setFriendActionError('')
		setFriendActionSuccess('')
		try {
			const response = await fetch(`${API_BASE}/user/${id}/friends`, {
				method: 'DELETE',
				credentials: 'include',
			})
			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.ok) {
				throw new Error(data?.message || 'Unable to decline friend request')
			}
			await Promise.all([loadFriends(user.username), loadFriendRequests()])
			setFriendActionSuccess(t('save_success'))
		} catch (e) {
			setFriendActionError(e instanceof Error ? e.message : t('save_error_generic'))
		}
	}

	const handleSendFriendRequest = async () => {
		if (!canEdit || !user) return
		const friendUsername = friendSearchInput.trim()
		if (!friendUsername) return
		const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/
		setFriendActionError('')
		setFriendActionSuccess('')
		if (!usernameRegex.test(friendUsername)) {
			setFriendActionError(t('signup_error_username_format'))
			return
		}
		if (friendUsername === user.username) {
			setFriendActionError(t('save_error_generic'))
			return
		}
		try {
			const userIdResponse = await fetch(`${API_BASE}/user/userid/soft/${encodeURIComponent(friendUsername)}`)
			if (!userIdResponse.ok) {
				let backendMessage = ''
				const payload = await userIdResponse.json().catch(() => null)
				if (payload?.error) backendMessage = String(payload.error)
				if (payload?.message) backendMessage = String(payload.message)
				const friendly = mapFriendMessage(backendMessage)
				setFriendActionError(friendly || t('profile_friend_user_not_found'))
				return
			}
			const { id: friendId } = await userIdResponse.json()
			if (!friendId) {
				setFriendActionError(t('profile_friend_user_not_found'))
				return
			}
			const response = await fetch(`${API_BASE}/user/${friendId}/friends`, {
				method: 'POST',
				credentials: 'include',
			})
			const data = await response.json().catch(() => null)
			if (response.status === 409 && data?.message) {
				setFriendSearchInput('')
				await Promise.all([loadFriends(user.username), loadFriendRequests()])
				setFriendActionSuccess(mapFriendMessage(data.message) || data.message)
				return
			}
			if (!response.ok || !data?.ok) {
				const friendly = mapFriendMessage(data?.message)
				throw new Error(friendly || t('save_error_generic'))
			}
			setFriendSearchInput('')
			await Promise.all([loadFriends(user.username), loadFriendRequests()])
			setFriendActionSuccess(t('save_success'))
		} catch (e) {
			setFriendActionError(e instanceof Error ? e.message : t('save_error_generic'))
		}
	}

	const changeLanguage = async (lang: string) => {
		try {
			await i18n.changeLanguage(lang)
			document.documentElement.dir = i18n.dir(lang)
			document.documentElement.lang = lang
		} catch (e) {
			console.warn('[Profile] failed to change language', e)
		}
	}

	const openUserProfile = (userId: string) => {
		navigate(`/profile/id/${encodeURIComponent(userId)}`)
	}

	return (
		<main className="page">
			<div className="shell profile-shell">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
					<p className="eyebrow">{t('profile_public_card')}</p>
					<button className="btn primary" type="button" onClick={() => navigate('/quiz')}>
						{t('start_quiz')}
					</button>
				</div>
				<div className="profile-layout">
					<section className="profile-card-preview">
						<div
							ref={dropZoneRef}
							className="profile-card-canvas"
							onDragOver={
								canEdit
									? (e) => {
										e.preventDefault()
										if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
									}
									: undefined
							}
							onDrop={canEdit ? handleDrop : undefined}
							style={{ background: bgColor }}
						>
							<div className="profile-card-avatar">
								<img
									src={resolveAvatarUrl(avatarUrl || DEFAULT_AVATAR)}
									alt={t('profile_avatar_alt', { name: userProfile.username })}
									onError={() => {
										if (avatarUrl) setAvatarUrl('')
									}}
								/>
							</div>
							<h2 className="profile-card-name">{userProfile.username}</h2>
							{description && <p className="profile-card-tagline">{description}</p>}
							<div className="profile-card-meta">
								{visibleBadges.map((id) => {
									const found = badgeOptions.find((opt) => opt.id === id)
									if (!found) return null
									return <span key={id}>{t(found.text)}</span>
								})}
							</div>

							{stickers.map((sticker) => (
								<button
									key={sticker.id}
									type="button"
									className="sticker-node"
									onDoubleClick={canEdit ? () => handleRemove(sticker.id) : undefined}
									style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
								>
									{sticker.url ? <img src={sticker.url} alt={sticker.symbol} /> : sticker.symbol}
								</button>
							))}
						</div>

						<div className="control-group">
							<p className="control-label">{t('profile_language_label')}</p>
							<div className="chip-row">
								{languages.map((lng) => {
									const active = i18n.language === lng.code
									return (
										<button
											key={lng.code}
											type="button"
											onClick={() => changeLanguage(lng.code)}
											className={`chip ${active ? 'chip-active' : ''}`}
										>
											{lng.lang}
										</button>
									)
								})}
							</div>
							{!canEdit && (
								<>
									<div className="actions" style={{ marginTop: '0.5rem' }}>
										<button
											className="btn ghost"
											type="button"
											onClick={() => navigate('/profile')}
										>
											{t('profile_back')}
										</button>
									</div>
									<p className="pref-desc">{t('profile_share_notice')}</p>
								</>
							)}
						</div>

						<div className="control-group">
							<p className="control-label">{t('profile_game_stats_title')}</p>
							<div className="profile-game-stats-grid">
								<div className="profile-stat-card profile-stat-card-kpi">
									<p className="stat-label">{t('profile_game_stats_kpi_accuracy')}</p>
									<p className="stat-value">{safeAccuracy}%</p>
								</div>
								<div className="profile-stat-card profile-stat-card-kpi">
									<p className="stat-label">{t('profile_game_stats_kpi_correct')}</p>
									<p className="stat-value">{correctAnswers}</p>
								</div>
								<div className="profile-stat-card profile-stat-card-kpi">
									<p className="stat-label">{t('profile_game_stats_kpi_answered')}</p>
									<p className="stat-value">{totalQuestions}</p>
								</div>
								<div className="profile-stat-card profile-stat-card-kpi">
									<p className="stat-label">{t('profile_game_stats_kpi_wins')}</p>
									<p className="stat-value">{gameStats.wins}</p>
								</div>
							</div>
						</div>

						<div className="control-group">
							<p className="control-label">{t('profile_achievements_title')}</p>
							{achievementsLoading ? (
								<p className="pref-desc">{t('profile_achievements_loading')}</p>
							) : (
								<>
									<p className="pref-desc">
										{t('profile_achievements_summary', {
											unlocked: achievements.summary.unlockedCount,
											total: achievements.summary.totalCount,
											points: achievements.summary.unlockedPoints,
											maxPoints: achievements.summary.totalPoints,
										})}
									</p>
									<div className="profile-achievements-track" role="progressbar" aria-valuenow={achievements.summary.progressPercent} aria-valuemin={0} aria-valuemax={100}>
										<div className="profile-achievements-fill" style={{ width: `${achievements.summary.progressPercent}%` }} />
									</div>
									<p className="pref-desc">{t('profile_achievements_progress', { percent: achievements.summary.progressPercent })}</p>

									<div className="profile-achievements-grid">
										{achievements.inProgress.map((achievement) => (
											<div key={achievement.key} className="profile-achievement-card">
												<p className="profile-achievement-title">{t(`achievement_${achievement.key}_title`)}</p>
												<p className="pref-desc">{t(`achievement_${achievement.key}_desc`, { target: achievement.target })}</p>
												<p className="pref-desc">{achievement.value} / {achievement.target} · {achievement.progressPercent}%</p>
											</div>
										))}
									</div>

									{achievements.unlocked.length > 0 && (
										<p className="pref-desc">{t('profile_achievements_unlocked_recent', { count: achievements.unlocked.length })}</p>
									)}
								</>
							)}
						</div>

						<div className="control-group">
							<p className="control-label">{t('profile_recent_matches_title')}</p>
							{recentMatchesLoading ? (
								<p className="pref-desc">{t('profile_recent_matches_loading')}</p>
							) : recentMatches.length === 0 ? (
								<p className="pref-desc">{t('profile_recent_matches_empty')}</p>
							) : (
								recentMatches.map((match) => (
									<div key={match.sessionId}>
										<p className="pref-desc">
											{t('profile_recent_match_summary', {
												score: match.score,
												correct: match.correctAnswers,
												total: match.totalQuestions,
											})}
										</p>
										<p className="pref-desc">
											{t('profile_recent_match_meta', {
												mode: match.mode,
												status: getMatchStatusLabel(match.status),
												date: formatMatchDate(match.endedAt || match.startedAt),
											})}
										</p>
									</div>
								))
							)}
						</div>

					</section>

					{canEdit && (
						<section className="profile-card-controls">
							<div className="panel-title">{t('profile_customize')}</div>
							<div className="control-group">
								<label className="control-label" htmlFor="profile-username-edit">
									{t('username')}
								</label>
								<div className="control-row">
									<input
										id="profile-username-edit"
										type="text"
										value={usernameInput}
										onChange={(e) => setUsernameInput(e.target.value)}
										placeholder={t('username_placeholder')}
										className="profile-desc-input"
										disabled={isSaving}
									/>
								</div>
								{usernameError && <p className="pref-desc" style={{ color: '#b91c1c' }}>{usernameError}</p>}
								{usernameSuccess && <p className="pref-desc" style={{ color: '#059669' }}>{usernameSuccess}</p>}
							</div>
							<div className="control-group">
								<label className="control-label" htmlFor="avatar-upload">
									{t('profile_avatar_label')}
								</label>
								<div className="control-row">
									<input
										ref={avatarInputRef}
										id="avatar-upload"
										type="file"
										accept="image/png,image/jpeg"
										onChange={handleAvatarChange}
										disabled={avatarUploading}
										style={{ display: 'none' }}
									/>
									<button
										type="button"
										className="btn ghost"
										onClick={handleBrowseAvatar}
										disabled={avatarUploading}
									>
										{t('profile_avatar_browse')}
									</button>
									<span className="pref-desc" style={{ margin: 0 }}>
										{selectedAvatarFileName || t('profile_avatar_no_file')}
									</span>
								</div>
								<p className="control-label" style={{ marginTop: '0.5rem' }}>{t('profile_avatar_defaults')}</p>
								<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
									{DEFAULT_AVATAR_CHOICES.map((avatarPath) => {
										const activeAvatar = avatarUrl || DEFAULT_AVATAR
										const isActive = activeAvatar === avatarPath
										return (
											<button
												key={avatarPath}
												type="button"
												onClick={() => void handleSelectDefaultAvatar(avatarPath)}
												disabled={avatarUploading}
												aria-label={avatarPath}
												style={{
													width: '44px',
													height: '44px',
													borderRadius: '8px',
													padding: 0,
													overflow: 'hidden',
													border: isActive ? '2px solid #2563eb' : '1px solid #d1d5db',
													background: 'transparent',
													cursor: avatarUploading ? 'not-allowed' : 'pointer',
												}}
											>
												<img
													src={avatarPath}
													alt={avatarPath}
													style={{ width: '100%', height: '100%', objectFit: 'cover' }}
												/>
											</button>
										)
									})}
								</div>
								<p className="pref-desc">
									{avatarUploading ? t('profile_avatar_uploading') : t('profile_avatar_hint')}
								</p>
								{avatarError && <p className="pref-desc" style={{ color: '#b91c1c' }}>{avatarError}</p>}
								{avatarSuccess && <p className="pref-desc" style={{ color: '#059669' }}>{t('profile_avatar_success')}</p>}
							</div>
							<div className="control-group">
								<label className="control-label" htmlFor="bg-picker">
									{t('profile_bg_label')}
								</label>
								<div className="control-row">
									<input
										id="bg-picker"
										type="color"
										value={bgColor}
										onChange={(e) => setBgColor(e.target.value)}
									/>
									<div className="swatch-row">
										{bgPresets.map((color) => (
											<button
												key={color}
												type="button"
												className="swatch"
												style={{ background: color }}
												onClick={() => setBgColor(color)}
												aria-label={color}
											/>
										))}
									</div>
								</div>
							</div>

							<div className="control-group">
								<p className="control-label">{t('profile_stickers_label')}</p>
								<div className="sticker-palette">
									{stickerPalette.map((sticker) => (
										<button
											key={sticker.id}
											type="button"
											draggable
											onDragStart={(e) => handleDragStart(e, { symbol: sticker.symbol, url: sticker.url })}
											onClick={() => addSticker({ symbol: sticker.symbol, url: sticker.url })}
											disabled={stickers.length >= MAX_STICKERS}
											className={`sticker-chip ${sticker.url ? 'sticker-chip-img' : ''}`}
											aria-label={sticker.symbol}
										>
											{sticker.url ? <img src={sticker.url} alt={sticker.symbol} /> : sticker.symbol}
										</button>
									))}
								</div>
								<p className="pref-desc">{t('profile_drag_tip')} {t('profile_remove_tip')}</p>
							</div>

							<div className="control-group">
								<label className="control-label" htmlFor="profile-description">
									{t('profile_desc_label')}
								</label>
								<input
									id="profile-description"
									type="text"
									maxLength={40}
									value={description}
									onChange={(e) => setDescription(e.target.value.slice(0, 40))}
									placeholder={t('profile_desc_placeholder')}
									className="profile-desc-input"
								/>
								<p className="pref-desc">{t('profile_desc_hint')}</p>
							</div>

							<div className="control-group">
								<p className="control-label">{t('profile_badges_label', { max: MAX_BADGES })}</p>
								<div className="chip-row">
									{badgeOptions.map((opt) => {
										const active = badges.includes(opt.id)
										const locked = !isBadgeUnlocked(opt)
										const blocked = !active && activeBadges.length >= MAX_BADGES
										const achievement = opt.requiredAchievementKey ? achievementByKey.get(opt.requiredAchievementKey) : null
										const questText = opt.requiredAchievementKey
											? t(`achievement_${opt.requiredAchievementKey}_desc`, { target: achievement?.target || 0 })
											: ''
										return (
											<button
												key={opt.id}
												type="button"
												onClick={() => toggleBadge(opt.id)}
												disabled={locked || blocked}
												title={locked ? t('profile_badge_unlock_tooltip', { quest: questText }) : undefined}
												className={`chip ${active ? 'chip-active' : ''}`}
												style={locked ? { opacity: 0.45, filter: 'grayscale(0.8)', cursor: 'not-allowed' } : undefined}
											>
												{locked ? `🔒 ${t(opt.text)}` : t(opt.text)}
											</button>
										)
									})}
								</div>
							</div>

							<div className="control-group">
								<div className="control-row theme-font-row">
									<ThemeSelector />
									<FontSelector />
								</div>
							</div>

							<div className="actions">
								<button className="btn ghost" type="button" onClick={handleReset}>
									{t('profile_reset')}
								</button>
								<button className="btn" type="button" onClick={handleSaveNow} disabled={isSaving}>
									{isSaving ? t('saving') : t('save')}
								</button>
								<button className="btn primary" type="button" onClick={() => navigate('/')}>
									{t('back')}
								</button>
							</div>
							{saveError && <p className="pref-desc" style={{ color: '#b91c1c' }}>{saveError}</p>}
							{saveSuccess && <p className="pref-desc" style={{ color: '#059669' }}>{t('save_success')}</p>}

							<p className="pref-desc profile-share-notice">{t('profile_share_notice')}</p>
						</section>
					)}

					{canEdit && (
						<section className="profile-friends-section">
							<div className="panel-title">{t('profile_friends_section')}</div>

							<div className="control-group">
								<label className="control-label" htmlFor="friend-search">
									{t('profile_add_friend')}
								</label>
								<div className="control-row">
									<input
										id="friend-search"
										type="text"
										value={friendSearchInput}
										maxLength={16}
										onChange={(e) => setFriendSearchInput(e.target.value)}
										placeholder={t('profile_username_placeholder')}
										className="profile-desc-input"
										onKeyDown={(e) => {
											if (e.key === 'Enter') void handleSendFriendRequest()
										}}
									/>
									<button
										className="btn primary"
										type="button"
										onClick={() => void handleSendFriendRequest()}
										disabled={!friendSearchInput.trim()}
									>
										{t('profile_send')}
									</button>
								</div>
								{friendActionError && <p className="pref-desc" style={{ color: '#b91c1c' }}>{friendActionError}</p>}
								{friendActionSuccess && <p className="pref-desc" style={{ color: '#059669' }}>{friendActionSuccess}</p>}
							</div>

							{friendRequests.filter((r) => r.type === 'received').length > 0 && (
								<div className="control-group">
									<p className="control-label">
										{t('profile_friend_requests', { count: friendRequests.filter((r) => r.type === 'received').length })}
									</p>
									<div className="friends-list">
										{friendRequests
											.filter((r) => r.type === 'received')
											.map((request) => (
												<div key={request.id} className="friend-item friend-request-item">
													<div className="friend-info">
														<div>
															<span
																className="friend-name"
																onClick={() => openUserProfile(request.id)}
																onKeyDown={(e) => {
																	if (e.key === 'Enter' || e.key === ' ') openUserProfile(request.id)
																}}
																role="button"
																tabIndex={0}
																style={{ cursor: 'pointer' }}
															>
																{request.username}
															</span>
															<span className={`friend-status ${request.status}`} style={{ color: request.status === 'online' ? '#059669' : '#b91c1c' }}>
																{request.status === 'online' ? `● ${t('profile_online')}` : `○ ${t('profile_offline')}`}
															</span>
														</div>
													</div>
													<div className="friend-actions">
														<button
															className="btn-icon btn-accept"
															type="button"
															onClick={() => void handleAcceptRequest(request.id)}
															title={t('profile_accept')}
															style={{ color: '#059669' }}
														>
															✓
														</button>
														<button
															className="btn-icon btn-decline"
															type="button"
															onClick={() => void handleDeclineRequest(request.id)}
															title={t('profile_decline')}
															style={{ color: '#b91c1c' }}
														>
															✕
														</button>
													</div>
												</div>
											))}
									</div>
								</div>
							)}

							{friendRequests.filter((r) => r.type === 'sent').length > 0 && (
								<div className="control-group">
									<p className="control-label">
										{t('profile_sent_requests', { count: friendRequests.filter((r) => r.type === 'sent').length })}
									</p>
									<div className="friends-list">
										{friendRequests
											.filter((r) => r.type === 'sent')
											.map((request) => (
												<div key={request.id} className="friend-item">
													<div className="friend-info">
														<div>
															<span
																className="friend-name"
																onClick={() => openUserProfile(request.id)}
																onKeyDown={(e) => {
																	if (e.key === 'Enter' || e.key === ' ') openUserProfile(request.id)
																}}
																role="button"
																tabIndex={0}
																style={{ cursor: 'pointer' }}
															>
																{request.username}
															</span>
															<span className={`friend-status ${request.status}`} style={{ color: request.status === 'online' ? '#059669' : '#b91c1c' }}>
																{request.status === 'online' ? `● ${t('profile_online')}` : `○ ${t('profile_offline')}`}
															</span>
														</div>
													</div>
												</div>
											))}
									</div>
								</div>
							)}

							<div className="control-group">
								<p className="control-label">{t('profile_my_friends', { count: friends.length })}</p>
								<div className="friends-list">
									{friends.length === 0 ? (
										<p className="pref-desc">{t('profile_no_friends')}</p>
									) : (
										friends.map((friend) => (
											<div key={friend.id} className="friend-item">
												<div className="friend-info">
													<div>
														<span
															className="friend-name"
															onClick={() => openUserProfile(friend.id)}
															onKeyDown={(e) => {
																if (e.key === 'Enter' || e.key === ' ') openUserProfile(friend.id)
															}}
															role="button"
															tabIndex={0}
															style={{ cursor: 'pointer' }}
														>
															{friend.username}
														</span>
														<span className={`friend-status ${friend.status}`} style={{ color: friend.status === 'online' ? '#059669' : '#b91c1c' }}>
															{friend.status === 'online' ? `● ${t('profile_online')}` : `○ ${t('profile_offline')}`}
														</span>
													</div>
												</div>
												<button
													className="btn-icon btn-remove"
													type="button"
													style={{ color: '#b91c1c' }}
													onClick={() => void handleRemoveFriend(friend.id)}
													title={t('profile_remove')}
												>
													✕
												</button>
											</div>
										))
									)}
								</div>
							</div>
						</section>
					)}
				</div>
				{canEdit && (
					<>
						<DataRequester />
						<DataDeleter />
					</>
				)}
			</div>
		</main>
	)
}

export default ProfilUser
