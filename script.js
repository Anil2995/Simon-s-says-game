// Simon Says Game - Enhanced Version
const gameSeq = [];
let userSeq = [];
const colors = ["green", "red", "yellow", "blue"];
let started = false;
let level = 0;
let highScore = parseInt(localStorage.getItem('simon-highscore')) || 0;
let isPlayingSequence = false;
let userCanClick = false;

// Audio Setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// Initialize audio context on first user interaction
function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

const frequencies = {
  green: 261.63,  // C4
  red: 329.63,    // E4
  yellow: 392.00, // G4
  blue: 493.88,   // B4
  wrong: 110      // A2 (error sound)
};

// UI Elements
const startBtn = document.getElementById("start-btn");
const levelDisplay = document.getElementById("level-title");
const currentLevelDisplay = document.getElementById("current-level");
const bestScoreDisplay = document.getElementById("best-score");
const bestScoreDisplayStats = document.getElementById("best-score-display");
const gameOverModal = document.getElementById("game-over-modal");
const restartBtn = document.getElementById("restart-btn");
const finalScoreDisplay = document.getElementById("final-score");
const newRecordDisplay = document.getElementById("new-record");
const buttons = document.querySelectorAll(".btn");

// Initialize UI
updateScoreDisplays();

// Event Listeners
startBtn.addEventListener("click", () => {
  initAudio();
  startGame();
});

restartBtn.addEventListener("click", () => {
  initAudio();
  resetGame();
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (!started && (e.key.toLowerCase() === 'a' || e.key === ' ')) {
    initAudio();
    startGame();
  }
});

// Game Button Click Handlers
buttons.forEach(btn => {
  btn.addEventListener("click", handleBtnClick);

  // Prevent clicks during sequence playback
  btn.addEventListener("mousedown", (e) => {
    if (!userCanClick) {
      e.preventDefault();
    }
  });
});

// Start Game
function startGame() {
  if (started) return;

  started = true;
  level = 0;
  gameSeq.length = 0;
  userSeq.length = 0;
  gameOverModal.classList.add("hidden");
  startBtn.style.display = 'none';

  nextLevel();
}

// Play Sound with Web Audio API
function playSound(color) {
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  if (color === 'wrong') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequencies.wrong;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    oscillator.stop(audioCtx.currentTime + 0.6);
  } else {
    oscillator.type = 'sine';
    oscillator.frequency.value = frequencies[color] || 440;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    oscillator.stop(audioCtx.currentTime + 0.4);
  }
}

// Flash Button Animation
function flashButton(btn) {
  return new Promise((resolve) => {
    btn.classList.add("flash");
    const color = btn.getAttribute("id");
    playSound(color);

    setTimeout(() => {
      btn.classList.remove("flash");
      resolve();
    }, 400);
  });
}

// Next Level
async function nextLevel() {
  userSeq = [];
  level++;
  isPlayingSequence = true;
  userCanClick = false;

  updateScoreDisplays();

  // Add new color to sequence
  const randIdx = Math.floor(Math.random() * 4);
  const randColor = colors[randIdx];
  gameSeq.push(randColor);

  // Wait before playing sequence
  await new Promise(resolve => setTimeout(resolve, 800));

  // Play sequence
  for (let i = 0; i < gameSeq.length; i++) {
    const color = gameSeq[i];
    const btn = document.querySelector(`.${color}`);
    await flashButton(btn);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Allow user input
  isPlayingSequence = false;
  userCanClick = true;
}

// Check User Answer
function checkAnswer(idx) {
  if (userSeq[idx] === gameSeq[idx]) {
    // Correct so far
    if (userSeq.length === gameSeq.length) {
      // Level complete!
      userCanClick = false;
      setTimeout(() => {
        nextLevel();
      }, 1000);
    }
  } else {
    // Wrong answer
    gameOver();
  }
}

// Game Over
function gameOver() {
  playSound('wrong');
  document.body.classList.add("game-over-flash");
  setTimeout(() => document.body.classList.remove("game-over-flash"), 500);

  // Check if new high score
  let isNewRecord = false;
  if (level > highScore) {
    highScore = level;
    localStorage.setItem('simon-highscore', highScore);
    isNewRecord = true;
  }

  updateScoreDisplays();

  // Show modal
  finalScoreDisplay.innerText = level;

  if (isNewRecord && level > 1) {
    newRecordDisplay.classList.remove("hidden");
  } else {
    newRecordDisplay.classList.add("hidden");
  }

  gameOverModal.classList.remove("hidden");
  startBtn.style.display = 'flex';
  startBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> RESTART';

  started = false;
  userCanClick = false;
}

// Reset Game
function resetGame() {
  gameOverModal.classList.add("hidden");
  startGame();
}

// Handle Button Click
function handleBtnClick() {
  if (!started || !userCanClick || isPlayingSequence) return;

  const btn = this;
  flashButton(btn);

  const userColor = btn.getAttribute("id");
  userSeq.push(userColor);

  checkAnswer(userSeq.length - 1);
}

// Update Score Displays
function updateScoreDisplays() {
  levelDisplay.innerText = level;
  currentLevelDisplay.innerText = level;
  bestScoreDisplay.innerText = highScore;
  bestScoreDisplayStats.innerText = highScore;
}

// Prevent double-tap zoom on mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// Add visual feedback for button hover on desktop
buttons.forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    if (userCanClick && !isPlayingSequence) {
      btn.style.opacity = '0.9';
    }
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.opacity = '0.7';
  });
});

// Log game version
console.log('%cSimon Says Game v2.0', 'color: #00ff88; font-size: 20px; font-weight: bold;');
console.log('%cEnhanced with improved UI/UX and game mechanics', 'color: #00ccff; font-size: 12px;');
