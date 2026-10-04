/* =====================================
   歡樂打地鼠 - script.js
===================================== */

const GAME_TIME = 60;          // 遊戲時間（秒）
const POINTS_PER_HIT = 10;     // 每擊中一隻基礎分數
const MOLE_MIN_TIME = 550;     // 地鼠停留最小時間 (毫秒)
const MOLE_MAX_TIME = 1100;    // 地鼠停留最大時間 (毫秒)

// DOM 元素獲取
const holes = document.querySelectorAll(".hole");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");
const timeElement = document.getElementById("time");
const startButton = document.getElementById("startButton");
const bestScoreElement = document.getElementById("bestScore");
const gameOverModal = document.getElementById("gameOver");
const finalScoreElement = document.getElementById("finalScore");
const resultMessageElement = document.getElementById("resultMessage");
const restartButton = document.getElementById("restartButton");
const feedbackElement = document.getElementById("feedback");

// 狀態變數
let score = 0;
let combo = 0;
let timeLeft = GAME_TIME;
let gameTimer = null;
let moleTimer = null;
let isPlaying = false;
let lastHoleIndex = -1;

// 初始化載入歷史最高分
let bestScore = localStorage.getItem("whack_a_mole_best") || 0;
bestScoreElement.textContent = bestScore;

// 隨機選洞（確保不連續出現同一個洞）
function getRandomHole() {
    let index;
    do {
        index = Math.floor(Math.random() * holes.length);
    } while (index === lastHoleIndex);
    lastHoleIndex = index;
    return holes[index];
}

// 隨機時間區間計算
function getRandomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

// 控制地鼠冒出與縮回
function popupMole() {
    if (!isPlaying) return;

    const hole = getRandomHole();
    hole.classList.add("active");

    const stayTime = getRandomTime(MOLE_MIN_TIME, MOLE_MAX_TIME);

    moleTimer = setTimeout(() => {
        hole.classList.remove("active");
        if (isPlaying) {
            popupMole();
        }
    }, stayTime);
}

// 開始遊戲
function startGame() {
    if (isPlaying) return;

    // 歸零狀態
    score = 0;
    combo = 0;
    timeLeft = GAME_TIME;
    isPlaying = true;

    scoreElement.textContent = score;
    comboElement.textContent = combo;
    timeElement.textContent = timeLeft;

    startButton.disabled = true;
    gameOverModal.classList.remove("show");

    // 啟動主倒數計時器
    gameTimer = setInterval(() => {
        timeLeft--;
        timeElement.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // 開始彈出地鼠
    popupMole();
}

// 結束遊戲
function endGame() {
    isPlaying = false;
    clearInterval(gameTimer);
    clearTimeout(moleTimer);

    // 清除畫面上所有活著的地鼠
    holes.forEach(hole => {
        hole.classList.remove("active", "hit");
    });

    startButton.disabled = false;

    // 紀錄與更新最高分
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("whack_a_mole_best", bestScore);
        bestScoreElement.textContent = bestScore;
    }

    // 更新結算畫面資訊
    finalScoreElement.textContent = score;
    if (score >= 200) {
        resultMessageElement.textContent = "🏆 太厲害了！地鼠剋星就是你！";
    } else if (score >= 100) {
        resultMessageElement.textContent = "🎉 身手敏捷，表現很棒！";
    } else {
        resultMessageElement.textContent = "💪 再接再厲，下次一定更高分！";
    }

    gameOverModal.classList.add("show");
}

// 畫面浮動提示字（打擊/Combo 效果）
function showFeedback(text) {
    feedbackElement.textContent = text;
    feedbackElement.classList.add("show");
    setTimeout(() => {
        feedbackElement.classList.remove("show");
    }, 400);
}

// 綁定地鼠點擊事件
holes.forEach((hole) => {
    hole.addEventListener("click", () => {
        if (!isPlaying) return;

        if (hole.classList.contains("active") && !hole.classList.contains("hit")) {
            // 成功打中地鼠
            hole.classList.remove("active");
            hole.classList.add("hit");

            combo++;
            score += POINTS_PER_HIT + (combo > 1 ? (combo - 1) * 2 : 0);

            scoreElement.textContent = score;
            comboElement.textContent = combo;

            showFeedback(combo > 1 ? `Combo x${combo}!` : "+10");

            setTimeout(() => {
                hole.classList.remove("hit");
            }, 300);
        } else if (!hole.classList.contains("hit")) {
            // 揮空（重置 Combo）
            combo = 0;
            comboElement.textContent = combo;
        }
    });
});

// 綁定按鈕點擊事件
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
