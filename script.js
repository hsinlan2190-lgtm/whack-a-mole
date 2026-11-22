"use strict";

// ==============================
// 遊戲設定
// ==============================

const GAME_DURATION = 60;
const MOLE_MIN_DELAY = 700;
const MOLE_MAX_DELAY = 1200;
const FRAME_DELAY = 100;
const POINTS_PER_HIT = 10;

// 圖片路徑
const ASSET_PATH = "assets/";

const MOLE_FRAMES = {
  emerge: [
    "mole_01_emerge_start.png",
    "mole_02_head_rising.png",
    "mole_03_eyes_visible.png",
    "mole_04_nose_visible.png",
    "mole_05_fully_emerged.png"
  ],

  hit: [
    "mole_06_surprised.png",
    "mole_07_hit_reaction.png",
    "mole_08_stars.png",
    "mole_09_dizzy.png"
  ],

  retreat: [
    "mole_10_retreat_start.png",
    "mole_11_head_sinking.png",
    "mole_12_retracted.png"
  ]
};

// ==============================
// 取得 HTML 元素
// ==============================

const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");
const timeElement = document.getElementById("time");
const bestElement = document.getElementById("best");
const messageElement = document.getElementById("message");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const holes = Array.from(
  document.querySelectorAll(".hole")
);

// ==============================
// 遊戲狀態
// ==============================

let score = 0;
let combo = 0;
let timeLeft = GAME_DURATION;
let bestScore = loadBestScore();

let isPlaying = false;
let activeHole = null;
let previousHole = null;
let canHit = false;

let frameTimer = null;
let moleTimer = null;
let nextMoleTimer = null;
let countdownTimer = null;

// ==============================
// 最高分紀錄
// ==============================

function loadBestScore() {
  try {
    return Number(
      localStorage.getItem("whackAMoleBest")
    ) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(
      "whackAMoleBest",
      String(value)
    );
  } catch (error) {
    // 無法儲存時，遊戲仍可正常進行
  }
}

// ==============================
// 更新畫面
// ==============================

function updateDisplay() {
  scoreElement.textContent = score;
  comboElement.textContent = combo;
  timeElement.textContent = timeLeft;
  bestElement.textContent = bestScore;
}

// ==============================
// 清除計時器
// ==============================

function clearGameTimers() {
  clearTimeout(frameTimer);
  clearTimeout(moleTimer);
  clearTimeout(nextMoleTimer);
  clearInterval(countdownTimer);

  frameTimer = null;
  moleTimer = null;
  nextMoleTimer = null;
  countdownTimer = null;
}

// ==============================
// 設定地鼠圖片
// ==============================

function setMoleFrame(hole, filename) {
  const image = hole.querySelector(".mole-image");

  if (!image) return;

  image.src = ASSET_PATH + filename;
}

// ==============================
// 依序播放圖片動畫
// ==============================

function playFrames(hole, frames, index, callback) {
  if (!isPlaying) return;

  if (index >= frames.length) {
    if (callback) callback();
    return;
  }

  setMoleFrame(hole, frames[index]);

  frameTimer = setTimeout(() => {
    playFrames(hole, frames, index + 1, callback);
  }, FRAME_DELAY);
}

// ==============================
// 隱藏所有地鼠
// ==============================

function hideAllMoles() {
  holes.forEach((hole) => {
    hole.classList.remove("active");

    setMoleFrame(
      hole,
      "mole_12_retracted.png"
    );
  });

  activeHole = null;
  canHit = false;
}

// ==============================
// 地鼠退回洞裡
// ==============================

function retreatMole() {
  if (!isPlaying || !activeHole) return;

  const hole = activeHole;

  canHit = false;

  playFrames(
    hole,
    MOLE_FRAMES.retreat,
    0,
    () => {
      hole.classList.remove("active");

      setMoleFrame(
        hole,
        "mole_12_retracted.png"
      );

      activeHole = null;

      if (isPlaying) {
        nextMoleTimer = setTimeout(
          showMole,
          250
        );
      }
    }
  );
}

// ==============================
// 地鼠出現
// ==============================

function showMole() {
  if (!isPlaying) return;

  canHit = false;
  activeHole = null;

  let availableHoles = holes.filter(
    (hole) => hole !== previousHole
  );

  if (availableHoles.length === 0) {
    availableHoles = holes;
  }

  const randomIndex = Math.floor(
    Math.random() * availableHoles.length
  );

  const selectedHole = availableHoles[randomIndex];

  activeHole = selectedHole;
  previousHole = selectedHole;

  selectedHole.classList.add("active");

  // 播放地鼠出現的 01～05 張圖片
  playFrames(
    selectedHole,
    MOLE_FRAMES.emerge,
    0,
    () => {
      if (!isPlaying || activeHole !== selectedHole) {
        return;
      }

      // 第 05 張播放完成後才可以打地鼠
      canHit = true;

      const delay =
        Math.floor(
          Math.random() *
          (MOLE_MAX_DELAY - MOLE_MIN_DELAY + 1)
        ) + MOLE_MIN_DELAY;

      // 時間到了，地鼠自動退場
      moleTimer = setTimeout(() => {
        if (!isPlaying || activeHole !== selectedHole) {
          return;
        }

        combo = 0;
        updateDisplay();

        messageElement.textContent =
          "地鼠跑掉了！下一隻要快一點喔！";

        retreatMole();

      }, delay);
    }
  );
}

// ==============================
// 打中地鼠
// ==============================

function handleHoleClick(event) {
  if (!isPlaying) return;

  const clickedHole = event.currentTarget;

  if (
    clickedHole !== activeHole ||
    !canHit
  ) {
    return;
  }

  // 避免重複點擊
  canHit = false;

  clearTimeout(moleTimer);
  clearTimeout(frameTimer);

  combo += 1;

  let points = POINTS_PER_HIT;

  if (combo >= 3) {
    points += 5;
  }

  if (combo >= 5) {
    points += 5;
  }

  score += points;

  messageElement.textContent =
    combo >= 5
      ? "太厲害了！連續命中！⭐"
      : combo >= 3
        ? "連擊成功！繼續加油！"
        : "打中了！+" + points + " 分";

  if (score > bestScore) {
    bestScore = score;
    saveBestScore(bestScore);
  }

  updateDisplay();

  // 播放 06～09 張被打中的圖片
  playFrames(
    clickedHole,
    MOLE_FRAMES.hit,
    0,
    () => {
      // 被打中後，再播放 10～12 張退場
      retreatMole();
    }
  );
}

// ==============================
// 開始遊戲
// ==============================

function startGame() {
  if (isPlaying) return;

  clearGameTimers();

  score = 0;
  combo = 0;
  timeLeft = GAME_DURATION;
  previousHole = null;

  isPlaying = true;

  hideAllMoles();

  startButton.disabled = true;
  startButton.textContent = "遊戲進行中";

  messageElement.textContent =
    "開始！快打地鼠！";

  updateDisplay();

  showMole();

  countdownTimer = setInterval(() => {
    if (!isPlaying) return;

    timeLeft -= 1;

    updateDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// ==============================
// 結束遊戲
// ==============================

function endGame() {
  if (!isPlaying) return;

  isPlaying = false;

  clearGameTimers();
  hideAllMoles();

  startButton.disabled = false;
  startButton.textContent = "再玩一次";

  messageElement.textContent =
    "遊戲結束！你得到 " +
    score +
    " 分！再挑戰一次吧！";

  updateDisplay();
}

// ==============================
// 重新開始
// ==============================

function restartGame() {
  if (isPlaying) {
    isPlaying = false;
    clearGameTimers();
    hideAllMoles();
  }

  startGame();
}

// ==============================
// 綁定事件
// ==============================

holes.forEach((hole) => {
  hole.addEventListener(
    "click",
    handleHoleClick
  );
});

startButton.addEventListener(
  "click",
  startGame
);

restartButton.addEventListener(
  "click",
  restartGame
);

// ==============================
// 初始化
// ==============================

hideAllMoles();
updateDisplay();

messageElement.textContent =
  "按下開始遊戲，看看你能得到幾分！";
