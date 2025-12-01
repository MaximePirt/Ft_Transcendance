export function renderGame() {
  return `
    <div class="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 class="text-4xl font-bold mb-4">Jeu en cours...</h1>
      <div class="w-[800px] h-[400px] border-4 border-white flex items-center justify-center">
        <p>Ici va etre le putain de Pong</p>
      </div>
      <a href="/" class="mt-8 text-gray-400 hover:text-white underline" data-link>
        Retour à l'accueil
      </a>
    </div>
  `;
}