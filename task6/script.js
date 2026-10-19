'use strict';

// ---------- Константы ----------
const CELL_SIZE = 20;          // размер клетки, px
const GRID_SIZE = 20;          // поле 20x20 клеток (400x400 px)
const MOVE_INTERVAL = 150;     // мс между шагами змейки

const DIRECTIONS = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y: 1 },
  ArrowLeft:  { x: -1, y: 0 },
  ArrowRight: { x: 1,  y: 0 }
};

// ---------- DOM ----------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

// ---------- Состояние игры (только данные, без рисования) ----------
let state = null;
let lastMoveTime = 0;
let rafId = null;

function createInitialState() {
  return {
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }], // [0] — голова
    direction: { x: 1, y: 0 },   // змейка движется вправо
    inputQueue: [],              // буфер нажатий (чтобы не терять быстрые нажатия)
    apple: null,
    score: 0,
    gameOver: false,
    won: false
  };
}

// ---------- Логика ----------
function isSameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function spawnApple() {
  const freeCells = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const cell = { x, y };
      if (!state.snake.some(segment => isSameCell(segment, cell))) {
        freeCells.push(cell);
      }
    }
  }
  if (freeCells.length === 0) {   // поле заполнено — победа, без зависания
    state.apple = null;
    state.won = true;
    state.gameOver = true;
    return;
  }
  state.apple = freeCells[Math.floor(Math.random() * freeCells.length)];
}

function checkCollision(head, body) {
  const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID_SIZE || head.y >= GRID_SIZE;
  const hitSelf = body.some(segment => isSameCell(segment, head));
  return hitWall || hitSelf;
}

function handleDirectionInput(newDir) {
  // сравниваем с последним направлением в очереди (или текущим)
  const last = state.inputQueue.length
    ? state.inputQueue[state.inputQueue.length - 1]
    : state.direction;
  // вариант: разворот на 180° и повтор того же направления игнорируются
  if (isOpposite(newDir, last) || isSameCell(newDir, last)) return;
  if (state.inputQueue.length < 2) state.inputQueue.push(newDir);
}

function moveSnake() {
  if (state.inputQueue.length > 0) {
    state.direction = state.inputQueue.shift();
  }
  const head = state.snake[0];
  const newHead = { x: head.x + state.direction.x, y: head.y + state.direction.y };
  const ateApple = state.apple !== null && isSameCell(newHead, state.apple);

  // если яблока нет, хвост освободит клетку в этом же шаге — его не считаем
  const bodyToCheck = ateApple ? state.snake : state.snake.slice(0, -1);
  if (checkCollision(newHead, bodyToCheck)) {
    state.gameOver = true;
    return;
  }

  state.snake.unshift(newHead);
  if (ateApple) {
    state.score++;
    spawnApple();
  } else {
    state.snake.pop();
  }
}

function update() {
  moveSnake();
}

// ---------- Отрисовка (только чтение state) ----------
function drawCell(cell, color) {
  ctx.fillStyle = color;
  ctx.fillRect(cell.x * CELL_SIZE + 1, cell.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px Georgia, serif';
  ctx.fillText(state.won ? 'Победа!' : 'Игра окончена', canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Итоговый счёт: ' + state.score, canvas.width / 2, canvas.height / 2 + 5);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.apple) drawCell(state.apple, '#e4572e');
  state.snake.forEach((segment, i) => drawCell(segment, i === 0 ? '#a8e063' : '#5fae4e'));
  scoreEl.textContent = state.score;
  if (state.gameOver) drawGameOver();
}

// ---------- Игровой цикл ----------
function gameLoop(currentTime) {
  if (currentTime - lastMoveTime >= MOVE_INTERVAL) {
    update();
    lastMoveTime = currentTime;   // без «догоняния» — после паузы вкладки змейка не телепортируется
  }
  draw();

  if (state.gameOver) {
    rafId = null;
    restartBtn.hidden = false;
    restartBtn.focus();
    return;
  }
  rafId = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (rafId !== null) cancelAnimationFrame(rafId);  // защита от двух циклов сразу
  state = createInitialState();
  spawnApple();
  restartBtn.hidden = true;
  lastMoveTime = performance.now();
  draw();
  rafId = requestAnimationFrame(gameLoop);
}

// ---------- События ----------
document.addEventListener('keydown', (event) => {
  const dir = DIRECTIONS[event.key];
  if (!dir) return;
  event.preventDefault();          // чтобы стрелки не прокручивали страницу
  if (state && !state.gameOver) handleDirectionInput(dir);
});

restartBtn.addEventListener('click', startGame);

startGame();
