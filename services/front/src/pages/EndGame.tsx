import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../App.css"



type LeaderboardRow = {
	id: number
	username: string
	score: number
	correct_answers: number
	answered_count: number
	is_active: number
	joined_at: string
}

type LeaderboardResponse = {
	status: string
	session: any
	leaderboard: LeaderboardRow[]
}

let sessionId = null as number | null;

export default  function EndGame() {
	const navigate = useNavigate()
	const [leaderboard, setLeaderboard] = useState<LeaderboardRow[] | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)


	useEffect(() => {
		const controller = new AbortController()

		async function fetchEndGame() {
			const sessionIdStr = await localStorage.getItem("sessionId")
			if (sessionIdStr && Number(sessionIdStr) != sessionId)
				sessionId = sessionIdStr ? Number(sessionIdStr) : null
			if (!sessionId) {
				throw new Error("Invalid session ID")
			}
			try {
				setLoading(true)
				setError(null)

				const response = await fetch(
					`https://localhost/api/quiz/game-sessions/${sessionId}/leaderboard`,
					{
						method: "GET",
						credentials: "include",
						signal: controller.signal,
					}
				)
				console.log("Fetch response:", response)
				if (!response.ok) {
					throw new Error("Failed to fetch end game results")
				}
				const json: LeaderboardResponse = await response.json()

				console.log("End game data:", json)
				setLeaderboard(json.leaderboard as LeaderboardRow[])
			}
			catch (err: any) {
				if (err.name === "AbortError") return
				setError(err.message ?? "Erreur lors du chargement du résultat")
			} 
			finally {
				setLoading(false)
			}
		}

		fetchEndGame()
		return () => controller.abort()
	}, [])

if (loading) {
	return (
		<main className="page">
		<div className="shell">
			<p className="eyebrow">Quiz Sprint</p>
			<div className="hero">
			<div className="copy">
				<h1>Chargement...</h1>
				<p className="lede">Récupération de votre score final.</p>
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
				<p className="lede">{error ?? "Aucun résultat à afficher."}</p>
				<div className="actions">
				<button className="btn ghost" onClick={() => navigate("/quiz")}>
					Retour au Quiz
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
			<p className="eyebrow">Quiz Sprint</p>

			<div className="copy">
				<h1>Fin de partie</h1>
				<p className="lede">
					Bravo à tous les participants — voici le classement final.
				</p>
				{leaderboard.length === 0 ? (
				<div className="emptyState">Aucun joueur dans cette session.</div>
				) : (
				<div className="leaderboardCard">
					<table className="leaderboardTable">
					<thead>
						<tr>
						<th className="colRank">#</th>
						<th className="colPlayer">Joueur</th>
						<th className="colScore">Score</th>
						<th className="colMeta">Bonne Réponses</th>
						<th className="colMeta">Rejoins</th>
						</tr>
					</thead>
					<tbody>
						{leaderboard.map((p, idx) => (
						<tr key={p.id}>
							<td className="colRank">{idx + 1}</td>
							<td className="colPlayer">
							<span className="playerName">{p.username}</span>
							</td>
							<td className="colScore">
							<span className="scorePill">{p.score}</span>
							</td>
							<td className="colMeta">{p.correct_answers}</td>
							<td className="colMeta">{p.joined_at}</td>
						</tr>
						))}
					</tbody>
					</table>
				</div>
				)}
			</div>

			<div className="actions">
			<button className="btn primary" onClick={() => navigate("/quiz")}>
				Rejouer
			</button>
			<button className="btn ghost" onClick={() => navigate("/")}>
				Accueil
			</button>
			</div>
		</div>
	</main>
	)
}
