const video = document.getElementById("mainVideo");
const player = document.getElementById("player");
const playerControls = document.getElementById("playerControls");
const centerPlayBtn = document.getElementById("centerPlayBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const currentTimeElement = document.getElementById("currentTime");
const durationElement = document.getElementById("duration");
const progressArea = document.getElementById("progressArea");
const progressPlayed = document.getElementById("progressPlayed");
const progressBuffered = document.getElementById("progressBuffered");
const progressThumb = document.getElementById("progressThumb");
const speedSelect = document.getElementById("speedSelect");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const pauseMinutes = document.getElementById("pauseMinutes");
const pauseSeconds = document.getElementById("pauseSeconds");
const scheduleBtn = document.getElementById("scheduleBtn");
const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");
const statusBox = document.getElementById("statusBox");
const presetButtons = document.querySelectorAll(".preset-button");

let controlsTimer = null;
let isDraggingProgress = false;
let scheduledPauseTime = null;
let previousVolume = 1;

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function setStatus(message, type = "default") {
  statusBox.textContent = message;
  statusBox.classList.remove("is-active", "is-error");

  if (type === "active") {
    statusBox.classList.add("is-active");
  }

  if (type === "error") {
    statusBox.classList.add("is-error");
  }
}

async function togglePlayback() {
  try {
    if (video.paused || video.ended) {
      /*
       * El audio solo puede iniciarse después de una interacción del usuario.
       * Por eso el video no usa autoplay ni muted en el HTML.
       */
      video.muted = false;

      if (Number(volumeSlider.value) === 0) {
        volumeSlider.value = "1";
        video.volume = 1;
      }

      await video.play();
    } else {
      video.pause();
    }
  } catch (error) {
    console.error("No fue posible reproducir el video:", error);
    setStatus(
      "El navegador bloqueó la reproducción. Presiona nuevamente el botón de reproducción.",
      "error",
    );
  }
}

function updatePlaybackState() {
  const isPlaying = !video.paused && !video.ended;

  player.classList.toggle("is-playing", isPlaying);
  playPauseBtn.setAttribute(
    "aria-label",
    isPlaying ? "Pausar" : "Reproducir",
  );
  centerPlayBtn.setAttribute(
    "aria-label",
    isPlaying ? "Pausar video" : "Reproducir video",
  );

  if (isPlaying) {
    scheduleControlsHide();
  } else {
    showControls();
  }
}

function updateVolumeState() {
  const isMuted = video.muted || video.volume === 0;

  player.classList.toggle("is-muted", isMuted);
  muteBtn.setAttribute(
    "aria-label",
    isMuted ? "Activar sonido" : "Silenciar",
  );

  if (!video.muted) {
    volumeSlider.value = String(video.volume);
  }
}

function toggleMute() {
  if (video.muted || video.volume === 0) {
    video.muted = false;
    video.volume = previousVolume > 0 ? previousVolume : 1;
    volumeSlider.value = String(video.volume);
  } else {
    previousVolume = video.volume;
    video.muted = true;
  }

  updateVolumeState();
}

function updateProgress() {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return;
  }

  const percentage = (video.currentTime / video.duration) * 100;

  if (!isDraggingProgress) {
    progressPlayed.style.width = `${percentage}%`;
    progressThumb.style.left = `${percentage}%`;
  }

  currentTimeElement.textContent = formatTime(video.currentTime);
  progressArea.setAttribute("aria-valuenow", String(Math.round(percentage)));
  progressArea.setAttribute(
    "aria-valuetext",
    `${formatTime(video.currentTime)} de ${formatTime(video.duration)}`,
  );

  checkScheduledPause();
}

function updateBufferedProgress() {
  if (
    !Number.isFinite(video.duration) ||
    video.duration <= 0 ||
    video.buffered.length === 0
  ) {
    return;
  }

  const bufferedEnd = video.buffered.end(video.buffered.length - 1);
  const percentage = Math.min(
    100,
    (bufferedEnd / video.duration) * 100,
  );

  progressBuffered.style.width = `${percentage}%`;
}

function seekFromPointer(event) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return;
  }

  const bounds = progressArea.getBoundingClientRect();
  const position = Math.min(
    Math.max(event.clientX - bounds.left, 0),
    bounds.width,
  );
  const percentage = position / bounds.width;

  progressPlayed.style.width = `${percentage * 100}%`;
  progressThumb.style.left = `${percentage * 100}%`;
  video.currentTime = percentage * video.duration;
}

function showControls() {
  player.classList.remove("controls-hidden");
  clearTimeout(controlsTimer);
}

function scheduleControlsHide() {
  clearTimeout(controlsTimer);

  if (video.paused || isDraggingProgress) {
    return;
  }

  controlsTimer = window.setTimeout(() => {
    player.classList.add("controls-hidden");
  }, 2400);
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await player.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error("No fue posible cambiar a pantalla completa:", error);
  }
}

function updateFullscreenState() {
  const isFullscreen = document.fullscreenElement === player;
  player.classList.toggle("is-fullscreen", isFullscreen);
  fullscreenBtn.setAttribute(
    "aria-label",
    isFullscreen ? "Salir de pantalla completa" : "Pantalla completa",
  );
}

function getScheduledTime() {
  const minutes = Number.parseInt(pauseMinutes.value, 10);
  const seconds = Number.parseInt(pauseSeconds.value, 10);

  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    minutes < 0 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return minutes * 60 + seconds;
}

function schedulePause() {
  const targetTime = getScheduledTime();

  if (targetTime === null) {
    setStatus(
      "Ingresa minutos válidos y segundos entre 0 y 59.",
      "error",
    );
    return;
  }

  if (!Number.isFinite(video.duration)) {
    setStatus(
      "Espera a que el video termine de cargar antes de programar la pausa.",
      "error",
    );
    return;
  }

  if (targetTime <= video.currentTime) {
    setStatus(
      `El tiempo debe ser posterior a la posición actual (${formatTime(video.currentTime)}).`,
      "error",
    );
    return;
  }

  if (targetTime > video.duration) {
    setStatus(
      `El tiempo indicado supera la duración del video (${formatTime(video.duration)}).`,
      "error",
    );
    return;
  }

  scheduledPauseTime = targetTime;
  cancelScheduleBtn.disabled = false;

  setStatus(
    `La reproducción se pausará en ${formatTime(scheduledPauseTime)}.`,
    "active",
  );
}

function cancelScheduledPause() {
  scheduledPauseTime = null;
  cancelScheduleBtn.disabled = true;
  setStatus("No hay una pausa programada.");
}

function checkScheduledPause() {
  if (scheduledPauseTime === null) {
    return;
  }

  if (video.currentTime >= scheduledPauseTime) {
    const completedTime = scheduledPauseTime;

    video.pause();
    scheduledPauseTime = null;
    cancelScheduleBtn.disabled = true;

    setStatus(
      `El video se pausó automáticamente en ${formatTime(completedTime)}.`,
      "active",
    );
  }
}

function applyPreset(totalSeconds, selectedButton) {
  pauseMinutes.value = String(Math.floor(totalSeconds / 60));
  pauseSeconds.value = String(totalSeconds % 60);

  presetButtons.forEach((button) => {
    button.classList.toggle("active", button === selectedButton);
  });
}

function handleKeyboard(event) {
  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLButtonElement
  ) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === " " || key === "k") {
    event.preventDefault();
    togglePlayback();
  }

  if (key === "m") {
    toggleMute();
  }

  if (key === "f") {
    toggleFullscreen();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    video.currentTime = Math.max(0, video.currentTime - 5);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    video.currentTime = Math.min(
      video.duration || 0,
      video.currentTime + 5,
    );
  }
}

playPauseBtn.addEventListener("click", togglePlayback);
centerPlayBtn.addEventListener("click", togglePlayback);
video.addEventListener("click", togglePlayback);

muteBtn.addEventListener("click", toggleMute);

volumeSlider.addEventListener("input", () => {
  const volume = Number(volumeSlider.value);

  video.volume = volume;
  video.muted = volume === 0;

  if (volume > 0) {
    previousVolume = volume;
  }

  updateVolumeState();
});

speedSelect.addEventListener("change", () => {
  video.playbackRate = Number(speedSelect.value);
});

fullscreenBtn.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenState);

progressArea.addEventListener("pointerdown", (event) => {
  isDraggingProgress = true;
  progressArea.classList.add("is-dragging");
  progressArea.setPointerCapture(event.pointerId);
  seekFromPointer(event);
  showControls();
});

progressArea.addEventListener("pointermove", (event) => {
  if (isDraggingProgress) {
    seekFromPointer(event);
  }
});

progressArea.addEventListener("pointerup", (event) => {
  isDraggingProgress = false;
  progressArea.classList.remove("is-dragging");
  progressArea.releasePointerCapture(event.pointerId);
  scheduleControlsHide();
});

progressArea.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    video.currentTime = Math.max(0, video.currentTime - 5);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    video.currentTime = Math.min(
      video.duration || 0,
      video.currentTime + 5,
    );
  }
});

player.addEventListener("mousemove", () => {
  showControls();
  scheduleControlsHide();
});

player.addEventListener("mouseleave", () => {
  scheduleControlsHide();
});

player.addEventListener("touchstart", showControls, { passive: true });

video.addEventListener("loadedmetadata", () => {
  durationElement.textContent = formatTime(video.duration);
  updateProgress();
});

video.addEventListener("durationchange", () => {
  durationElement.textContent = formatTime(video.duration);
});

video.addEventListener("timeupdate", updateProgress);
video.addEventListener("progress", updateBufferedProgress);
video.addEventListener("play", updatePlaybackState);
video.addEventListener("pause", updatePlaybackState);
video.addEventListener("ended", updatePlaybackState);
video.addEventListener("volumechange", updateVolumeState);

video.addEventListener("waiting", () => {
  player.classList.add("is-loading");
});

video.addEventListener("playing", () => {
  player.classList.remove("is-loading");
});

video.addEventListener("canplay", () => {
  player.classList.remove("is-loading");
});

video.addEventListener("error", () => {
  player.classList.remove("is-loading");
  setStatus(
    "No se pudo cargar el video. Verifica la URL del archivo en GitHub Releases.",
    "error",
  );
});

scheduleBtn.addEventListener("click", schedulePause);
cancelScheduleBtn.addEventListener("click", cancelScheduledPause);

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const seconds = Number(button.dataset.seconds);
    applyPreset(seconds, button);
  });
});

document.addEventListener("keydown", handleKeyboard);

/*
 * Estado inicial:
 * - Sin autoplay.
 * - Sin muted.
 * - Volumen al 100 %.
 *
 * El usuario debe presionar Play una vez. Esta interacción permite que
 * el navegador reproduzca el audio sin bloquearlo.
 */
video.volume = 1;
video.muted = false;
volumeSlider.value = "1";

updatePlaybackState();
updateVolumeState();
