const greeting = document.getElementById("greeting");
const helloButton = document.getElementById("hello");
const contactButton = document.getElementById("contact-button");
const contactForm = document.getElementById("contact-form");

function sayHello() {
  greeting.textContent = "Привет! Добро пожаловать в учебное портфолио!";
}

helloButton.addEventListener("click", sayHello);

contactButton.addEventListener("click", () => {
  contactForm.hidden = !contactForm.hidden;
  contactButton.setAttribute("aria-expanded", String(!contactForm.hidden));
  contactButton.textContent = contactForm.hidden
    ? "Показать учебную форму"
    : "Скрыть учебную форму";
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

const pixelCanvas = document.getElementById("pixel-background");
const pixelContext = pixelCanvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const backgroundVideo = document.getElementById("video-background");

function updateBackgroundVideo() {
  if (reducedMotion.matches || document.hidden) {
    backgroundVideo.pause();
    backgroundVideo.hidden = reducedMotion.matches;
    return;
  }

  backgroundVideo.hidden = false;
  backgroundVideo.muted = true;
  backgroundVideo.play().catch(() => {
    // Если браузер запрещает автозапуск, оставляем статичный фон.
    backgroundVideo.hidden = true;
  });
}

backgroundVideo.addEventListener("error", () => {
  backgroundVideo.hidden = true;
});
reducedMotion.addEventListener("change", updateBackgroundVideo);
document.addEventListener("visibilitychange", updateBackgroundVideo);
updateBackgroundVideo();

const foreground = document.querySelectorAll(".site-header, .container");
const pixelColors = ["#b74cff", "#ed80ff", "#d5ff43"];
let pixels = [];
let animationFrame = null;
let previousTime = 0;
let lastSpawnTime = 0;

function clearPixels() {
  cancelAnimationFrame(animationFrame);
  animationFrame = null;
  pixels = [];
  pixelContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function resizePixelCanvas() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  pixelCanvas.width = Math.round(window.innerWidth * scale);
  pixelCanvas.height = Math.round(window.innerHeight * scale);
  pixelContext.setTransform(scale, 0, 0, scale, 0, 0);
  clearPixels();
}

function animatePixels(time) {
  const elapsed = Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  pixelContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  pixels = pixels.filter((pixel) => pixel.life > 0);

  for (const pixel of pixels) {
    pixel.life -= elapsed;
    pixel.x += pixel.vx * elapsed;
    pixel.y += pixel.vy * elapsed;
    pixelContext.globalAlpha = Math.max(0, pixel.life / pixel.duration) * 0.7;
    pixelContext.fillStyle = pixel.color;
    pixelContext.fillRect(Math.round(pixel.x), Math.round(pixel.y), pixel.size, pixel.size);
  }

  pixelContext.globalAlpha = 1;
  // Удаляем частицы под всей областью содержимого, включая текст и форму.
  for (const element of foreground) {
    const rect = element.getBoundingClientRect();
    pixelContext.clearRect(rect.left - 8, rect.top - 8, rect.width + 16, rect.height + 16);
  }

  animationFrame = pixels.length ? requestAnimationFrame(animatePixels) : null;
}

window.addEventListener("pointermove", (event) => {
  if (!pixelContext || reducedMotion.matches || event.pointerType !== "mouse"
      || event.target.closest(".site-header, .container")) {
    return;
  }

  const time = performance.now();
  if (time - lastSpawnTime < 24) return;
  lastSpawnTime = time;

  for (let i = 0; i < 3; i += 1) {
    const duration = 0.5 + Math.random() * 0.4;
    pixels.push({
      x: event.clientX + (Math.random() - 0.5) * 16,
      y: event.clientY + (Math.random() - 0.5) * 16,
      vx: (Math.random() - 0.5) * 45,
      vy: 15 + Math.random() * 30,
      size: 3 + Math.floor(Math.random() * 3) * 2,
      color: pixelColors[Math.floor(Math.random() * pixelColors.length)],
      life: duration,
      duration,
    });
  }
  pixels = pixels.slice(-90);

  if (animationFrame === null) {
    previousTime = time;
    animationFrame = requestAnimationFrame(animatePixels);
  }
});

if (pixelContext) {
  resizePixelCanvas();
  window.addEventListener("resize", resizePixelCanvas);
  window.addEventListener("scroll", clearPixels, { passive: true });
  window.addEventListener("blur", clearPixels);
  document.addEventListener("visibilitychange", clearPixels);
  reducedMotion.addEventListener("change", clearPixels);
}
