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
	const { t } = useTranslation()
	const { roomCode } = useParams()
	const [code, setCode] = useState<string>('')
	const [isHost, setIsHost] = useState(false)
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
		alert(t("Failed to start the game. Invalid session ID. Please try again Later."))
		return
	}
	try{
		if (players.length < 2) {
			alert(t("Game requires at least 2 players to start."))
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
		navigate('/quiz/solo', { state: { sessionId: data.sessionId, isHost: true } })
	} catch (err: any) {
		console.error('Error starting game:', err)
		alert(t("Error starting the game. Please try again."))
	}
}

async function handleLeaveRoom() {
	const sessionIdstr = await localStorage.getItem("sessionId");
	const sessionId = sessionIdstr ? Number(sessionIdstr) : null;
	if (!sessionId) {
		console.error('Invalid session ID in localStorage:', sessionIdstr)
		alert(t("Failed to leave the room. Invalid session ID. Please try again Later."))
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
			setError(t("Failed to retrieve user data. Please try again Later."))
			return
		}


		const roomCode = localStorage.getItem("sessionCode");
		let session = await getSession();
		if (!session)
		{
			setError(t("Failed to retrieve session data. Please try again Later."))
			return
		}

		if (roomCode && roomCode === session.code) {
			setCode(roomCode)
		}
		else {
			const newCode = session.code
			if (!newCode) {
			console.error('Failed to retrieve room code')
			setError(t("Failed to retrieve room code. Please try again Later."))
			return
			}
			localStorage.setItem("sessionCode", newCode)
			setCode(newCode)
		}
		if (session.host_id === user?.id) {
			setIsHost(true)
		}
		setPlayers(session.players.map((p: any) => ({ name: p.username, joined_at: p.joined_at })))
	}
	catch(err)
	{
		console.error('Error in MultiPlayerCodeRoom:', err)
		setError(t("An error occurred while setting up the room. Please try again Later"))
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
			name: p.username || 'Joueur inconnu',
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
				<h1>Chargement...</h1>
				<p className="lede">Préparation de la room.</p>
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
				<h1>Erreur</h1>
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
						{players.length < 2 && ' (min. 2 joueurs)'}
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
	<main className="page">
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


					<div style={{ textAlign: 'left', marginBottom: '2rem' }}>
						<p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
						{t("players_connected")} ({players.length})
						</p>
						{players.length === 0 ? (
						<p style={{ opacity: 0.7, padding: '0.5rem' }}>
							En attente de joueurs...
						</p>
						) : (
						<div className="leaderboardCard">
							<table className="leaderboardTable">
								<thead>
									<tr>
										<th className="colRank">#</th>
										<th className="colPlayer">Joueur</th>
										<th className="colMeta">Rejoins</th>
									</tr>
								</thead>
								<tbody>
									{players.map((p, idx) => (
									<tr key={idx}>
										<td className="colRank">{idx + 1}</td>
										<td className="colPlayer">
										<span className="playerName">{p.name}</span>
										</td>
										<td className="colMeta">{p.joined_at ? new Date(p.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
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
