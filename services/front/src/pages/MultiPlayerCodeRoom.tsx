import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

const INTERVAL_TIME = 15000 

type Player = {
	name: string
	joined_at: string
}

function MultiPlayerCodeRoom() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const isRtl = i18n.dir() === 'rtl'
	const { roomCode } = useParams()
	const [code, setCode] = useState<string>('')
	const [isHost, setIsHost] = useState(false)
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [players, setPlayers] = useState<Player[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { user, isAuthenticated, isAuthReady } = useAuth()

	async function getSession() {
	const sessionIdStr = await localStorage.getItem("sessionId");
	const sessionId = sessionIdStr ? Number(sessionIdStr) : null;
	if (!sessionId) {
		console.log('Invalid session ID in localStorage')
		return null
	}
	const res = await fetch(`https://localhost/api/quiz/game-sessions/${sessionId}`, {
		method: 'GET',
		credentials: 'include',
	});
	if (!res.ok) {
		console.error('Failed to fetch room code:', res.status);
		return null
	}
	const data = await res.json();
	return data.sessionData;
}

async function handleStartGame() {
	const sessionIdstr = await localStorage.getItem("sessionId");
	const sessionId = sessionIdstr ? Number(sessionIdstr) : null;
	if (!sessionId) {
		console.error('Invalid session ID in localStorage:', sessionIdstr)
			alert(t('start_game_invalid_session'))
		return
	}
	try{
		if (players.length < 2) {
				alert(t('start_game_min_players'))
			return
		}
		const res = await fetch(
			`https://localhost/api/quiz/game-sessions/start`,
			{
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				code: code,
				host_id: user?.id,
			})
			}
		)

		if (!res.ok)
			throw new Error('Failed to start the game')
		const data = await res.json()
		navigate('/quiz/game', { state: { sessionId: data.sessionId, isHost: true } })
	} catch (err: any) {
		console.error('Error starting game:', err)
		alert(t('start_game_error'))
	}
}

async function handleLeaveRoom() {
	const sessionIdstr = await localStorage.getItem("sessionId");
	const sessionId = sessionIdstr ? Number(sessionIdstr) : null;
	if (!sessionId) {
		console.error('Invalid session ID in localStorage:', sessionIdstr)
			alert(t('leave_room_invalid_session'))
		return
	}
	try{
		const res = await fetch(
			`https://localhost/api/quiz/game-sessions/${sessionId}/players/me`,
			{
			method: 'DELETE',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				code: code,
				host_id: user?.id,
			})
			}
		)
		if (!res.ok) {
			console.error('Failed to leave room:', res, 'game-session might be corrupted')
		}
	}
	catch(err)
	{
		console.error('Error leaving room:', err, 'game-session must be corrupted')
	}
	localStorage.removeItem("sessionId")
	localStorage.removeItem("sessionCode")
	navigate('/quiz')
}

useEffect(() => {
	const sessionIdStr = localStorage.getItem("sessionId")
	const sessionId = sessionIdStr ? Number(sessionIdStr) : null
	if (!sessionId) return
	const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
	const socket = new WebSocket(
		`${proto}//${window.location.host}/ws/quiz/game-sessions/${sessionId}`
	);
	socket.onopen = () => {
		console.log("WebSocket connected")
	}

	socket.onmessage = async (event) => {
		const msg = JSON.parse(event.data)
		if (msg.type === "player_joined") {
			const newPlayer = {
				name: msg.payload.player_name,
				joined_at: new Date().toISOString(),
			}
			setPlayers((prev) => [...prev, newPlayer])
			console.log(`Player joined: ${newPlayer.name}`)
		}
		else if (msg.type === "player_left") {
			const newPlayer = {
				name: msg.payload.player_name,
				joined_at: new Date().toISOString(),
			}
			setPlayers((prev) => prev.filter((p) => p.name !== newPlayer.name))
			let session = await getSession();
			if (!session)
			{
				setError(t('session_data_fetch_error'))
				return
			}
			if (session.host_id === user?.id)
				setIsHost(true)

			console.log(`Player left: ${newPlayer.name}`)
		}
		else if (msg.type === "game_started") {
			console.log("Session started, navigating to game")
			navigate('/quiz/game', { state: { sessionId, isHost } })
		}
	}

	socket.onerror = (err) => {
		console.error("WebSocket error", err)
	}

	setWs(socket)
	return () => socket.close()
}, [])


useEffect(() => {
	; (async () => {
		try {
		if (!isAuthReady)
		{
			console.log("Auth not ready yet, waiting...")
			return
		}
		if (!isAuthenticated) {
			console.log("User not authenticated, redirecting to home")
			navigate('/')
			return
		}
		
		try {
			const userIdstr = await fetch(`https://localhost/api/user/userid/${user?.username}`, {
				method: 'GET',
				credentials: 'include',
			})
			const userIdData = await userIdstr.json()
			user.id = userIdData.id
		}
		catch(err)
		{
			console.error("Failed to fetch user ID:", err)
			setError(t('user_data_fetch_error'))
			return
		}


		const roomCode = localStorage.getItem("sessionCode");
		// localStorage.removeItem("sessionCode")
		localStorage.removeItem("questionCount")
		let session = await getSession();
		if (!session)
		{
			setError(t('session_data_fetch_error'))
			return
		}

		if (roomCode && roomCode === session.code) {
			setCode(roomCode)
		}
		else {
			const newCode = session.code
			if (!newCode) {
			console.error('Failed to retrieve room code')
			setError(t('room_code_fetch_error'))
			return
			}
			localStorage.setItem("sessionCode", newCode)
			setCode(newCode)
		}
		if (session.host_id === user?.id) {
			setIsHost(true)
		}
		localStorage.setItem("sessionId", session.id.toString());
		localStorage.setItem("questionCount", session.question_count.toString());
		setPlayers(session.players.map((p: any) => ({ name: p.username, joined_at: p.joined_at })))
	}
	catch(err)
	{
		console.error('Error in MultiPlayerCodeRoom:', err)
		setError(t('room_setup_error'))
	}
	finally {
		setLoading(false)
	}
	})()
}, [navigate, isAuthenticated, isAuthReady])


useEffect(() => {
	if (loading || error) return

	const interval = setInterval(async () => {
		const session = await getSession()
		if (session && Array.isArray(session.players)) {
		setPlayers(
			session.players.map((p: any) => ({
			name: p.username || t('unknown_player'),
			joined_at: p.joined_at || '',
			}))
		)
		}
	}, INTERVAL_TIME)

	return () => clearInterval(interval)
}, [loading, error])



if (loading) {
	return (
		<main className="page">
		<div className="shell">
			<p className="eyebrow">Quiz Sprint</p>
			<div className="hero">
			<div className="copy">
				<h1>{t('loading')}</h1>
				<p className="lede">{t('room_preparing')}</p>
			</div>
			</div>
		</div>
		</main>
	)
}

if (error) {
	return (
		<main className="page">
		<div className="shell">
			<p className="eyebrow">Quiz Sprint</p>
			<div className="hero">
			<div className="copy">
				<h1>{t('error_title')}</h1>
				<p className="lede">{error}</p>
				<div className="actions">
					{isHost && (
					<button 
						className="btn primary" 
						onClick={handleStartGame}
						disabled={players.length < 2}
						style={{
						opacity: players.length < 2 ? 0.5 : 1,
						cursor: players.length < 2 ? 'not-allowed' : 'pointer'
						}}
					>
						{t("start_game")}
						{players.length < 2 && ` ${t('min_players_note')}`}
					</button>
					)}
					<button className="btn ghost" onClick={() => navigate('/quiz')}>
					{t("leave_room")}
					</button>
				</div>
			</div>
			</div>
		</div>
		</main>
	)
}

return (
	<main className="page" dir={i18n.dir()}>
		<div className="shell">
			<p className="eyebrow">Quiz Sprint - {t("create_room")}</p>
			<div className="hero">
				<div className="copy">
					<h1>{isHost ? t("room_title_host") : t("room_title_guest")}</h1>
					<div style={{ 
							margin: '2rem 0', 
							padding: 'clamp(1rem, 3vw, 2rem)', 
							background: '#ffffffff', 
							borderRadius: '8px', 
							border: '2px solid #000000' 
					}}>
						<p style={{ 
							fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
							marginBottom: '0.9rem', 
							color: '#cac9c9ff' 
						}}>
						{t("room_code_label")}
						</p>
						<p style={{ 
							fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
							fontWeight: 'bold', 
							letterSpacing: '0.3em', 
							margin: '0',
							wordBreak: 'break-all'
						}}>
							{code}
						</p>
					</div>


					<div style={{ textAlign: isRtl ? 'right' : 'left', marginBottom: '2rem' }}>
						<p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
						{t("players_connected")} ({players.length})
						</p>
						{players.length === 0 ? (
						<p style={{ opacity: 0.7, padding: '0.5rem' }}>
							{t('waiting_players')}
						</p>
						) : (
						<div className="leaderboardCard">
							<table className="leaderboardTable">
								<thead>
									<tr>
										<th className="colRank">#</th>
										<th className="colPlayer">{t('leaderboard_player')}</th>
										<th className="colMeta">{t('leaderboard_joined')}</th>
									</tr>
								</thead>
								<tbody>
									{players.map((p, idx) => (
									<tr key={idx}>
										<td className="colRank">{idx + 1}</td>
										<td className="colPlayer">
										<span className="playerName">{p.name}</span>
										</td>
										<td className="colMeta">{p.joined_at ? new Date(p.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('na_short')}</td>
									</tr>
									))}
								</tbody>
							</table>
						</div>
						)}
					</div>

					<p className="lede" style={{ color: '#cac9c9ff' }}>
						{isHost
						? t("room_description_host")
						: t("room_description_guest")}
					</p>
					<div className="actions">
						{isHost && (
						<button
							className="btn primary"
							onClick={handleStartGame} 
							disabled={players.length < 2}
							style={{
								opacity: players.length < 2 ? 0.5 : 1,
								cursor: players.length < 2 ? 'not-allowed' : 'pointer',
							}}
						>
							{t("start_game")}</button>
						)}
						<button className="btn ghost" onClick={handleLeaveRoom}>
						{t("leave_room")}
						</button>
					</div>
				</div>
			</div>
		</div>
	</main>
	)
}
export default MultiPlayerCodeRoom
