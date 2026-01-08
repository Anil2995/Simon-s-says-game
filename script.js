const gameSeq = [];
let userSeq = [];
const colors = ["green", "red", "yellow", "blue"];
let started = false;
let level = 0;
let highScore = localStorage.getItem('simon-highscore') || 0;

// Update UI initially
document.getElementById("best-score").innerText = highScore;

// Audio Setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const frequencies = {
  green: 164.81, // E3
  red: 329.63,   // E4
  yellow: 261.63, // C4
  blue: 440      // A4
};

// UI Elements
const startBtn = document.getElementById("start-btn");
const levelDisplay = document.getElementById("level-title");
const gameOverModal = document.getElementById("game-over-modal");
const restartBtn = document.getElementById("restart-btn");
const finalScoreDisplay = document.getElementById("final-score");
const buttons = document.querySelectorAll(".btn");

// Start Game
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

// Handle Keypress for Desktop power users
document.addEventListener("keydown", (e) => {
  if (!started && e.key.toLowerCase() === 'a') {
    startGame(); // 'A' to start
  }
});

function startGame() {
  if (started) return;
  started = true;
  level = 0;
  gameSeq.length = 0;
  userSeq.length = 0;
  gameOverModal.classList.add("hidden");
  startBtn.style.display = 'none'; // Hide start button during game

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  nextLevel();
}

function playSound(color) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequencies[color] || 440;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();

  // Fade out
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

  oscillator.stop(audioCtx.currentTime + 0.5);
}

function flashButton(btn) {
  btn.classList.add("flash");
  const color = btn.getAttribute("id");
  playSound(color);

  setTimeout(() => {
    btn.classList.remove("flash");
  }, 300);
}

function nextLevel() {
  userSeq = [];
  level++;
  levelDisplay.innerText = level;

  const randIdx = Math.floor(Math.random() * 4);
  const randColor = colors[randIdx];
  gameSeq.push(randColor);

  // Play sequence
  let delay = 600;
  gameSeq.forEach((color, index) => {
    setTimeout(() => {
      const btn = document.querySelector(`.${color}`);
      flashButton(btn);
    }, (index + 1) * delay);
  });
}

function checkAnswer(idx) {
  if (userSeq[idx] === gameSeq[idx]) {
    if (userSeq.length === gameSeq.length) {
      setTimeout(nextLevel, 1000);
    }
  } else {
    gameOver();
  }
}

function gameOver() {
  playSound('wrong'); // Will fallback to 440 or we can make a custom error sound
  document.body.classList.add("game-over-flash");
  setTimeout(() => document.body.classList.remove("game-over-flash"), 200);

  // Update High Score
  if (level > highScore) {
    highScore = level;
    localStorage.setItem('simon-highscore', highScore);
    document.getElementById("best-score").innerText = highScore;
  }

  finalScoreDisplay.innerText = level;
  gameOverModal.classList.remove("hidden");
  startBtn.style.display = 'flex';
  startBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> RESTART';
  started = false;
}

function resetGame() {
  gameOverModal.classList.add("hidden");
  startGame();
}

function handleBtnClick() {
  if (!started) return;

  const btn = this;
  flashButton(btn);

  const userColor = btn.getAttribute("id");
  userSeq.push(userColor);

  checkAnswer(userSeq.length - 1);
}

// Event Listeners for Game Buttons
buttons.forEach(btn => {
  btn.addEventListener("click", handleBtnClick);
});

// Error buzzer (optional, overriding playSound for 'wrong')
const oldPlaySound = playSound;
playSound = function (color) {
  if (color === 'wrong') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 110; // Low buzz
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } else {
    oldPlaySound(color);
  }
}
