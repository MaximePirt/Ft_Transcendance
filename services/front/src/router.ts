import "./style/error.css";

function routes() {
	const page = document.getElementById("page") as HTMLScriptElement;
	const index = document.getElementById("index") as HTMLDivElement;

	if (window.location.href === "http://localhost:5173/pong") {
		page.src = "./src/game/pong.ts";
	} else if (window.location.href === "http://localhost:5173/signin") {
		page.src = "./src/authentication/signin.ts";
	} else if (window.location.href === "http://localhost:5173/signup") {
		page.src = "./src/authentication/signup.ts";
	} else if (window.location.href === "http://localhost:5173/toto") {
		page.src = "./src/AI/trainAI.ts";
	} else if (window.location.href === "http://localhost:5173/home") {
		page.src = "./src/home/home.ts";
	} else if (window.location.href === "http://localhost:5173/live-chat") {
		page.src = "./src/game/chat.ts";
	} else {
		index!.innerHTML = `
            <p id="error">Error 404 : can't load the page bro.</p>
            <img id="meme" src="../img/meme.jpg"/>
        `
	}
}

routes();
