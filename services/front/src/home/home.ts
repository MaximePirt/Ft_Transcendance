import "../style/home.css";

document.querySelector<HTMLDivElement>("#index")!.innerHTML = `
	<div class="header">
		<h1 class="title">PONG</h1>
	</div>
	<p>You have to sign in if you want to play !</p>
	<div class="menu">
		<button class="play" type="button">PLAY</button>
		<br>
		<button class="signin" type="button">SIGN IN</button>
		<br>
		<button class="signup" type="button">SIGN UP</button>
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


