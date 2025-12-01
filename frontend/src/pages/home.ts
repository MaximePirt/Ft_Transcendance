export function renderHome() {
  return `
    <div class="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 class="text-5xl font-bold text-blue-600 mb-4">Bienvenue sur Pong</h1>
      <p class="text-xl text-gray-700 mb-8">ft_transcendence.</p>
      <a href="/game" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" data-link>
        Lancer une partie
      </a>
    </div>
  `;
}