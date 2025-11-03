import "./style.css"

let score1 = 0;
let score2 = 0;

document.querySelector<HTMLDivElement>('#pong')!.innerHTML = `
  <div class="header">
    <h1 class="title">PONG GAME</h1>
  </div>
  <div class="field">
    <div class="player1"></div>
    <div class="player2"></div>
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
const fieldXY = field.getBoundingClientRect();
let scoreP1 = document.getElementById('score1') as HTMLElement;
let scoreP2 = document.getElementById('score2') as HTMLElement;
let dx = 5;
let dy = 5;

const keyPressed: { [str: string]: boolean} = {};

window.addEventListener('keyup', (e: KeyboardEvent) => {
    keyPressed[e.key] = false;
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
  keyPressed[e.key] = true;
});

function collidePaddle1(ball: DOMRect, paddle1: DOMRect) {
  return ball.y < paddle1.y + paddle1.height &&
         ball.y + paddle1.height > paddle1.y &&
         ball.x === paddle1XY.width;
}

function collidePaddle2(ball: DOMRect, paddle2: DOMRect) {
  return ball.y < paddle2.y + paddle2.height &&
         ball.y + paddle2.height > paddle2.y &&
         ball.x + ball.width === fieldXY.width - 40 - paddle2XY.width;
}

export function movePaddle() {
  if (keyPressed['w']) {
    paddle1XY.y -= 10;
    if (paddle1XY.y <= 0)
      paddle1XY.y = 0;
  }
  if (keyPressed['s']) {
    paddle1XY.y += 10;
    if (paddle1XY.y + paddle1XY.height >= fieldXY.height - 40)
      paddle1XY.y = fieldXY.height - paddle1XY.height - 40;
  }
  if (keyPressed['ArrowUp']) {
    paddle2XY.y -= 10;
    if (paddle2XY.y <= 0)
      paddle2XY.y = 0;
  }
  if (keyPressed['ArrowDown']) {
    paddle2XY.y += 10;
    if (paddle2XY.y + paddle2XY.height >= fieldXY.height - 40)
      paddle2XY.y = fieldXY.height - paddle2XY.height - 40;
  }
  paddle1.style.top = `${paddle1XY.y}px`;
  paddle2.style.top = `${paddle2XY.y}px`;
  requestAnimationFrame(movePaddle);
}

export function moveBall() {
  ballXY.x += dx;
  ballXY.y -= dy;
  ball.style.left = `${ballXY.x}px`;
  ball.style.top = `${ballXY.y}px`;

  if (ballXY.x + ballXY.height >= fieldXY.width - 40) {
    dx *= -1;
    ballXY.x = fieldXY.width - ballXY.width - 40;
    score1++;
    scoreP1.textContent = score1.toString();
  } else if (ballXY.y <= 0) {
    dy *= -1;
    ballXY.y = 0;
  } else if (ballXY.y >= fieldXY.height - ballXY.height - 40) {
    dy *= -1;
    ballXY.y = fieldXY.height - ballXY.width - 40;
  } else if (ballXY.x <= 0) {
    dx *= -1;
    ballXY.x = 0;
    score2++;
    scoreP2.textContent = score2.toString();
  } else if (collidePaddle1(ballXY, paddle1XY)) {
    dx *= -1;
    ballXY.x = paddle1XY.width;
  } else if (collidePaddle2(ballXY, paddle2XY)) {
    dx *= -1;
    ballXY.x = fieldXY.width - ballXY.width - paddle1XY.width - 40;
  }
  requestAnimationFrame(moveBall);
}

moveBall();
movePaddle();
