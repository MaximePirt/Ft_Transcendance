import "./style.css"

document.querySelector<HTMLDivElement>('#pong')!.innerHTML = `
  <div class="header">
    <h1 class="title">PONG GAME</h1>
  </div>
  <div class="field">
    <div class="player1"></div>
    <div class="player2"></div>
    <div class="ball"></div>
    <div class="line"></div>
  </div>
`
//const field = document.querySelector('.field') as HTMLDivElement;
const paddle1 = document.querySelector('.player1') as HTMLDivElement;
const paddle2 = document.querySelector('.player2') as HTMLDivElement;
const ball = document.querySelector('.ball') as HTMLDivElement;
let ballX = 870;
//let ballY = ball.getBoundingClientRect().y;
let paddle1Y = paddle1.getBoundingClientRect().y;
let paddle2Y = paddle2.getBoundingClientRect().y;

const keyPressed: { [str: string]: boolean} = {};

window.addEventListener('keyup', (e: KeyboardEvent) => {
    keyPressed[e.key] = false;
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
  keyPressed[e.key] = true;
});

export function movePaddle() {
  if (keyPressed['w'] && paddle1Y > 0)
    paddle1Y -= 7;
  if (keyPressed['s'] && paddle1Y < 625)
    paddle1Y += 7;
  if (keyPressed['ArrowUp'] && paddle2Y > 0)
    paddle2Y -= 7;
  if (keyPressed['ArrowDown'] && paddle2Y < 625)
    paddle2Y += 7;
  paddle1.style.top = `${paddle1Y}px`;
  paddle2.style.top = `${paddle2Y}px`;
  requestAnimationFrame(movePaddle);
}

let touch = false;
export function moveBall() {
  if (ballX <= 1800 && !touch) {
    ballX += 10;
    if (ballX === 1750) {
      touch = true;
    }
  } else if (ballX > 0 && touch) {
    ballX -= 10
    if (ballX <= 0) {
      touch = false;
    }
  }
  ball.style.left = `${ballX}px`;
  requestAnimationFrame(moveBall);
  console.log(ballX);
}

moveBall();
movePaddle();
