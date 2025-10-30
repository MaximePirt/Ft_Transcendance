import './style.css'
import { setupCounter } from '../lib/main'

document.querySelector<HTMLDivElement>('#pong')!.innerHTML = `
  <div class="header">
    <h1 class="title">PONG GAME</h1>
  </div>
  <div class="pong">
    <div class="player1"></div>
    <div class="player2"></div>
    <div class="ball"></div>
    <div class="line"></div>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
