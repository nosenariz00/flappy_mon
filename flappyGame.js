const ancho_escenario = 1280;
const alto_escenario = 720;
const velocidad_suelo = 5;

let canvas;
let piso;
let pajaro;
let tubos = [];
let caer = false;
let puntos = 0;

let font;
let audio_hit = new Audio("audio_hit.ogg");
let audio_point = new Audio("audio_point.ogg");
let audio_wing = {
  0: new Audio("audio_wing.ogg"),
  1: new Audio("audio_wing.ogg"),
  2: new Audio("audio_wing.ogg")
};
let img_piso;
let img_fondo;
let img_tubo;
let img_pajaro;

function preload() {
  font = loadFont("font.ttf");
  img_piso = loadImage("img_base.png");
  img_tubo = loadImage("img_pipe-green.png");
  img_fondo = loadImage("img_background-day.png");
  img_pajaro = [
    loadImage("img_yellowbird-downflap.png"),
    loadImage("img_yellowbird-midflap.png"),
    loadImage("img_yellowbird-upflap.png")
  ];
}

let isPaused = false;
let pauseOverlay;
let volume = 1;

// Crear overlay de pausa
function createPauseOverlay() {
  pauseOverlay = document.createElement('div');
  pauseOverlay.id = 'pauseOverlay';
  pauseOverlay.style.position = 'fixed';
  pauseOverlay.style.top = '0';
  pauseOverlay.style.left = '0';
  pauseOverlay.style.width = '100vw';
  pauseOverlay.style.height = '100vh';
  pauseOverlay.style.background = 'rgba(0,0,0,0.7)';
  pauseOverlay.style.display = 'flex';
  pauseOverlay.style.flexDirection = 'column';
  pauseOverlay.style.justifyContent = 'center';
  pauseOverlay.style.alignItems = 'center';
  pauseOverlay.style.zIndex = '99999';

  pauseOverlay.innerHTML = `
    <div style="background:#222;padding:32px 24px;border-radius:18px;box-shadow:0 4px 32px #000;text-align:center;min-width:260px;">
      <h2 style="color:#ffcc00;margin-bottom:18px;">⏸️ Pausa</h2>
      <label style="color:#fff;font-size:1.1em;">
        Volumen:
        <input id="pauseVolume" type="range" min="0" max="1" step="0.01" value="${volume}" style="width:120px;vertical-align:middle;">
      </label>
      <div style="margin-top:24px;display:flex;gap:16px;justify-content:center;">
        <button id="pauseResumeBtn" style="padding:10px 18px;border-radius:8px;background:#ffcc00;color:#222;font-weight:600;border:none;cursor:pointer;">Continuar</button>
        <button id="pauseExitBtn" style="padding:10px 18px;border-radius:8px;background:#e60026;color:#fff;font-weight:600;border:none;cursor:pointer;">Salir</button>
      </div>
    </div>
  `;
  document.body.appendChild(pauseOverlay);

  document.getElementById('pauseVolume').addEventListener('input', (e) => {
    volume = parseFloat(e.target.value);
    setGameVolume(volume);
  });
  document.getElementById('pauseResumeBtn').onclick = () => {
    hidePauseOverlay();
    isPaused = false;
    loop();
  };
  document.getElementById('pauseExitBtn').onclick = () => {
    hidePauseOverlay();
    isPaused = false;
    // Simula el botón salir
    if (window.parent && window.parent.document) {
      const backBtn = window.parent.document.getElementById('backBtn');
      if (backBtn) backBtn.click();
    } else {
      // Fallback: recarga la página
      window.location.reload();
    }
  };
}

function hidePauseOverlay() {
  if (pauseOverlay) {
    pauseOverlay.remove();
    pauseOverlay = null;
  }
}

// Aplica volumen a todos los audios
function setGameVolume(vol) {
  audio_hit.volume = vol;
  audio_point.volume = vol;
  for (let k in audio_wing) audio_wing[k].volume = vol;
}

function setup() {
  // Ajusta el tamaño del canvas al contenedor y dispositivo
  const container = document.getElementById('flappyContainer');
  if (!container) {
    console.error('No se encontró el contenedor flappyContainer');
    return;
  }
  let w = ancho_escenario;
  let h = alto_escenario;
  // Detecta si es móvil
  const isMobile = window.innerWidth <= 600;
  if (container) {
    if (isMobile) {
      w = Math.min(window.innerWidth, ancho_escenario);
    } else {
      w = Math.min(container.offsetWidth || w, ancho_escenario);
      // Si el contenedor es muy pequeño, usa el ancho máximo de la ventana
      if (w < 600) w = Math.min(window.innerWidth - 32, ancho_escenario);
    }
    h = Math.round(w * alto_escenario / ancho_escenario);
  }
  canvas = createCanvas(w, h);
  canvas.parent('flappyContainer'); // <-- Asegura que el canvas esté en el contenedor correcto
  textFont(font);
  textSize(40);
  textAlign(CENTER, CENTER);
  strokeWeight(10);
  windowResized();
  piso = new Piso();
  pajaro = new Pajaro();
  img_fondo.resize(
    img_fondo.width * alto_escenario / img_fondo.height,
    alto_escenario
  );
  setGameVolume(volume);
}

let contadorFotogramas = 0;

function draw() {
  if (isPaused) {
    noLoop();
    return;
  }
  for (let i = 0; i < 4; i++) {
    image(img_fondo, img_fondo.width * i, 0);
  }
  for (const tubo of tubos) {
    tubo.dibujar();
  }
  piso.dibujar();
  pajaro.dibujar();
  if (contadorFotogramas * velocidad_suelo % 400 == 0) {
    tubos.push(new Tubo());
  }
  if (caer) {
    contadorFotogramas++;
  }
  if (tubos[puntos] && tubos[puntos].x - pajaro.pos.x < 0) { //Se ha hecho un punto
    puntos++;
    audio_point.play();
  }
  stroke("black");
  fill("white");
  text(puntos, width / 2, 40);
}

function windowResized() {
  if (width < windowWidth) {
    return;
  }
  let escala = windowWidth / width;
  canvas.style("width", `${width*escala}px`);
  canvas.style("height", `${height*escala}px`);
}

function keyPressed(e) {
  if (isPaused) return;
  // Solo si canvas tiene foco
  if (document.activeElement !== canvas.elt) return;
  if (key === 'Escape') {
    isPaused = true;
    createPauseOverlay();
    noLoop();
    return;
  }
  clic();
}

function mouseReleased(e) {
  if (isPaused) return;
  // Solo si el clic fue dentro del canvas
  if (!isEventInsideCanvas(e)) return;
  clic();
}

// Para dispositivos táctiles
canvas?.elt?.addEventListener('touchend', function(e) {
  if (isPaused) return;
  if (!isEventInsideCanvas(e)) return;
  clic();
});

let contador_clics = 0;

function clic() {
  if (caer) { //El pajaro sube
    pajaro.aceleracion.set(createVector(0, -5));
    audio_wing[contador_clics++ % 3].play();
  } else { //EL juego se reinicia
    pajaro.resetearVariables();
    caer = true;
    contadorFotogramas = 0;
    puntos = 0;
    tubos = [];
  }
}

function perder() {
  if (caer) {
    audio_hit.play();
  }
  caer = false;
}

function Tubo() {
  const distancia_entre_tubos = 150;

  this.w = 100;
  this.h = 600;
  this.x = width;
  let aleatoriedad = 300 * Math.random() - 150;
  this.y = (height / 2) + aleatoriedad;
  this.y2 = this.y - this.h - distancia_entre_tubos;
  img_tubo.resize(this.w, img_tubo.height * this.w / img_tubo.width);
  this.dibujar = function() {
    fill("green");
    image(img_tubo, this.x, this.y);
    push();
    translate(this.x, this.y - distancia_entre_tubos);
    scale(1, -1);
    image(img_tubo, 0, 0);
    pop();
    if (caer) {
      this.x -= velocidad_suelo;
    }
  };
  this.areaColision = function() {
    return [
      new Rectangle(this.x, this.y, this.w, this.h),
      new Rectangle(this.x, this.y2, this.w, this.h),
    ];
  };
}

function Pajaro() {
  this.r = 60;
  this.resetearVariables = function() {
    this.pos = createVector(width / 2, height / 2);
    this.aceleracion = createVector(0, 0);
  };
  this.resetearVariables();
  for (const img of img_pajaro) {
    img.resize(this.r, img.height * this.r / img.width);
  }
  this.dibujar = function() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.aceleracion.copy().add(5, 0).heading());
    let i = Math.floor(contadorFotogramas / velocidad_suelo) % img_pajaro.length;
    let img = img_pajaro[i];
    image(img, -img.width / 2, -img.height / 2);
    pop();
    if (caer) {
      this.aceleracion.add(createVector(0, 0.2));
      this.pos.add(this.aceleracion);
    }
    if (this.areaColision().collidesRect(piso.areaColision())) {
      perder();
    }
    for (const tubo of tubos) {
      let colisiones = tubo.areaColision();
      for (const c of colisiones) {
        if (this.areaColision().collidesRect(c)) {
          perder();
        }
      }
    }
  };
  this.areaColision = function() {
    return new Circle(this.pos.x, this.pos.y, this.r - 15);
  };
}

function Piso() {
  this.w = ancho_escenario;
  this.h = 140;
  this.x = 0;
  this.y = alto_escenario - this.h;
  this.desface = 0;
  img_piso.resize(img_piso.width * img_piso.height / this.h, this.h);
  this.dibujar = function() {
    if (caer) {
      this.desface -= velocidad_suelo;
    }
    if (-this.desface >= img_piso.width) {
      this.desface = 0;
    }
    for (let i = 0; i < (this.w / img_piso.width) + 1; i++) {
      image(
        img_piso,
        this.x + img_piso.width * i + this.desface,
        this.y
      );
    }
  };
  this.areaColision = function() {
    return new Rectangle(this.x, this.y, this.w, this.h);
  };
}

// Al cargar, conectar el botón de pausa si existe
window.addEventListener('DOMContentLoaded', () => {
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) {
    pauseBtn.onclick = function () {
      if (!isPaused) {
        isPaused = true;
        createPauseOverlay();
        noLoop();
      }
    };
  }
});

// Solo permite clics/teclas dentro del canvas
function isEventInsideCanvas(e) {
  if (!canvas || !canvas.elt) return false;
  const rect = canvas.elt.getBoundingClientRect();
  let x, y;
  if (e.touches && e.touches.length) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }
  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}