const colors = document.querySelectorAll('.color-btn');
const startBtn = document.getElementById('start-btn');
const levelDisplay = document.getElementById('level');
const messageDisplay = document.getElementById('message');

// Состояние игры хранится в переменных, а не считывается через CSS-классы
let sequence = [];
let playerInputIndex = 0;
let isAnimating = false; // Флаг «идёт показ / ждём ввода»
let gameActive = false;
let currentLevel = 0;

// Функция задержки с использованием Promise + setTimeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function playSequence() {
    isAnimating = true; // Блокировка ввода во время анимации
    messageDisplay.textContent = 'Смотрите и запоминайте...';
    await sleep(500); 

    // Последовательность подсвечивается по очереди с паузой между ними[cite: 2]
    for (let i = 0; i < sequence.length; i++) {
        // Проверка активности игры для корректного завершения таймеров при ошибке[cite: 2]
        if (!gameActive) return; 

        const colorIndex = sequence[i];
        const btn = document.querySelector(`[data-id="${colorIndex}"]`);
        
        btn.classList.add('active'); // Подсветка кнопки (добавление класса .active)[cite: 2]
        await sleep(500); // Подсветка на время ~500мс[cite: 2]
        
        btn.classList.remove('active');
        await sleep(300); // Пауза между элементами[cite: 2]
    }

    isAnimating = false; // Снятие блокировки[cite: 2]
    messageDisplay.textContent = 'Ваш ход! Повторите последовательность.';
    playerInputIndex = 0;
}

function nextRound() {
    currentLevel++;
    levelDisplay.textContent = `Уровень: ${currentLevel}`;
    
    // Добавляется один случайный элемент (0-3)[cite: 2]
    sequence.push(Math.floor(Math.random() * 4));
    
    // Последовательность показывается целиком с начала[cite: 2]
    playSequence();
}

function startGame() {
    // Сброс состояния перед новой игрой
    sequence = [];
    currentLevel = 0;
    gameActive = true;
    
    // По нажатию «Старт» начинается генерация последовательности[cite: 2]
    nextRound();
}

function handleColorClick(e) {
    // Клики блокируются/игнорируются, пока идёт показ последовательности компьютером[cite: 2]
    // Кнопки блокируются до повторного нажатия «Старт», если игра не активна[cite: 2]
    if (!gameActive || isAnimating) return;

    const clickedId = parseInt(e.target.dataset.id);
    
    // Подсветка при ручном нажатии
    e.target.classList.add('active');
    setTimeout(() => e.target.classList.remove('active'), 200);

    // Проверка правильности нажатия
    if (clickedId === sequence[playerInputIndex]) {
        playerInputIndex++;
        
        // Если игрок ввёл верную последовательность целиком[cite: 2]
        if (playerInputIndex === sequence.length) {
            messageDisplay.textContent = 'Верно! Готовим следующий раунд...';
            // Генерируется следующий раунд[cite: 2]
            setTimeout(nextRound, 1000); 
        }
    } else {
        // Если игрок ошибся на любом шаге[cite: 2]
        gameOver();
    }
}

function gameOver() {
    gameActive = false; // Завершение игры[cite: 2]
    // Выводится счёт достигнутого результата[cite: 2]
    messageDisplay.textContent = `Вы ошиблись! Вы дошли до уровня №${currentLevel}`;
    levelDisplay.textContent = "Игра окончена";
}

// Привязка событий
colors.forEach(btn => btn.addEventListener('click', handleColorClick));
startBtn.addEventListener('click', startGame);