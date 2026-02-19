import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ThemeSelector from '../content/ThemeSelector'
import FontSelector from '../content/FontSelector'
import '../App.css'
import DataRequester from '../content/DataRequester'

async function applyTheme(themeName: string) {
	console.log(`${themeName}.json`)
	try {
		const res = await fetch(`/themes/styles/${themeName}.json`)
		const themeToApply = await res.json()

		const root = document.documentElement
		Object.entries(themeToApply.variables).forEach(([key, value]) => {
			root.style.setProperty(key, value as string)
		})
	} catch (err) {
		console.error(`Erreur lors du chargement du thème "${themeName}"`, err)
		if (themeName !== 'default') return applyTheme('default')
		return
	}
}

async function applyFont(fontName: string) {
	console.log(`${fontName}.json`)
	try {
		const res = await fetch(`/themes/fonts/${fontName}.json`)
		const themeToApply = await res.json()

		const root = document.documentElement
		Object.entries(themeToApply.variables).forEach(([key, value]) => {
			root.style.setProperty(key, value as string)
		})
	} catch (err) {
		console.error(`Erreur lors du chargement du thème "${fontName}"`, err)
		if (fontName !== 'default') return applyFont('default')
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
	username: 'PlayerOne',
	email: 'player@quiz.sprint',
	joinYear: 2024,
	stats: {
		gamesPlayed: 42,
		winRate: 68,
		bestScore: 9860,
		streak: 7,
	},
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

type TitleOption = {
	id: string
	text: string
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

const titleOptions: TitleOption[] = [
	{ id: 'cinema', text: 'profile_title_cinema' },
	{ id: 'quiz_master', text: 'profile_title_quiz_master' },
	{ id: 'speedrunner', text: 'profile_title_speedrunner' },
	{ id: 'pixel', text: 'profile_title_pixel' },
	{ id: 'music', text: 'profile_title_music' },
]

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost/api'
const DEFAULT_AVATAR = '/avatar/Default.png'

type CardState = {
	bgColor: string
	stickers: Sticker[]
	titles: string[]
	description: string
	preferredLanguage?: string
}

const MAX_STICKERS = 3
const MAX_TITLES = 2

function ProfilUser() {
	const navigate = useNavigate()
	const { username: routeUsername } = useParams()
	const { t, i18n } = useTranslation()
	const { user, isAuthenticated, isAuthReady } = useAuth()
	const isPublicView = Boolean(routeUsername) && routeUsername !== user?.username
	const canEdit = !isPublicView
	const profileUsername = routeUsername || user?.username || ''
	const dropZoneRef = useRef<HTMLDivElement | null>(null)
	const previousThemeRef = useRef<string | null>(null)
	const previousFontRef = useRef<string | null>(null)
	const [bgColor, setBgColor] = useState('#0f0f10')
	const [stickers, setStickers] = useState<Sticker[]>([])
	const [titles, setTitles] = useState<string[]>([titleOptions[0].id, titleOptions[1].id])
	const [description, setDescription] = useState('')
	const [preferredLanguage, setPreferredLanguage] = useState(i18n.language)
	const [hydrated, setHydrated] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [saveError, setSaveError] = useState('')
	const [saveSuccess, setSaveSuccess] = useState(false)
	const [avatarUrl, setAvatarUrl] = useState('')
	const [avatarUploading, setAvatarUploading] = useState(false)
	const [avatarError, setAvatarError] = useState('')
	const [avatarSuccess, setAvatarSuccess] = useState(false)
	const [friends, setFriends] = useState<Friend[]>([])
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
	const [friendSearchInput, setFriendSearchInput] = useState('')
	const [friendActionError, setFriendActionError] = useState('')
	const [friendActionSuccess, setFriendActionSuccess] = useState('')
	const [userProfile, setUserProfile] = useState(defaultUserProfile)

	const mapFriendMessage = (message?: string) => {
		const normalized = (message || '').toLowerCase()
		if (normalized.includes('user not found')) return t('profile_friend_user_not_found')
		if (normalized.includes('already friend')) return t('profile_friend_already_friend')
		if (normalized.includes('already sent')) return t('profile_friend_request_already_sent')
		if (normalized.includes('no auth cookie') || normalized.includes('unauthorized')) return t('save_error_not_authenticated')
		return ''
	}

	const loadFriends = async (username: string) => {
		const userIdResponse = await fetch(`${API_BASE}/user/userid/${encodeURIComponent(username)}`)
		if (!userIdResponse.ok) throw new Error('Failed to resolve user id')
		const { id } = await userIdResponse.json()

		const response = await fetch(`${API_BASE}/user/${id}/friends`)
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

	const loadFriendRequests = async () => {
		const response = await fetch(`${API_BASE}/user/friends/requests`, {
			credentials: 'include',
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
				stats: {
					gamesPlayed: 42,
					winRate: 68,
					bestScore: 9860,
					streak: 7,
				},
				favorites: ['cinema', 'music', 'computer_science'],
			})
		}
	}, [user, isPublicView])

	useEffect(() => {
		if (!isPublicView) return
		previousThemeRef.current = localStorage.getItem('theme') || 'default'
		previousFontRef.current = localStorage.getItem('font') || 'default'
		return () => {
			const prevTheme = previousThemeRef.current || 'default'
			const prevFont = previousFontRef.current || 'default'
			applyTheme(prevTheme)
			applyFont(prevFont)
		}
	}, [isPublicView])

	useEffect(() => {
		if (!profileUsername) return
		
		// Charger les données depuis le serveur en priorité
		const loadProfileCard = async () => {
			try {
				const userIdResponse = await fetch(`${API_BASE}/user/userid/${profileUsername}`)
				if (!userIdResponse.ok) throw new Error('Failed to resolve user id')
				const { id } = await userIdResponse.json()

				const response = await fetch(`${API_BASE}/user/users/${id}`)
				if (response.ok) {
					const userData = await response.json()
					setUserProfile({
						username: userData.username || profileUsername,
						email: userData.email || '',
						joinYear: new Date(userData.created_at || Date.now()).getFullYear(),
						stats: {
							gamesPlayed: 42,
							winRate: 68,
							bestScore: 9860,
							streak: 7,
						},
						favorites: ['cinema', 'music', 'computer_science'],
					})
					setAvatarUrl(normalizeAvatarUrl(userData.avatarUrl))
					let parsedStickers: Sticker[] = []
					let parsedTitles: string[] = [titleOptions[0].id, titleOptions[1].id]
					
					// Charger les données de personnalisation depuis le serveur
					if (userData.profileCardBgColor) setBgColor(userData.profileCardBgColor)
					
					if (userData.profileCardStickers) {
						try {
							const parsed = JSON.parse(userData.profileCardStickers)
							if (Array.isArray(parsed)) {
								parsedStickers = parsed
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
								parsedTitles = parsed
								setTitles(parsed.slice(0, MAX_TITLES))
							}
						} catch (e) {
							console.warn('Failed to parse titles', e)
						}
					}
					
					if (userData.profileCardDescription) {
						setDescription(userData.profileCardDescription.slice(0, 40))
					}
					
					if (userData.preferredLanguage) {
						setPreferredLanguage(userData.preferredLanguage)
					}

					if (canEdit) {
						if (userData.theme) localStorage.setItem('theme', userData.theme)
						if (userData.font) localStorage.setItem('font', userData.font)
					}

					if (isPublicView) {
						const themeToApply = userData.theme || 'default'
						const fontToApply = userData.font || 'default'
						applyTheme(themeToApply)
						applyFont(fontToApply)
					}
					
					setHydrated(true)
					return
				}
			} catch (e) {
				console.warn('[ProfileCard] failed to load from server, trying localStorage', e)
			}
			setHydrated(true)
		}
		
		loadProfileCard()
	}, [profileUsername, canEdit, isPublicView])

	useEffect(() => {
		if (!user || !canEdit) return
		const hydrateFriends = async () => {
			try {
				await Promise.all([loadFriends(user.username), loadFriendRequests()])
			} catch (e) {
				console.warn('[Profile] failed to load social data', e)
			}
		}

		hydrateFriends()
	}, [user, canEdit])

	useEffect(() => {
		document.body.dir = i18n.dir()
	}, [i18n, i18n.language])

	// Auto-save désactivé (sauvegarde manuelle uniquement)

	const handleSaveNow = async () => {
		if (!user || !canEdit) return
		setIsSaving(true)
		setSaveError('')
		setSaveSuccess(false)
		try {
			const res = await saveProfileToServer()
			if (!res.ok) throw new Error(res.error || t('save_error_generic'))
			setPreferredLanguage(i18n.language)
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
			setAvatarError('')
			setAvatarSuccess(false)
		if (file.size > 2 * 1024 * 1024) {
			setAvatarError(t('profile_avatar_error_size'))
			e.target.value = ''
			return
		}
		if (!['image/png', 'image/jpeg'].includes(file.type)) {
			setAvatarError(t('profile_avatar_error_type'))
			e.target.value = ''
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
		} catch (err) {
			setAvatarError(err instanceof Error ? err.message : t('profile_avatar_error_generic'))
		} finally {
			setAvatarUploading(false)
		}
	}

	const handleAvatarReset = async () => {
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
			const resetResponse = await fetch(`${API_BASE}/user/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ avatarUrl: DEFAULT_AVATAR }),
			})
			if (!resetResponse.ok) {
				const text = await resetResponse.text()
				throw new Error(t('profile_avatar_error_api', { status: resetResponse.status, detail: text || '-' }))
			}
			setAvatarUrl(DEFAULT_AVATAR)
			setAvatarSuccess(true)
		} catch (err) {
			setAvatarError(err instanceof Error ? err.message : t('profile_avatar_error_generic'))
		} finally {
			setAvatarUploading(false)
		}
	}

	const saveProfileToServer = async (): Promise<{ ok: boolean; error?: string }> => {
		if (!user) return { ok: false, error: t('save_error_not_authenticated') }
		const langToSave = i18n.language
		const userResponse = await fetch(`${API_BASE}/user/userid/${user.username}`)
		if (!userResponse.ok) {
			const text = await userResponse.text()
			return {
				ok: false,
				error: t('save_error_user_id', { status: userResponse.status, detail: text || '-' }),
			}
		}
		const { id } = await userResponse.json()

		const response = await fetch(`${API_BASE}/user/${id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				profileCardBgColor: bgColor,
				profileCardStickers: JSON.stringify(stickers),
				profileCardTitles: JSON.stringify(titles),
				profileCardDescription: description,
				preferredLanguage: langToSave,
				theme: localStorage.getItem('theme') || 'default',
				font: localStorage.getItem('font') || 'default',
			})
		})

		if (!response.ok) {
			const text = await response.text()
			return {
				ok: false,
				error: t('save_error_api', { status: response.status, detail: text || '-' }),
			}
		}

		return { ok: true }
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
		setTitles([titleOptions[0].id, titleOptions[1].id])
		setDescription('')
		localStorage.setItem('theme', 'default')
		localStorage.setItem('font', 'default')
		applyTheme('default')
		applyFont('default')
		window.dispatchEvent(new CustomEvent('theme-font-reset'))
	}

	const toggleTitle = (id: string) => {
		if (!canEdit) return
		setTitles((prev) => {
			if (prev.includes(id)) return prev.filter((t) => t !== id)
			if (prev.length >= MAX_TITLES) return prev
			return [...prev, id]
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
		setFriendActionError('')
		setFriendActionSuccess('')
		if (friendUsername === user.username) {
			setFriendActionError(t('save_error_generic'))
			return
		}
		try {
			const userIdResponse = await fetch(`${API_BASE}/user/userid/${encodeURIComponent(friendUsername)}`)
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
			if (canEdit) setPreferredLanguage(lang)
			document.body.dir = i18n.dir(lang)
			document.documentElement.lang = lang
		} catch (e) {
			console.warn('[Profile] failed to change language', e)
		}
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
								{titles.slice(0, MAX_TITLES).map((id) => {
									const found = titleOptions.find((opt) => opt.id === id)
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
								<p className="pref-desc">{t('profile_share_notice')}</p>
							)}
						</div>

					</section>

					{canEdit && (
						<section className="profile-card-controls">
						<div className="panel-title">{t('profile_customize')}</div>
						<div className="control-group">
							<label className="control-label" htmlFor="avatar-upload">
								{t('profile_avatar_label')}
							</label>
							<div className="control-row">
								<input
									id="avatar-upload"
									type="file"
									accept="image/png,image/jpeg"
									onChange={handleAvatarChange}
									disabled={avatarUploading}
								/>
							</div>
							<div className="control-row" style={{ marginTop: '0.5rem', alignItems: 'center', gap: '0.75rem' }}>
								<button
									type="button"
									className="btn ghost"
									onClick={() => void handleAvatarReset()}
									disabled={avatarUploading}
									title={t('profile_avatar_reset')}
									aria-label={t('profile_avatar_reset')}
								>
									<img
										src={DEFAULT_AVATAR}
										alt={t('profile_avatar_default_preview')}
										style={{ width: '24px', height: '24px', borderRadius: '9999px', marginRight: '0.5rem' }}
									/>
									{t('profile_avatar_reset')}
								</button>
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
								<p className="control-label">{t('profile_titles_label', { max: MAX_TITLES })}</p>
								<div className="chip-row">
									{titleOptions.map((opt) => {
										const active = titles.includes(opt.id)
										const blocked = !active && titles.length >= MAX_TITLES
										return (
											<button
												key={opt.id}
												type="button"
												onClick={() => toggleTitle(opt.id)}
												disabled={blocked}
												className={`chip ${active ? 'chip-active' : ''}`}
											>
											{t(opt.text)}
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
														<span className="friend-name">{request.username}</span>
														<span className={`friend-status ${request.status}`}>
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
													>
														✓
													</button>
													<button
														className="btn-icon btn-decline"
														type="button"
														onClick={() => void handleDeclineRequest(request.id)}
														title={t('profile_decline')}
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
														<span className="friend-name">{request.username}</span>
														<span className={`friend-status ${request.status}`}>
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
													<span className="friend-name">{friend.username}</span>
													<span className={`friend-status ${friend.status}`}>
													{friend.status === 'online' ? `● ${t('profile_online')}` : `○ ${t('profile_offline')}`}
													</span>
												</div>
											</div>
											<button
												className="btn-icon btn-remove"
												type="button"
												onClick={() => void handleRemoveFriend(friend.id)}
												title="Retirer"
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
				<DataRequester />
			</div>
		</main>
	)
}

export default ProfilUser