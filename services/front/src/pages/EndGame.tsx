import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next'
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
	const { t } = useTranslation()
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
				setError(err.message ?? t('error_loading_results'))
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
			<p className="eyebrow">{t('app_name')}</p>
			<div className="hero">
			<div className="copy">
				<h1>{t('loading')}</h1>
				<p className="lede">{t('final_score_loading')}</p>
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
			<p className="eyebrow">{t('app_name')}</p>
			<div className="hero">
			<div className="copy">
				<h1>{t('error_title')}</h1>
				<p className="lede">{error ?? t('no_results_to_display')}</p>
				<div className="actions">
				<button className="btn ghost" onClick={() => navigate("/quiz")}>
					{t('back_to_quiz')}
				</button>
				</div>
			</div>
			</div>
		</div>
		</main>
	)
}

	const rows = leaderboard ?? []

	return (
	<main className="page">
		<div className="shell">
			<p className="eyebrow">{t('app_name')}</p>

			<div className="copy">
				<h1>{t('endgame_title')}</h1>
				<p className="lede">
					{t('endgame_subtitle')}
				</p>
				{rows.length === 0 ? (
				<div className="emptyState">{t('endgame_no_players')}</div>
				) : (
				<div className="leaderboardCard">
					<table className="leaderboardTable">
					<thead>
						<tr>
						<th className="colRank">#</th>
						<th className="colPlayer">{t('leaderboard_player')}</th>
						<th className="colScore">{t('score_label')}</th>
						<th className="colMeta">{t('leaderboard_correct_answers')}</th>
						<th className="colMeta">{t('leaderboard_joined')}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((p, idx) => (
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
					{t('play_again')}
			</button>
			<button className="btn ghost" onClick={() => navigate("/")}>
					{t('home')}
			</button>
			</div>
		</div>
	</main>
	)
}
