import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import { privacyContent, termsContent } from '../content/policies'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../content/LanguageSelector'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost/api'

type LeaderboardPlayer = {
	id: string
	username: string
	wins: number
}

const topics = (t: any) => [
	{ title: t('histoire'), detail: t('histoire_desc') },
	{ title: t('cinema_series'), detail: t('cinema_series_desc') },
	{ title: t('music'), detail: t('music_desc') },
]

const SpaceZone = [
	{ label: '\u00A0', value: ' ' }, //genere juste des espaces
	{ label: '\u00A0', value: ' ' },
	{ label: '\u00A0', value: ' ' }
]

function HomePage() {
	const { i18n } = useTranslation()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { user, login, signup, logout, isAuthenticated } = useAuth()
	const [showLogin, setShowLogin] = useState(false)
	const [showSignup, setShowSignup] = useState(false)
	const [show2fa, setShow2fa] = useState(false)
	const [policy, setPolicy] = useState<'privacy' | 'terms' | null>(null)
	const [loginError, setLoginError] = useState('')
	const [signupError, setSignupError] = useState('')
	const [code, setCode] = useState('');
	const [codeError, setCodeError] = useState('');
	const [userEmail, setUserEmail] = useState('');
	const [userUsername, setUserUsername] = useState('');
	const API_BASE = import.meta.env.AUTH_API_URL || 'https://localhost/api'
	const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
	const [leaderboardLoading, setLeaderboardLoading] = useState(false)
	const [leaderboardError, setLeaderboardError] = useState(false)

	const mapSignupError = (message?: string, errorCode?: string) => {
		const normalized = String(message || '').toLowerCase()
		const normalizedCode = String(errorCode || '').toUpperCase()
		if (normalizedCode === 'EMAIL_EXISTS' || normalized.includes('email already exists')) return t('signup_error_email_taken')
		if (normalizedCode === 'USERNAME_TAKEN' || normalized.includes('username already taken')) return t('signup_error_username_taken')
		if (normalized.includes('password != confirm password')) return t('signup_error_password_mismatch')
		if (normalized.includes('username should count between 3 & 16')) return t('signup_error_username_format')
		if (normalized.includes('password must be 12+ chars')) return t('signup_error_password_format')
		return message || t('error_occurred')
	}

	useEffect(() => {
		const abortController = new AbortController()

		const loadLeaderboard = async () => {
			setLeaderboardLoading(true)
			setLeaderboardError(false)
			try {
				const response = await fetch(`${API_BASE}/user/leaderboard/wins?limit=5`, { signal: abortController.signal })
				if (!response.ok) throw new Error('Failed to load leaderboard')
				const data = await response.json()
				const list = Array.isArray(data?.result) ? data.result : []
				const normalized: LeaderboardPlayer[] = list.slice(0, 5).map((player: { id: string | number; username?: string; wins?: number }) => ({
					id: String(player.id),
					username: String(player.username || '-'),
					wins: Number(player.wins || 0),
				}))
				setLeaderboard(normalized)
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') return
				if (error instanceof TypeError) return
				setLeaderboard([])
				setLeaderboardError(true)
			} finally {
				setLeaderboardLoading(false)
			}
		}

		void loadLeaderboard()
		return () => abortController.abort()
	}, [])

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoginError('')
		const form = e.currentTarget
		const email = (form.elements.namedItem('email') as HTMLInputElement).value
		const password = (form.elements.namedItem('password') as HTMLInputElement).value
		try {
			const response = await fetch(`${API_BASE}/auth/signin`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: 'include',
				body: JSON.stringify({
					email: email,
					password: password
				})
			})
			if (!response.ok) {
				const data = await response.json();
				setLoginError(data.error || "Something went wrong");
			} else {
				const signinData = await response.json().catch(() => null);
				const signedUsername = signinData?.user?.username || '';
				const authMail = await fetch(`${API_BASE}/auth/signin/mail`, {
					method: "POST",
					credentials: 'include',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: email,
						lang: i18n.language?.split('-')[0] || "en"
					})
				});

				setUserEmail(email);
				setUserUsername(signedUsername);
				let data;
				if (authMail.ok) {
					if (await login(email, signedUsername)) {
						setShowLogin(false);
						setCodeError('');
						setShow2fa(true);
					} else {
						data = await authMail.json();
						setLoginError(data.error || "Something went wrong");

					}
				} else {
					data = await authMail.json();
					setLoginError(data.error || "Something went wrong");
				}
			}
		} catch (e) {
			console.error('Error : ', e);
			setLoginError("Cannot connect to authentication server");
		}
	}

	const handleAuthCode = async () => {
		try {
			if (!code)
				alert('enter auth code please');
			console.log("code: ", code, "username: ", userUsername, "email: ", userEmail);
			const send = await fetch(`${API_BASE}/auth/verify-2fa`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					code: code,
					email: userEmail,
					username: userUsername
				})
			});

			if (send.ok) {
				setUserUsername('');
				setUserEmail('');
				console.log("ok")
				setShow2fa(false);
			} else {
				console.error("error")
				setCodeError("Something went wrong");
			}
		} catch (e) {
			setCodeError("Cannot connect to authentication server");
		}
	}

	const handleLogout = async () => {
		try {
			await logout()
		} catch (e) {
			console.error('Logout error:', e)
		}
	}

	const sendCodeAgain = async () => {
		try {
			const resp = await fetch(`${API_BASE}/auth/send`, {
				method: 'POST',
				headers: {
					"Content-Type": "application/json"
				},
				credentials: 'include',
				body: JSON.stringify({
					username: userUsername,
					email: userEmail,
					lang: i18n.language?.split('-')[0] || "en"
				})
			});

			if (!resp.ok) {
				setCodeError("send code again failed");
			}
		} catch (e) {
			setCodeError("Cannot connect to authentication server");
		}
	}

	const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setSignupError('')
		const username_regex = /^[a-zA-Z0-9_]{3,16}$/;
		const password_regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/;
		const form = e.currentTarget
		const email = (form.elements.namedItem('email') as HTMLInputElement).value
		const username = (form.elements.namedItem('username') as HTMLInputElement).value
		const password = (form.elements.namedItem('password') as HTMLInputElement).value
		const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value
		const newUser = {
			email: email,
			username: username,
			password: password
		}

		setUserEmail(email);
		setUserUsername(username);
		// password !== username
		if (password !== confirmPassword) {
			setSignupError(t('signup_error_password_mismatch'));
			return
		} else if (!username_regex.test(username)) {
			console.log("coucou");
			setSignupError(t('signup_error_username_format'));
			return
		} else if (!password_regex.test(password)) {
			setSignupError(t('signup_error_password_format'));
			return
		}

		try {
			const response = await fetch(`${API_BASE}/auth/signup`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: 'include',
				body: JSON.stringify({
					email: newUser.email,
					username: newUser.username,
					password: newUser.password
				})
			})

			const data = await response.json();

			if (!response.ok) {
				setSignupError(mapSignupError(data.error, data.errorCode));
				console.log("data error: ", data.error);
				return
			} else {
				const success = await signup(email, username, password)
				if (success) {
					const authMail = await fetch(`${API_BASE}/auth/signup/mail`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						credentials: 'include',
						body: JSON.stringify({
							email: newUser.email,
							username: newUser.username,
							lang: i18n.language?.split('-')[0] || "en"
						})
					});

					const data = await authMail.json();

					if (authMail.ok) {
						if (await login(email, username)) {
							setUserUsername(username);
							setUserEmail(email);
							setCodeError('');
							setShowSignup(false);
							setShow2fa(true);
						} else
							setSignupError(data.error || "Something went wrong");
					} else {
						setSignupError(data.error || "Something went wrong");
					}
				}
			}
		} catch (e) {
			console.error('Error: ', e)
			setSignupError("Cannot connect to authentication server");
		}
	}
	return (
		<main className="page home-page">
			{!isAuthenticated && <LanguageSelector />}
			<div className="login-bar">
				{isAuthenticated ? (
					<>
						<div className="login-welcome">
							<span className="login-welcome__text">
								{t('welcome')}, {user?.username}!
							</span>
							<a className="login-welcome__logout" onClick={() => void handleLogout()}>
								{t("logout")}
							</a>
						</div>
						<button className="btn login" onClick={() => navigate('/profile')}>
							{t("profile")}
						</button>
					</>
				) : (
					<>
						<button className="btn login" onClick={() => setShowLogin(true)}>
							{t("connect")}
						</button>
						<button className="btn primary" onClick={() => setShowSignup(true)}>
							{t("signup")}
						</button>
					</>
				)}
			</div>
			<div className="home-main-layout">
				<div className="shell home-shell">
					<p className="eyebrow">Quiz Sprint</p>
					<div className="hero">
						<div className="copy">
							<h1>{t("ready")}</h1>
							<p className="lede">
								{t("tagline")}
							</p>
							<div className="actions">
								<button className="btn primary" onClick={() => navigate('/quiz')}>
									{t("start_quiz")}
								</button>
							</div>
							<div className="SpaceZone">
								{SpaceZone.map((item, index) => (
									<div key={`${item.label}-${index}`} className="highlight">
										<span className="label">{item.label}</span>
										<span className="value">{item.value}</span>
									</div>
								))}
							</div>
						</div>
						<div className="panel">
							<div className="panel-title">  </div>
							<div className="grid">
								{topics(t).map((topic) => (
									<article key={topic.title} className="card">
										<div className="card-head">{topic.title}</div>
										<p className="card-body">{topic.detail}</p>
									</article>
								))}
							</div>
						</div>
					</div>
				</div>

				<aside className="home-leaderboard-side" aria-label={t('profile_leaderboard_title')}>
					<article className="card home-leaderboard-card">
						<div className="card-head">{t('profile_leaderboard_title')}</div>
						{leaderboardLoading ? (
							<p className="card-body">{t('profile_leaderboard_loading')}</p>
						) : leaderboardError ? (
							<p className="card-body">{t('profile_leaderboard_unavailable')}</p>
						) : leaderboard.length === 0 ? (
							<p className="card-body">{t('profile_leaderboard_empty')}</p>
						) : (
							leaderboard.map((player, index) => (
								<p key={player.id} className="home-leaderboard-row">
									{t('profile_leaderboard_row', {
										rank: index + 1,
										username: player.username,
										wins: player.wins,
									})}
								</p>
							))
						)}
					</article>
				</aside>
			</div>

			{!isAuthenticated && <LanguageSelector />}
			<div className="login-bar">
				{isAuthenticated ? (
					<>
						<div className="login-welcome">
							<span className="login-welcome__text">
								{t('welcome')}, {user?.username}!
							</span>
							<a className="login-welcome__logout" onClick={() => void handleLogout()}>
								{t("logout")}
							</a>
						</div>
						<button className="btn login" onClick={() => navigate('/profile')}>
							{t("profile")}
						</button>
					</>
				) : (
					<>
						<button className="btn login" onClick={() => setShowLogin(true)}>
							{t("connect")}
						</button>
						<button className="btn primary" onClick={() => setShowSignup(true)}>
							{t("signup")}
						</button>
					</>
				)}
			</div>
			<footer className="footer">
				<div className="footer__inner">
					<div>
						<p className="eyebrow small">Quiz Sprint</p>
						<p className="footer__lede">{t("footer_tagline")}</p>
					</div>
					<div className="footer__links">
						<a href="#">{t("about")}</a>
						<a href="#">{t("faq")}</a>
						<a href="#">{t("contact")}</a>
						<a
							href="#"
							onClick={(e) => {
								e.preventDefault()
								setPolicy('privacy')
							}}
						>
							{t("privacy_policy")}
						</a>
						<a
							href="#"
							onClick={(e) => {
								e.preventDefault()
								setPolicy('terms')
							}}
						>
							{t("terms")}
						</a>
					</div>
				</div>
			</footer>

			{/* Modal d'affichage des politiques (Privacy / Terms) */}
			{policy && (
				<div className="login-overlay" role="dialog" aria-modal="true">
					<div className="login-card">
						<div className="login-card__head">
							<div>
								<p className="eyebrow small">
									{policy === 'privacy' ? t("privacy_policy") : t("terms")}
								</p>
								<h2>{policy === 'privacy' ? t("privacy_policy") : t("terms")}</h2>
							</div>
							<button className="close" aria-label="Fermer" onClick={() => setPolicy(null)}>
								×
							</button>
						</div>
						<div className="policy-content">{policy === 'privacy' ? privacyContent : termsContent}</div>
					</div>
				</div>
			)}

			{showLogin && (
				<div className="login-overlay" role="dialog" aria-modal="true">
					<div className="login-card">
						<div className="login-card__head">
							<div>
								<p className="eyebrow small">{t("login_title")}</p>
								<h2>{t("login_subtitle")}</h2>
							</div>
							<button className="close" aria-label={t("close")} onClick={() => setShowLogin(false)}>
								×
							</button>
						</div>
						<form className="login-form" onSubmit={handleLogin}>
							{loginError && <div style={{ color: 'red', marginBottom: '1rem' }}>{loginError}</div>}
							<label className="field">
								<span>{t("email")}</span>
								<input type="email" name="email" placeholder={t("email_placeholder")} required />
							</label>
							<label className="field">
								<span>{t("password")}</span>
								<input type="password" name="password" placeholder={t("password_placeholder")} required />
							</label>
							<button type="submit" className="btn primary full">
								{t("login_button")}
							</button>
						</form>
					</div>
				</div>
			)}

			{show2fa && (
				<div className='auth-overlay' role='dialog' aria-modal='true'>
					<div className='login-card'>
						<h1>{t("Code authentication")}</h1>
						<form className='login-form'>
							{codeError && <div style={{ color: 'red', marginBottom: '1rem' }}>{codeError}</div>}
							<p>{t("A 6-digits code has been sent at your email adress")}</p>
							<label className='field'>
								<input type="text" id="verify-token" placeholder="XXXXXX" onChange={(e) => (setCode(e.target.value))} required />
							</label>
						</form>
						<button type="submit" onClick={sendCodeAgain} className='btn primary full'>{t("send code again")}</button>
						<button type="submit" onClick={handleAuthCode} className="btn primary full">
							{t("GO !")}
						</button>

					</div>
				</div>
			)}

			{showSignup && (
				<div className="login-overlay" role="dialog" aria-modal="true">
					<div className="login-card">
						<div className="login-card__head">
							<div>
								<p className="eyebrow small">{t("signup_title")}</p>
								<h2>{t("signup_subtitle")}</h2>
							</div>
							<button className="close" aria-label={t("close")} onClick={() => setShowSignup(false)}>
								×
							</button>
						</div>
						<form className="login-form" onSubmit={(e) => { handleSignup(e), e.preventDefault() }}>
							{signupError && <div style={{ color: 'red', marginBottom: '1rem' }}>{signupError}</div>}
							<label className="field">
								<span>{t("email")}</span>
								<input type="email" name="email" placeholder={t("email_placeholder")} required />
							</label>
							<label className="field">
								<span>{t("username")}</span>
								<input type="text" name="username" placeholder={t("username_placeholder")} required />
							</label>
							<label className="field">
								<span>{t("password")}</span>
								<input type="password" name="password" placeholder={t("password_placeholder")} required />
							</label>
							<label className="field">
								<span>{t("confirm_password")}</span>
								<input type="password" name="confirmPassword" placeholder={t("password_placeholder")} required />
							</label>
							<button type="submit" className="btn primary full">
								{t("signup_button")}
							</button>
						</form>
					</div>
				</div>
			)}
		</main>
	)
}

export default HomePage
