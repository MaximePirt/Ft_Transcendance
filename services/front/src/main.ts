import "./style.css"

let score1 = 0;
let score2 = 0;
let name1 = "toto";
let name2 = "tutu";

document.querySelector<HTMLDivElement>('#pong')!.innerHTML = `
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
let dx = 10;
let dy = 10;
const border = 10;

const keyPressed: { [str: string]: boolean} = {};

window.addEventListener('keyup', (e: KeyboardEvent) => {
    keyPressed[e.key] = false;
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
  keyPressed[e.key] = true;
});

function collidePaddle1(ball: DOMRect, paddle1: DOMRect) {
  return ball.y < paddle1.y + paddle1.height &&
         ball.y + ball.height > paddle1.y &&
         ball.x === paddle1XY.width;
}

function collidePaddle2(ball: DOMRect, paddle2: DOMRect) {
  return ball.y < paddle2.y + paddle2.height &&
         ball.y + ball.width > paddle2.y &&
         ball.x === fieldXY.width - paddle1XY.width - ball.height;
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

let markPoint = false;
export function moveBall() {
  ballXY.x += dx;
  ballXY.y -= dy;
  ball.style.left = `${ballXY.x}px`;
  ball.style.top = `${ballXY.y}px`;

  if (ballXY.x + ballXY.height === fieldXY.width) {
    score1++;
    scoreP1.textContent = score1.toString();
    setTimeout(() => {
      markPoint = true;
    }, 1000);
  } else if (ballXY.y <= 0) {
    dy *= -1;
    ballXY.y = 0;
  } else if (ballXY.y >= fieldXY.height - ballXY.height - border) {
    dy *= -1;
    ballXY.y = fieldXY.height - ballXY.height - border;
  } else if (ballXY.x === 0) {
    score2++;
    scoreP2.textContent = score2.toString();
    setTimeout(() => {
      markPoint = true;
    }, 1000);
  } else if (collidePaddle1(ballXY, paddle1XY)) {
    dx *= -1;
    ballXY.x = paddle1XY.width;
  } else if (collidePaddle2(ballXY, paddle2XY)) {
    dx *= -1;
    ballXY.x = fieldXY.width - ballXY.width - paddle1XY.width;
  }
  if (markPoint) {
    ballXY.x = 900;
    ballXY.y = 400;
    return ;
  }
  requestAnimationFrame(moveBall);
}

window.addEventListener("keydown", function(e: KeyboardEvent) {
    if (e.code === 'Space') {
      markPoint = false;
      ballXY.x = 900;
      ballXY.y = 400;
      ball.style.backgroundColor = 'black';
      moveBall();
    }
});

movePaddle();
