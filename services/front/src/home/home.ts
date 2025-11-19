import "../style/home.css";

document.querySelector<HTMLDivElement>("#index")!.innerHTML = `
	<div class="header">
		<h1 class="title">PONG</h1>
	</div>
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
});
