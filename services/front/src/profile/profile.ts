import "../style/profile.css";

document.querySelector<HTMLDivElement>("#index")!.innerHTML = `
	<div class="profile-page">
	<div class="header">
		<h1 class="title">PROFIL</h1>
		<h1 class="project">Pong_42</h1>
	</div>


	<div class="display-menu">
		<div class="menu-left">
			<button class="home" type="button" onclick="window.location.href = '/home';">Accueil</button>
			<button class="profile" type="button" onclick="window.location.href = '/profile';">Profil</button>
			<button class="settings" type="button" onclick="window.location.href = '/settings';">Paramètres</button>
			<button class="twofa" type="button" onclick="window.location.href = '/2fa';">2FA</button>
			<button class="logout" type="button" onclick="window.location.href = '/logout';">Déconnexion</button>
			<br>
		</div>








		<div class="menu-right">
			<div class="menu-right-presentation">
				<h1> Votre Profil </h1>
				<h2> Bienvenue sur votre page de profil. </h2>
			</div>
			<div class="profile-trucsup">
				<h1> truc supplementaire? </h1>
			</div>
			<div class="profile-info">
				<h1 class="profile-name"> Profil name </h1>
				<h1 class="profile-logo"> Profil logo </h1>
			</div>



			<div class="stats-menu">
				<div class="stats-history">
					<h1> Historique des parties</h1>
				</div>
				<div class="stats-global">
					<h1> Statistiques globales </h1>
				</div>
				<div class="stats-right">
					<h1> Elo stats </h1>
				</div>

				</div>
		</div>
	</div>

	<footer class="page-footer">
		<h1> PONG 42 - 2025 </h1>
	</footer>
	</div>
`

const play = document.querySelector(".play") as HTMLButtonElement;
const signin = document.querySelector(".signin") as HTMLButtonElement;
const signup = document.querySelector(".signup") as HTMLButtonElement;

play.addEventListener("click", () => {
	const div = document.createElement("div");
	div.className = "options";
	document.body.appendChild(div);
	div.innerHTML = `
		<div class="header">
			<h1 class="optitle">options</h1>
			<i class="fa-regular fa-circle-xmark"></i>
			<button class="solo-butt" type="button">solo</button>
			<br>
			<button class="multi" type="button">multiplayer</button>
		</div>
	`
	const solo = document.querySelector(".solo-butt") as HTMLButtonElement;

	solo.addEventListener("click", () => {
		div.innerHTML = `
			<h1 class="solo">solo</h1>
			<br>
			<p>In solo, you'll be playing against toto an AI with four levels of difficulty</p>
			<br>
			<div class="difficulty">
				<a href="http://localhost:5173/toto">
					<button class="easy" type="button">easy</button>
					<br>
					<button class="normal" type="button">medium</button>
					<br>
					<button class="hard" type="button">hard</button>
					<br>
					<button class="god" type="button">god</button>
					</a>
			</div>
		`;
	});
});


