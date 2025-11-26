import '../style/pong.css';

let score1 = 0;
let score2 = 0;
let name1 = "tib";
let name2 = "totoAI";

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
    <div class="ball"></div>
    <div class="line"></div>
    <p id="score1">0</p>
    <p id="score2">0</p>
  </div>
`;

const field = document.querySelector('.field') as HTMLDivElement;
const paddle1 = document.querySelector('.player1') as HTMLDivElement;
const paddle2 = document.querySelector('.player2') as HTMLDivElement;
const ball = document.querySelector('.ball') as HTMLDivElement;
let ballXY = ball.getBoundingClientRect();
let paddle1XY = paddle1.getBoundingClientRect();
let paddle2XY = paddle2.getBoundingClientRect();
const fieldXY = field.getBoundingClientRect();
let scoreP1 = document.getElementById('score1') as HTMLElement;
let scoreP2 = document.getElementById('score2') as HTMLElement;
let dx = 5;
let dy = 5;
const border = 10;

// 400 possibilities because of the field height

// actions :
// 0: top;
// 1: bottom;

// rewards :
// reward: +1
// missing the ball: 0

// For Bellman equation :
let max_s = fieldXY.height - paddle2XY.height;

// apprenticeship coef.
let alpha: number = 0.7;

// actualisation factor
let gamma: number = 0.95;

// max Q(s', a') --> best Q value
let bestQ: number;

let n_training = 100000;
let n_episodes = 100;
let max_epsilon = 1.0;
let min_epsilon = 0.05;
let decay_rate = 0.001;
let qTable: number[][];
let reward = 0;

qTable = Array.from({ length: max_s }, () =>
	Array(3).fill(0)
);

function count() {
	for (let i = 0; i < qTable.length; i++) {
		for (let j = 0; j < qTable[i].length; j++) {
			console.log(`${qTable[i][j]}, `);
		}
		console.log("\n");
	}
}

function collidePaddle2(ball: DOMRect, paddle2: DOMRect) {
	return ball.y < paddle2.y + paddle2.height &&
		ball.y + ball.width > paddle2.y &&
		ball.x >= fieldXY.width - paddle1XY.width - ball.height;
}

function heuristicPlayer() {
	if (ballXY.y != paddle1XY.y)
		paddle1XY.y = ballXY.y;
	if (paddle1XY.x <= 0)
		paddle1XY.x = 0;
	if (paddle1XY.y + paddle1XY.height >= fieldXY.height - border)
		paddle1XY.y = fieldXY.height - paddle1XY.height - border;
	paddle1.style.top = `${paddle1XY.y}px`;
	requestAnimationFrame(heuristicPlayer);
}

// exploration or exploitation ?
function epsilonGreedyPolicy(epsilon: number, state: number) {
	let random_nb = Math.random();
	let floor_s = Math.floor(state);
	let result = 0;

	if (random_nb > epsilon) {
		result = Math.max(...qTable[floor_s]);
	} else {
		let randomI = Math.floor(Math.random() * 3);
		let randomJ = Math.floor(Math.random() * max_s);

		result = qTable[randomJ][randomI];
	}

	return result;
}

function totoAI() {
	let action;

	for (let i: number = 0; i < n_episodes; i++) {
		let epsilon = min_epsilon + (max_epsilon - min_epsilon) * Math.exp(-decay_rate * i);
		let state = Math.floor(paddle2XY.y);
		let game = moveBall();
		while (game != 0 && game != 1) {
			let new_state = Math.floor(paddle2XY.y);

			action = epsilonGreedyPolicy(epsilon, state);
			movePaddle(action);
			//Bellman equation

			qTable[state][action] = qTable[state][action] + alpha * (reward + gamma * Math.max(...qTable[new_state]) - qTable[state][action]);
			state = new_state;
		}
	}
}

function movePaddle(action: number) {
	if (action === 0) {
		paddle1XY.y -= 15;
		if (paddle2XY.y <= 0)
			paddle2XY.y = 0;
	}
	if (action === 1) {
		paddle2XY.y += 15;
		if (paddle2XY.y + paddle2XY.height >= fieldXY.height - border)
			paddle2XY.y = fieldXY.height - paddle2XY.height - border;
	}
	if (action === 2)
		paddle2XY.y += 0;
	paddle2.style.top = `${paddle2XY.y}px`;
	requestAnimationFrame(movePaddle);
}

function relativeAngle(paddle: DOMRect) {
	let interY;
	let ballY = ballXY.y + (ballXY.width / 2) + (ballXY.height / 2);
	let paddleY = paddle.y + (paddle.height / 2);
	let paddleH = paddle.height;
	let norm;

	interY = (paddleY + (paddleH / 2)) - ballY;
	norm = interY / (paddleH / 2);
	console.log(norm);
	return norm * (Math.PI / 4);
}

let markPlayer1 = false;
let markPlayer2 = false;
function moveBall() {
	ballXY.x += dx;
	ballXY.y -= dy;
	paddle1.remove();
	
	if (ballXY.x + ballXY.height >= fieldXY.width) {
		markPlayer1 = true;
		dx *= -1;
	} else if (ballXY.y <= 0) {
		dy *= -1;
		ballXY.y = 0;
	} else if (ballXY.y >= fieldXY.height - ballXY.height - border) {
		dy *= -1;
		ballXY.y = fieldXY.height - ballXY.height - border;
	} else if (ballXY.x <= 0) {
		markPlayer2 = true;
		dx *= -1;
	} else if (collidePaddle2(ballXY, paddle2XY)) {
		dx *= -1;
		dx *= Math.cos(relativeAngle(paddle2XY)) + 0.1;
		dy *= Math.sin(relativeAngle(paddle2XY)) + 0.1;
		ballXY.x = fieldXY.width - ballXY.width - paddle1XY.width;
	}
	if (markPlayer2) {
		score2++;
		scoreP2.textContent = score2.toString();
		ballXY.x = 500;
		ballXY.y = 250;
		markPlayer2 = false;
		return 1;
	}
	if (markPlayer1) {
		score1++;
		scoreP1.textContent = score1.toString();
		ballXY.x = 500;
		ballXY.y = 250;
		markPlayer1 = false;
		return 0;
	}
	requestAnimationFrame(moveBall);
	ball.style.left = `${ballXY.x}px`;
	ball.style.top = `${ballXY.y}px`;
}

moveBall();
//heuristicPlayer();
totoAI();