// main.js
// Punto de entrada: asegura el orden, inicia flujo tras cargar DOM y escucha eventos

import { checkIfUserHasNFT } from './nftCheck.js';
import { contract, getCurrentAccount } from './wallet.js';

console.log('🚀 Iniciando aplicación...');

document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM cargado');

  // Utilidad para cargar scripts dinámicamente
  const loadScript = (src, attr) => {
    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = src;
      if (attr) script.setAttribute(attr, "true");
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  // Lanzar el juego sólo si el usuario tiene NFT
  document.getElementById('playBtn').addEventListener('click', async () => {
    const user = getCurrentAccount ? getCurrentAccount() : null;
    if (!contract || !user) {
      alert('Conecta tu wallet antes de jugar.');
      return;
    }

    const hasNFT = await checkIfUserHasNFT(contract, user);
    if (hasNFT) {
      document.getElementById('lobby').classList.add('hidden');
      document.getElementById('gameScreen').classList.remove('hidden');
      document.body.classList.add('game-active');

      const flappyContainer = document.getElementById('flappyContainer');
      if (flappyContainer) {
        // Limpia canvases viejos
        const canvases = flappyContainer.getElementsByTagName('canvas');
        while (canvases.length > 0) {
          canvases[0].remove();
        }
      }

      // Limpia instancias previas de p5 si existen
      if (window.p5 && window.p5.instance) {
        try { window.p5.instance.remove(); } catch (e) {}
      }

      // Cargar dependencias y el juego
      await loadScript("rectCircle.js");
      await loadScript("flappyGame.js", "data-flappy");

      // Forzar instancia de p5 (ejecuta setup/draw del juego)
      new p5();
    } else {
      alert('Necesitas tener al menos 1 NFT para jugar.');
    }
  });

  // Reiniciar el juego (recarga la página para limpiar p5.js)
  document.getElementById('restartBtn').addEventListener('click', () => {
    window.location.reload();
  });

  // Salir del juego y volver al lobby
  document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('lobby').classList.remove('hidden');
    document.body.classList.remove('game-active');

    // Limpia instancia de p5 y canvas
    if (window.p5 && window.p5.instance) {
      try { window.p5.instance.remove(); } catch (e) {}
    }
    const flappyContainer = document.getElementById('flappyContainer');
    if (flappyContainer) {
      const canvases = flappyContainer.getElementsByTagName('canvas');
      while (canvases.length > 0) {
        canvases[0].remove();
      }
    }
  });

  // Al cargar, muestra solo el lobby y oculta el juego
  document.getElementById('lobby').classList.remove('hidden');
  document.getElementById('gameScreen').classList.add('hidden');

  console.log('✅ Aplicación lista para conectar wallet y mint.');
});
