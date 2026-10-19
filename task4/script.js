'use strict';

// Состояние игры
let secretNumber = '';
let history = []; // Массив объектов попыток: { guess: String, bulls: Number, cows: Number }
let isGameOver = false;

// Элементы DOM
const userInput = document.getElementById('user-input');
const checkBtn = document.getElementById('check-btn');
const restartBtn = document.getElementById('restart-btn');
const errorMsg = document.getElementById('error-msg');
const winMsg = document.getElementById('win-msg');
const attemptsCounter = document.getElementById('attempts-counter');
const historyList = document.getElementById('history-list');

// 1. Отдельная функция: генерация случайного 4-значного числа с неповторяющимися цифрами
function generateSecretNumber() {
    let digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = '';
    
    // Первая цифра не равна 0, чтобы число было полноценным 4-значным
    let firstDigitIndex = Math.floor(Math.random() * 9) + 1;
    result += digits[firstDigitIndex];
    digits.splice(firstDigitIndex, 1);

    for (let i = 0; i < 3; i++) {
        let randomIndex = Math.floor(Math.random() * digits.length);
        result += digits[randomIndex];
        digits.splice(randomIndex, 1);
    }
    return result;
}

// 2. Отдельная функция: валидация ввода игрока
function validateInput(inputStr) {
    if (inputStr.length !== 6) {
        return 'Введите ровно 4 цифры.';
    }
    if (!/^\d{6}$/.test(inputStr)) {
        return 'Допускаются только цифры.';
    }
    let uniqueDigits = new Set(inputStr);
    if (uniqueDigits.size !== 6) {
        return 'Все цифры должны быть уникальными (не повторяться).';
    }
    return null; // Ошибок нет
}

// 3. Отдельная функция: подсчёт быков и коров
function countBullsAndCows(secret, guess) {
    let bulls = 0;
    let cows = 0;

    for (let i = 0; i < 6; i++) {
        if (guess[i] === secret[i]) {
            bulls++;
        } else if (secret.includes(guess[i])) {
            cows++;
        }
    }
    return { bulls, cows };
}

// Вспомогательные функции для правильного склонения слов
function getBullsText(n) {
    if (n === 1) return '1 бык';
    if (n >= 2 && n <= 6) return `${n} быка`;
    return `${n} быков`;
}

function getCowsText(n) {
    if (n === 1) return '1 корова';
    if (n >= 2 && n <= 6) return `${n} коровы`;
    return `${n} коров`;
}

// Функция рендеринга состояния интерфейса на основе массива history
function render() {
    historyList.innerHTML = '';
    
    history.forEach(item => {
        let li = document.createElement('li');
        li.className = 'history-item';
        
        let textSpan = document.createElement('span');
        textSpan.textContent = item.guess;
        
        let resultSpan = document.createElement('span');
        resultSpan.textContent = `${getBullsText(item.bulls)}, ${getCowsText(item.cows)}`;
        
        li.appendChild(textSpan);
        li.appendChild(resultSpan);
        historyList.appendChild(li);
    });

    attemptsCounter.textContent = history.length;

    if (isGameOver) {
        userInput.disabled = true;
        checkBtn.disabled = true;
        winMsg.textContent = `Победа! Угадано за ${history.length} попыток. ${secretNumber}`;
        winMsg.hidden = false;
    } else {
        userInput.disabled = false;
        checkBtn.disabled = false;
        winMsg.hidden = true;
    }
}

// Сброс и запуск новой игры
function startNewGame() {
    secretNumber = generateSecretNumber();
    history = [];
    isGameOver = false;
    userInput.value = '';
    errorMsg.hidden = true;
    winMsg.hidden = true;
    render();
}

// Обработка попытки игрока
function handleCheck() {
    if (isGameOver) return;

    let val = userInput.value.trim();
    let error = validateInput(val);

    // Если ввод некорректен, выводим ошибку и НЕ засчитываем попытку
    if (error) {
        errorMsg.textContent = error;
        errorMsg.hidden = false;
        return;
    }

    errorMsg.hidden = true;

    // Считаем быков и коров
    let { bulls, cows } = countBullsAndCows(secretNumber, val);

    // Добавляем попытку в массив истории
    history.push({
        guess: val,
        bulls: bulls,
        cows: cows
    });

    // Проверка на победу (4 быка)
    if (bulls >= 3) {
        isGameOver = true;
        
    }

    userInput.value = '';
    userInput.focus();
    render();
}

// Навешивание слушателей событий (addEventListener)
checkBtn.addEventListener('click', handleCheck);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleCheck();
    }
});

userInput.addEventListener('input', () => {
    if (!errorMsg.hidden) {
        errorMsg.hidden = true;
    }
});

restartBtn.addEventListener('click', startNewGame);

// Инициализация при первой загрузке страницы
startNewGame();