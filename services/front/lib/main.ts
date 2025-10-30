export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(++counter))
  setCounter(0)
}

export function movePaddle(paddle: HTMLButtonElement) {
  const move = () => {
    const dx = 2;
    const dy = -2;

    
  }
}