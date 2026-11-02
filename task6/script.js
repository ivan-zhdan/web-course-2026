'use strict';

(function () {
  const CONFIG = Object.freeze({
    cellSize: 20,          // размер клетки, px
    gridSize: 20,          // поле 20x20 клеток (400x400 px)
    moveInterval: 150,     // мс между шагами змейки
    startLength: 3,
    colors: Object.freeze({
      apple: '#e4572e',
      head: '#a8e063',
      body: '#5fae4e'
    })
  });

  const DIRECTIONS = Object.freeze({
    ArrowUp:    Object.freeze({ x: 0,  y: -1 }),
    ArrowDown:  Object.freeze({ x: 0,  y: 1 }),
    ArrowLeft:  Object.freeze({ x: -1, y: 0 }),
    ArrowRight: Object.freeze({ x: 1,  y: 0 })
  });

  class GameModel {
    constructor(config, random = Math.random) {
      this.config = config;
      this.random = random;
      this.reset();
    }

    reset() {
      const middle = Math.floor(this.config.gridSize / 2);
      this.snake = [];
      for (let i = 0; i < this.config.startLength; i++) {
        this.snake.push({ x: middle - i, y: middle });   // [0] — голова
      }
      this.direction = DIRECTIONS.ArrowRight;
      this.inputQueue = [];
      this.apple = null;
      this.score = 0;
      this.gameOver = false;
      this.won = false;
      this.spawnApple();
    }

    static isSameCell(a, b) {
      return a.x === b.x && a.y === b.y;
    }

    static isOpposite(a, b) {
      return a.x + b.x === 0 && a.y + b.y === 0;
    }

    spawnApple() {
      const freeCells = [];
      for (let x = 0; x < this.config.gridSize; x++) {
        for (let y = 0; y < this.config.gridSize; y++) {
          const cell = { x, y };
          if (!this.snake.some(segment => GameModel.isSameCell(segment, cell))) {
            freeCells.push(cell);
          }
        }
      }
      if (freeCells.length === 0) {
        this.apple = null;
        this.won = true;
        this.gameOver = true;
        return;
      }
      this.apple = freeCells[Math.floor(this.random() * freeCells.length)];
    }

    checkCollision(head, body) {
      const size = this.config.gridSize;
      const hitWall = head.x < 0 || head.y < 0 || head.x >= size || head.y >= size;
      const hitSelf = body.some(segment => GameModel.isSameCell(segment, head));
      return hitWall || hitSelf;
    }

    // Разворот на 180° и повтор направления игнорируются
    setDirection(newDir) {
      if (this.gameOver) return;
      const last = this.inputQueue.length
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.direction;
      if (GameModel.isOpposite(newDir, last) || GameModel.isSameCell(newDir, last)) return;
      if (this.inputQueue.length < 2) this.inputQueue.push(newDir);
    }

    moveSnake() {
      if (this.inputQueue.length > 0) {
        this.direction = this.inputQueue.shift();
      }
      const head = this.snake[0];
      const newHead = { x: head.x + this.direction.x, y: head.y + this.direction.y };
      const ateApple = this.apple !== null && GameModel.isSameCell(newHead, this.apple);

      // если яблоко не съедено, хвост освобождает клетку в этом же шаге
      const bodyToCheck = ateApple ? this.snake : this.snake.slice(0, -1);
      if (this.checkCollision(newHead, bodyToCheck)) {
        this.gameOver = true;
        return;
      }

      this.snake.unshift(newHead);
      if (ateApple) {
        this.score++;
        this.spawnApple();
      } else {
        this.snake.pop();
      }
    }

    update() {
      if (!this.gameOver) this.moveSnake();
    }

    getState() {
      return {
        snake: this.snake.map(segment => ({ x: segment.x, y: segment.y })),
        apple: this.apple ? { x: this.apple.x, y: this.apple.y } : null,
        score: this.score,
        gameOver: this.gameOver,
        won: this.won
      };
    }
  }

  class GameView {
    constructor(config, canvas, scoreEl, restartBtn) {
      this.config = config;
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scoreEl = scoreEl;
      this.restartBtn = restartBtn;
    }

    drawCell(cell, color) {
      const size = this.config.cellSize;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(cell.x * size + 1, cell.y * size + 1, size - 2, size - 2);
    }

    drawGameOver(state) {
      const { ctx, canvas } = this;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.fillText(state.won ? 'Победа!' : 'Игра окончена', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = '22px Georgia, serif';
      ctx.fillText('Итоговый счёт: ' + state.score, canvas.width / 2, canvas.height / 2 + 5);
    }

    draw(state) {
      const { colors } = this.config;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (state.apple) this.drawCell(state.apple, colors.apple);
      state.snake.forEach((segment, i) => {
        this.drawCell(segment, i === 0 ? colors.head : colors.body);
      });
      this.scoreEl.textContent = state.score;
      if (state.gameOver) this.drawGameOver(state);
    }

    showRestartButton(visible) {
      this.restartBtn.hidden = !visible;
      if (visible) this.restartBtn.focus();
    }

    onRestart(handler) {
      this.restartBtn.addEventListener('click', handler);
    }
  }

  class GameController {
    constructor(model, view, config, keyMap) {
      this.model = model;
      this.view = view;
      this.config = config;
      this.keyMap = keyMap;
      this.lastMoveTime = 0;
      this.rafId = null;

      this.loop = this.loop.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    init() {
      document.addEventListener('keydown', this.handleKeyDown);
      this.view.onRestart(() => this.start());
      this.start();
    }

    start() {
      if (this.rafId !== null) cancelAnimationFrame(this.rafId);  
      this.model.reset();
      this.view.showRestartButton(false);
      this.lastMoveTime = performance.now();
      this.view.draw(this.model.getState());
      this.rafId = requestAnimationFrame(this.loop);
    }

    handleKeyDown(event) {
      const dir = this.keyMap[event.key];
      if (!dir) return;
      event.preventDefault();          
      this.model.setDirection(dir);
    }

    loop(currentTime) {
      if (currentTime - this.lastMoveTime >= this.config.moveInterval) {
        this.model.update();
        this.lastMoveTime = currentTime;
      }
      const state = this.model.getState();
      this.view.draw(state);

      if (state.gameOver) {
        this.rafId = null;
        this.view.showRestartButton(true);
        return;
      }
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  function main() {
    const model = new GameModel(CONFIG);
    const view = new GameView(
      CONFIG,
      document.getElementById('canvas'),
      document.getElementById('score'),
      document.getElementById('restart')
    );
    const controller = new GameController(model, view, CONFIG, DIRECTIONS);
    controller.init();
  }

  main();
})();