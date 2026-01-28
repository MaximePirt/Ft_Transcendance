import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import '../App.css'

const languages = [
	{ code: 'fr', lang: 'Français' },
	{ code: 'en', lang: 'English' },
	{ code: 'ar', lang: 'العربية' },
]


//en attendant la data base
const userProfile = {
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
	type: 'received' | 'sent'
}

// Données temporaires pour les amis
const UserFriends: Friend[] = [
	{ id: '1', username: 'tototrucmuche', status: 'online' },
	{ id: '2', username: 'footlover95', status: 'offline' },
	{ id: '3', username: 'ft_joy', status: 'online' },
]

const UserFriendRequests: FriendRequest[] = [
	{ id: '4', username: '123', type: 'received' },
	{ id: '5', username: 'ff', type: 'received' },
]

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
	{ id: 'jeux_video', symbol: '🎮', url: '/theme-icons/Jeux%20vid%C3%A9o.png' },
    { id: 'jeux_video2', symbol: '🎮', url: '/theme-icons/Jeux%20vid%C3%A9o.gif' },
]

const bgPresets = ['#0f0f10', '#111827', '#1f2937', '#0b5fff', '#8b5cf6', '#10b981', '#eab308']

const titleOptions: TitleOption[] = [
	{ id: 'cinema', text: 'profile_title_cinema' },
	{ id: 'quiz_master', text: 'profile_title_quiz_master' },
	{ id: 'speedrunner', text: 'profile_title_speedrunner' },
	{ id: 'pixel', text: 'profile_title_pixel' },
	{ id: 'music', text: 'profile_title_music' },
]

type CardState = {
	bgColor: string
	stickers: Sticker[]
	titles: string[]
	description: string
}

const STORAGE_KEY = 'profileCard'
const MAX_STICKERS = 3
const MAX_TITLES = 2

function ProfilUser() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const dropZoneRef = useRef<HTMLDivElement | null>(null)
	const [bgColor, setBgColor] = useState('#0f0f10')
	const [stickers, setStickers] = useState<Sticker[]>([])
	const [titles, setTitles] = useState<string[]>([titleOptions[0].id, titleOptions[1].id])
	const [description, setDescription] = useState('')
	const [hydrated, setHydrated] = useState(false)
	const [friends, setFriends] = useState<Friend[]>(UserFriends)
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(UserFriendRequests)
	const [friendSearchInput, setFriendSearchInput] = useState('')

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			if (!raw) {
				setHydrated(true)
				return
			}
			const parsed = JSON.parse(raw) as CardState
			if (parsed.bgColor) setBgColor(parsed.bgColor)
			if (Array.isArray(parsed.stickers)) setStickers(parsed.stickers)
			if (Array.isArray(parsed.titles) && parsed.titles.length) setTitles(parsed.titles.slice(0, MAX_TITLES))
			if (typeof parsed.description === 'string') setDescription(parsed.description.slice(0, 40))
		} catch (e) {
			console.warn('[ProfileCard] failed to load saved state', e)
		} finally {
			setHydrated(true)
		}
	}, [])

	useEffect(() => {
		document.body.dir = i18n.dir()
	}, [i18n, i18n.language])

	useEffect(() => {
		if (!hydrated) return
		const payload: CardState = { bgColor, stickers, titles, description }
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
		} catch (e) {
			console.warn('[ProfileCard] failed to save state', e)
		}
	}, [bgColor, stickers, titles, description, hydrated])

	type StickerPayload = { symbol: string; url?: string }

	const addSticker = (payload: StickerPayload, x = 50, y = 50) => {
		setStickers((prev) => {
			if (prev.length >= MAX_STICKERS) return prev
			return [...prev, { id: `${Date.now()}-${prev.length}`, symbol: payload.symbol, url: payload.url, x, y }]
		})
	}

	const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, payload: StickerPayload) => {
		e.dataTransfer.setData('application/json', JSON.stringify(payload))
		e.dataTransfer.effectAllowed = 'copy'
	}

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
		setStickers([])
		setBgColor('#0f0f10')
		setTitles([titleOptions[0].id, titleOptions[1].id])
		setDescription('')
		try {
			localStorage.removeItem(STORAGE_KEY)
		} catch (e) {
			console.warn('[ProfileCard] failed to clear storage', e)
		}
	}

	const toggleTitle = (id: string) => {
		setTitles((prev) => {
			if (prev.includes(id)) return prev.filter((t) => t !== id)
			if (prev.length >= MAX_TITLES) return prev
			return [...prev, id]
		})
	}

	const handleRemove = (id: string) => {
		setStickers((prev) => prev.filter((s) => s.id !== id))
	}

	const handleAcceptRequest = (id: string) => {
		const request = friendRequests.find((r) => r.id === id)
		if (!request) return
		setFriends((prev) => [...prev, { id: request.id, username: request.username, status: 'online' }])
		setFriendRequests((prev) => prev.filter((r) => r.id !== id))
	}

	const handleDeclineRequest = (id: string) => {
		setFriendRequests((prev) => prev.filter((r) => r.id !== id))
	}

	const handleRemoveFriend = (id: string) => {
		setFriends((prev) => prev.filter((f) => f.id !== id))
	}

	const handleSendFriendRequest = () => {
		if (!friendSearchInput.trim()) return
		// TODO: Envoyer la requête au backend
		console.log('Demande envoyée à:', friendSearchInput)
		setFriendSearchInput('')
	}

	const changeLanguage = (lang: string) => {
		i18n.changeLanguage(lang)
		localStorage.setItem('language', lang)
		document.body.dir = i18n.dir()
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
								onDragOver={(e) => {
									e.preventDefault()
									if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
								}}
								onDrop={handleDrop}
								style={{ background: bgColor }}
							>
							<div className="profile-card-avatar" aria-hidden>
								{userProfile.username.slice(0, 1)}
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
									onDoubleClick={() => handleRemove(sticker.id)}
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
						</div>

					</section>

					<section className="profile-card-controls">
						<div className="panel-title">{t('profile_customize')}</div>
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

						<div className="actions">
							<button className="btn ghost" type="button" onClick={handleReset}>
								{t('profile_reset')}
							</button>
							<button className="btn primary" type="button" onClick={() => navigate('/quiz')}>
								{t('back')}
							</button>
						</div>

						<p className="pref-desc profile-share-note">{t('profile_share_notice')}</p>
					</section>

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
									if (e.key === 'Enter') handleSendFriendRequest()
								}}
							/>
							<button
								className="btn primary"
								type="button"
								onClick={handleSendFriendRequest}
								disabled={!friendSearchInput.trim()}
							>
								{t('profile_send')}
								</button>
							</div>
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
													{/*TODO : gere les avatars*/}
													<div className="friend-avatar">{request.username.slice(0, 1)}</div>
													<span className="friend-name">{request.username}</span>
												</div>
												<div className="friend-actions">
													<button
														className="btn-icon btn-accept"
														type="button"
														onClick={() => handleAcceptRequest(request.id)}
														title={t('profile_accept')}
													>
														✓
													</button>
													<button
														className="btn-icon btn-decline"
														type="button"
														onClick={() => handleDeclineRequest(request.id)}
														title="Refuser"
													>
														✕
													</button>
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
												<div className="friend-avatar">{friend.username.slice(0, 1)}</div>
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
												onClick={() => handleRemoveFriend(friend.id)}
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
				</div>
			</div>
		</main>
	)
}

export default ProfilUser