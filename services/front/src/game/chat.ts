import '../style/chat.css'

document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
	<h1 class="header">CHAT</h1>
	<div class="body">
		<div id="p1">
			<p id='time'>time</p>
			<h1 class="player">player: coucou</h1>
		</div>
		<div id='p2'>
			<p id='time'>time</p>
			<h1 class="opponent">opponent: salut ca va ?</h1>	
		</div>
		<div id="tosend">
			<input class="message" type="message" placeholder="type your message..."/>
			<input class="send" type="button" value="send"/>
		</div>	
	</div>
`;

const message = document.querySelector(".message") as HTMLInputElement;
const opponent = document.createElement("h1") as HTMLElement;
const player = document.createElement("h1") as HTMLElement;
const send = document.querySelector(".send") as HTMLInputElement;

async function sendMessage() {
	let send = message.value;
	try {
		const response = await fetch("http://localhost:3003/me", {
			method: 'GET',
			headers: { "Content-Type": "application/json" },
			credentials: 'include'
		});
		console.log(JSON.stringify(response.body));
	} catch (e) {
		console.error(e);
	}
	// try {
	// 	const response = fetch("http://localhost:3003/chat-send", {
	// 		method: 'POST',
	// 		headers: { "Content-Type": "application/json" },
	// 		body: JSON.stringify(send)
	// 	});
	// } catch (e) {
	// 	console.error(e);
	// }
}

function receiveMessage() {

}

send.addEventListener("click", () => {
	sendMessage();
});