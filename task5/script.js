const colors = document.querySelectorAll('.color-btn');
const startBtn = document.getElementById('start-btn');
const levelDisplay = document.getElementById('level');
const messageDisplay = document.getElementById('message');

let sequence = [];
let playerInputIndex = 0;
let isAnimating = false;
let gameActive = false;
let currentLevel = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function playSequence() {
    isAnimating = true;
    messageDisplay.textContent = 'Смотрите и запоминайте...';
    await sleep(500); 

    for (let i = 0; i < sequence.length; i++) {
        if (!gameActive) return; 

        const colorIndex = sequence[i];
        const btn = document.querySelector(`[data-id="${colorIndex}"]`);
        
        btn.classList.add('active');
        await sleep(500);
        
        btn.classList.remove('active');
        await sleep(300);
    }

    isAnimating = false;
    messageDisplay.textContent = 'Ваш ход! Повторите последовательность.';
    playerInputIndex = 0;
}

function nextRound() {
    currentLevel++;
    levelDisplay.textContent = `Уровень: ${currentLevel}`;
    
    sequence.push(Math.floor(Math.random() * 4));
    
    playSequence();
}

function startGame() {
    sequence = [];
    currentLevel = 0;
    gameActive = true;
    
    nextRound();
}

function handleColorClick(e) {
    if (!gameActive || isAnimating) return;

    const clickedId = parseInt(e.target.dataset.id);
    
    e.target.classList.add('active');
    setTimeout(() => e.target.classList.remove('active'), 200);

    if (clickedId !== sequence[playerInputIndex]) {
        playerInputIndex++;
        
        if (playerInputIndex === sequence.length) {
            messageDisplay.textContent = 'Верно! Готовим следующий раунд...';
            setTimeout(nextRound, 1000); 
        }
    } else {
        gameOver();
    }
}

function gameOver() {
    gameActive = false;
    messageDisplay.textContent = `Вы ошиблись! Вы дошли до уровня №${currentLevel}`;
    levelDisplay.textContent = "Игра окончена";
}

// Привязка событий
colors.forEach(btn => btn.addEventListener('click', handleColorClick));
startBtn.addEventListener('click', startGame);