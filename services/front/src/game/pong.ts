import '../style/pong.css'

let score1 = 0;
let score2 = 0;
let name1 = "toto";
let name2 = "tutu";

document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
  <div class="header">
    <h1 class="title">PONG</h1>
  </div>
  <div class="players">
    <p id="name1">${name1}</p>
    <p id="VS">VS</p>
    <p id="name2">${name2}</p>
  </div>
  <div class="field">
    <div class="player1"></div>
    <div class="player2"></div>
    <p id="press">PRESS SPACE</p>
    <div class="ball"></div>
    <div class="line"></div>
    <p id="score1">0</p>
    <p id="score2">0</p>
  </div>
`

const field = document.querySelector('.field') as HTMLDivElement;
const paddle1 = document.querySelector('.player1') as HTMLDivElement;
const paddle2 = document.querySelector('.player2') as HTMLDivElement;
const ball = document.querySelector('.ball') as HTMLDivElement;
let ballXY = ball.getBoundingClientRect();
let paddle1XY = paddle1.getBoundingClientRect();
let paddle2XY = paddle2.getBoundingClientRect();
let fieldXY = field.getBoundingClientRect();
let scoreP1 = document.getElementById('score1') as HTMLElement;
let scoreP2 = document.getElementById('score2') as HTMLElement;
const press = document.getElementById('press') as HTMLElement;
let dx = 8;
let dy = 8;
const border = 10;

const keyPressed: { [str: string]: boolean } = {};

window.addEventListener('keyup', (e: KeyboardEvent) => {
	keyPressed[e.key] = false;
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
	keyPressed[e.key] = true;
});

function collidePaddle1(ball: DOMRect, paddle1: DOMRect) {
	return ball.y < paddle1.y + paddle1.height &&
		ball.y + ball.width > paddle1.y &&
		ball.x <= paddle1XY.width;
}

export function collidePaddle2(ball: DOMRect, paddle2: DOMRect) {
	return ball.y < paddle2.y + paddle2.height &&
		ball.y + ball.width > paddle2.y &&
		ball.x >= fieldXY.width - paddle1XY.width - ball.height;
}

export function movePaddle() {
	if (keyPressed['w']) {
		paddle1XY.y -= 15;
		if (paddle1XY.y <= 0)
			paddle1XY.y = 0;
	}
	if (keyPressed['s']) {
		paddle1XY.y += 15;
		if (paddle1XY.y + paddle1XY.height >= fieldXY.height - border)
			paddle1XY.y = fieldXY.height - paddle1XY.height - border;
	}
	if (keyPressed['ArrowUp']) {
		paddle2XY.y -= 15;
		if (paddle2XY.y <= 0)
			paddle2XY.y = 0;
	}
	if (keyPressed['ArrowDown']) {
		paddle2XY.y += 15;
		if (paddle2XY.y + paddle2XY.height >= fieldXY.height - border)
			paddle2XY.y = fieldXY.height - paddle2XY.height - border;
	}
	paddle1.style.top = `${paddle1XY.y}px`;
	paddle2.style.top = `${paddle2XY.y}px`;
	requestAnimationFrame(movePaddle);
}

function relativeAngle(paddle: DOMRect) {
	let impact;
	let ballY = ballXY.y + (ballXY.width / 2);
	let paddleY = paddle.y + (paddle.height / 2);
	let paddleH = paddle.height;

	impact = (ballY - paddleY) / (paddle.height / 2);
	console.log(`interY: ${impact}, paddle height: ${paddleH}, dx: ${dx} & paddleY: ${dy}`);
	dx += 0.5;
	dy += 0.5;
	return impact * (Math.PI / 4);
}

let markPlayer1 = false;
let markPlayer2 = false;
function moveBall() {
	ball.style.left = `${ballXY.x}px`;
	ball.style.top = `${ballXY.y}px`;
	ballXY.x += dx;
	ballXY.y -= dy;

	if (ballXY.x + ballXY.height >= fieldXY.width) {
		markPlayer1 = true;
	} else if (ballXY.y <= 0) {
		dy *= -1;
		ballXY.y = 0;
	} else if (ballXY.y >= fieldXY.height - ballXY.height - border) {
		dy *= -1;
		ballXY.y = fieldXY.height - ballXY.height - border;
	} else if (ballXY.x <= 0) {
		markPlayer2 = true;
	} else if (collidePaddle1(ballXY, paddle1XY)) {
		dx *= Math.cos(relativeAngle(paddle1XY));
		dy *= Math.sin(relativeAngle(paddle1XY));
		dx *= -1;
		ballXY.x = paddle1XY.width;
	} else if (collidePaddle2(ballXY, paddle2XY)) {
		dx *= Math.cos(relativeAngle(paddle2XY));
		dy *= Math.sin(relativeAngle(paddle2XY));
		dx *= -1;
		ballXY.x = fieldXY.width - ballXY.width - paddle1XY.width;
	}
	if (markPlayer1 === true) {
		score1++;
		scoreP1.textContent = score1.toString();
		markPlayer1 = false;
		field.appendChild(press);
		return;
	} else if (markPlayer2 === true) {
		score2++;
		scoreP2.textContent = score2.toString();
		markPlayer2 = false;
		field.appendChild(press);
		return;
	}
	requestAnimationFrame(moveBall);
}

window.addEventListener("keydown", function (e: KeyboardEvent) {
	if (e.code === 'Space') {
		press.remove();
		ballXY.x = fieldXY.width / 2;
		ballXY.y = fieldXY.height / 2;
		dx = 8;
		dy = 8;
		moveBall();
	}
});

movePaddle();
