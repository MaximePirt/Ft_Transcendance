import '../style/chat.css'

document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
	<h1 class="header">CHAT</h1>
	<div class="body">
		<h1 class="player">player: coucou</h1>
		<h1 class="opponent">opponent: salut ca va ?</h1>
		<input class="message" type="message" placeholder="type your message..."/>
		<input class="send" type="button" value="send"/>
	</div>
`;

let message = document.querySelector(".message") as HTMLInputElement;
let opponent = document.createElement("h1") as HTMLElement;
let player = document.createElement("h1") as HTMLElement;

function sendMessage() {
	let send = message.value;
	try {
		const response = fetch("http://localhost:3003/chat-send", {
			method: 'POST',
			headers: { "Content-Type": "application:json" },
			body: JSON.stringify(send)
		});
	} catch (e) {

	}
}

function receiveMessage() {

}
