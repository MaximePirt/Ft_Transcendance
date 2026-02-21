import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import { privacyContent, termsContent } from '../content/policies'
import { useTranslation } from 'react-i18next';
import LanguageSelector from './../content/LanguageSelector.tsx'
import { useAuth } from '../contexts/AuthContext'

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

interface User {
	email: string,
	username: string,
	password: string
}

function HomePage() {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { user, login, signup, logout, isAuthenticated } = useAuth()
	const [showLogin, setShowLogin] = useState(false)
	const [showSignup, setShowSignup] = useState(false)
	const [show2fa, setShow2fa] = useState(false)
	const [policy, setPolicy] = useState<'privacy' | 'terms' | null>(null)
	const [loginError, setLoginError] = useState('')
	const [signupError, setSignupError] = useState('')
	const message = useRef<HTMLDivElement>(null);
	const qrCode = useRef<HTMLDivElement>(null);

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoginError('')
		const form = e.currentTarget
		const email = (form.elements.namedItem('email') as HTMLInputElement).value
		const password = (form.elements.namedItem('password') as HTMLInputElement).value

		try {
			const response = await fetch("https://localhost/auth/signin", {
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
				throw new Error('Something went wrong');
			}
			else
				console.log('user connected')

			const success = await login(email, password)
			if (success) {
				setShowLogin(false)
			} else {
				setLoginError(t('login_error') || 'Erreur de connexion')
			}
		} catch (e) {
			console.error('Error : ', e);
		}

	}

	const handleLogout = async () => {
		try {
			const response = await fetch("https://localhost/auth/logout", {
				method: "POST",
				credentials: "include"
			});
			if (!response.ok) {
				throw new Error();
			}
			logout();
		} catch (e) {
			console.error(e);
		}
	}

	const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setSignupError('')
		const password_regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/;
		const form = e.currentTarget
		const email = (form.elements.namedItem('email') as HTMLInputElement).value
		const username = (form.elements.namedItem('username') as HTMLInputElement).value
		const password = (form.elements.namedItem('password') as HTMLInputElement).value
		const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value
		const newUser: User = {
			email: email,
			username: username,
			password: password
		}

		if (password !== confirmPassword) {
			setSignupError(t('passwords do not match') || 'Les mots de passe ne correspondent pas')
			return
		} else if (!password_regex.test(password)) {
			setSignupError(t('Password must be 12+ chars, include an uppercase, a number, and a special character.'))
			return
		}

		try {
			const response = await fetch("https://localhost/auth/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: newUser.email,
					username: newUser.username,
					password: newUser.password
				})
			})
			if (!response.ok) {
				const err = await response.json();
				setSignupError(err.error)
				throw new Error(err.body.error);
			} else {
				const data = await response.json();
				if (qrCode.current) {
					qrCode.current.innerHTML = `
						<img src="${data.imageUrl}" alt="QR code">
						<p>Secret: ${data.secret}</p>
					`;
				}
				if (message.current) {
					message.current.innerHTML = `
						<p>Registration successful</p>
					`;
				}
				const success = await signup(email, username, password)
				if (success) {
					setShowSignup(false)
				} else {
					setSignupError(t('signup_error') || 'Erreur lors de l\'inscription')
				}
			}
		} catch (e) {
			console.error('Error: ', e)
		}
	}

	return (
		<main className="page">
			<LanguageSelector />
			<div className="login-bar">
				{isAuthenticated ? (
					<>
						<div className="login-welcome">
							<span className="login-welcome__text">
								{t('welcome')}, {user?.username}!
							</span>
							<a className="login-welcome__logout" onClick={handleLogout}>
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
			<div className="shell">
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
									<span className="card-cta">{t("start_quiz")}</span>
								</article>
							))}
						</div>
					</div>
				</div>
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
				<div className='login-overlay' role='dialog' aria-modal='true'>
					<h1>{t("2FA authentication")}</h1>
					<div className="message" ref={message}></div>
					<input type="text" id="verify-username" placeholder="username" required />
					<input type="text" id="verify-token" placeholder="2FA token" required />
					<button type="submit" className="btn primary full">
						{t("signup_button")}
					</button>
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
						<form className="login-form" onSubmit={handleSignup}>
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
						<div className="message" ref={message}></div>
						<div className="qr-code" ref={qrCode}></div>
					</div>
				</div>
			)}
		</main>
	)
}

export default HomePage
