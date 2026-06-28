const video = document.getElementById('mainVideo');
const player = document.getElementById('player');
const playerControls = document.getElementById('playerControls');
const centerPlayBtn = document.getElementById('centerPlayBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const currentTimeElement = document.getElementById('currentTime');
const durationElement = document.getElementById('duration');
const progressArea = document.getElementById('progressArea');
const progressPlayed = document.getElementById('progressPlayed');
const progressBuffered = document.getElementById('progressBuffered');
const progressThumb = document.getElementById('progressThumb');
const speedSelect = document.getElementById('speedSelect');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const customMinutes = document.getElementById('customMinutes');
const timerOptions = document.querySelectorAll('.timer-option');

let selectedMinutes = 1;
let scheduledPauseTime = null;

const cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
const statusBox = document.getElementById('statusBox');
const presetButtons = document.querySelectorAll('.preset-button');

let controlsTimer = null;
let isDraggingProgress = false;
let scheduledPauseTime = null;
let previousVolume = 1;

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function setStatus(message, type = 'default') {
  statusBox.textContent = message;
  statusBox.classList.remove('is-active', 'is-error');

  if (type === 'active') {
    statusBox.classList.add('is-active');
  }

  if (type === 'error') {
    statusBox.classList.add('is-error');
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
        volumeSlider.value = '1';
        video.volume = 1;
      }

      await video.play();
    } else {
      video.pause();
    }
  } catch (error) {
    console.error('No fue posible reproducir el video:', error);
    setStatus(
      'El navegador bloqueó la reproducción. Presiona nuevamente el botón de reproducción.',
      'error',
    );
  }
}

function updatePlaybackState() {
  const isPlaying = !video.paused && !video.ended;

  player.classList.toggle('is-playing', isPlaying);
  playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
  centerPlayBtn.setAttribute(
    'aria-label',
    isPlaying ? 'Pausar video' : 'Reproducir video',
  );

  if (isPlaying) {
    scheduleControlsHide();
  } else {
    showControls();
  }
}

function updateVolumeState() {
  const isMuted = video.muted || video.volume === 0;

  player.classList.toggle('is-muted', isMuted);
  muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');

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
  progressArea.setAttribute('aria-valuenow', String(Math.round(percentage)));
  progressArea.setAttribute(
    'aria-valuetext',
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
  const percentage = Math.min(100, (bufferedEnd / video.duration) * 100);

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
  player.classList.remove('controls-hidden');
  clearTimeout(controlsTimer);
}

function scheduleControlsHide() {
  clearTimeout(controlsTimer);

  if (video.paused || isDraggingProgress) {
    return;
  }

  controlsTimer = window.setTimeout(() => {
    player.classList.add('controls-hidden');
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
    console.error('No fue posible cambiar a pantalla completa:', error);
  }
}

function updateFullscreenState() {
  const isFullscreen = document.fullscreenElement === player;
  player.classList.toggle('is-fullscreen', isFullscreen);
  fullscreenBtn.setAttribute(
    'aria-label',
    isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa',
  );
}

function cancelScheduledPause() {
  scheduledPauseTime = null;
  cancelScheduleBtn.disabled = true;

  setStatus('El temporizador fue cancelado.');
}

function checkScheduledPause() {
  if (scheduledPauseTime === null) {
    return;
  }

  if (video.currentTime >= scheduledPauseTime) {
    video.pause();

    ```
scheduledPauseTime = null;
cancelScheduleBtn.disabled = true;

setStatus(
  "El temporizador terminó y el video fue pausado.",
  "active",
);
```;
  }
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

  if (key === ' ' || key === 'k') {
    event.preventDefault();
    togglePlayback();
  }

  if (key === 'm') {
    toggleMute();
  }

  if (key === 'f') {
    toggleFullscreen();
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    video.currentTime = Math.max(0, video.currentTime - 5);
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
  }
}

playPauseBtn.addEventListener('click', togglePlayback);
centerPlayBtn.addEventListener('click', togglePlayback);
video.addEventListener('click', togglePlayback);

muteBtn.addEventListener('click', toggleMute);

volumeSlider.addEventListener('input', () => {
  const volume = Number(volumeSlider.value);

  video.volume = volume;
  video.muted = volume === 0;

  if (volume > 0) {
    previousVolume = volume;
  }

  updateVolumeState();
});

speedSelect.addEventListener('change', () => {
  video.playbackRate = Number(speedSelect.value);
});

function selectTimerOption(button) {
  timerOptions.forEach(option => {
    option.classList.remove('active');
  });

  button.classList.add('active');
  selectedMinutes = Number(button.dataset.minutes);
  customMinutes.value = '';
}

function getSelectedMinutes() {
  const customValue = Number.parseInt(customMinutes.value, 10);

  if (Number.isInteger(customValue) && customValue > 0) {
    return customValue;
  }

  return selectedMinutes;
}

function schedulePause() {
  const minutes = getSelectedMinutes();

  if (!Number.isFinite(minutes) || minutes <= 0) {
    setStatus('Selecciona o escribe una cantidad válida de minutos.', 'error');
    return;
  }

  if (!Number.isFinite(video.duration)) {
    setStatus('Espera a que el video termine de cargar.', 'error');
    return;
  }

  const delaySeconds = minutes * 60;

  /*

* La pausa se calcula desde la posición actual.
*
* Ejemplo:
* posición actual: 35:19
* temporizador: 1 minuto
* pausa: 36:19
  */
  scheduledPauseTime = video.currentTime + delaySeconds;

  cancelScheduleBtn.disabled = false;

  setStatus(
    `El video se pausará después de ${minutes} ${
      minutes === 1 ? 'minuto' : 'minutos'
    }.`,
    'active',
  );
}

fullscreenBtn.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenState);

progressArea.addEventListener('pointerdown', event => {
  isDraggingProgress = true;
  progressArea.classList.add('is-dragging');
  progressArea.setPointerCapture(event.pointerId);
  seekFromPointer(event);
  showControls();
});

progressArea.addEventListener('pointermove', event => {
  if (isDraggingProgress) {
    seekFromPointer(event);
  }
});

progressArea.addEventListener('pointerup', event => {
  isDraggingProgress = false;
  progressArea.classList.remove('is-dragging');
  progressArea.releasePointerCapture(event.pointerId);
  scheduleControlsHide();
});

progressArea.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    video.currentTime = Math.max(0, video.currentTime - 5);
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
  }
});

player.addEventListener('mousemove', () => {
  showControls();
  scheduleControlsHide();
});

player.addEventListener('mouseleave', () => {
  scheduleControlsHide();
});

player.addEventListener('touchstart', showControls, { passive: true });

video.addEventListener('loadedmetadata', () => {
  durationElement.textContent = formatTime(video.duration);
  updateProgress();
});

video.addEventListener('durationchange', () => {
  durationElement.textContent = formatTime(video.duration);
});

video.addEventListener('timeupdate', updateProgress);
video.addEventListener('progress', updateBufferedProgress);
video.addEventListener('play', updatePlaybackState);
video.addEventListener('pause', updatePlaybackState);
video.addEventListener('ended', updatePlaybackState);
video.addEventListener('volumechange', updateVolumeState);

video.addEventListener('waiting', () => {
  player.classList.add('is-loading');
});

video.addEventListener('playing', () => {
  player.classList.remove('is-loading');
});

video.addEventListener('canplay', () => {
  player.classList.remove('is-loading');
});

video.addEventListener('error', () => {
  player.classList.remove('is-loading');
  setStatus(
    'No se pudo cargar el video. Verifica la URL del archivo en GitHub Releases.',
    'error',
  );
});

scheduleBtn.addEventListener('click', schedulePause);
cancelScheduleBtn.addEventListener('click', cancelScheduledPause);

timerOptions.forEach(button => {
  button.addEventListener('click', () => {
    selectTimerOption(button);
  });
});

customMinutes.addEventListener('input', () => {
  if (customMinutes.value !== '') {
    timerOptions.forEach(option => {
      option.classList.remove('active');
    });
  }
});

scheduleBtn.addEventListener('click', schedulePause);
cancelScheduleBtn.addEventListener('click', cancelScheduledPause);

document.addEventListener('keydown', handleKeyboard);

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
volumeSlider.value = '1';

updatePlaybackState();
updateVolumeState();
