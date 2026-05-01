
// Configurações das dificuldades
const difficulties = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

// Variáveis de Estado
let currentDifficulty = 'easy';
let board = [];
let mines = [];
let flagsCount = 0;
let revealedCount = 0;
let gameOver = false;
let isFirstClick = true;
let timerInterval = null;
let secondsElapsed = 0;

// Elementos da DOM
const boardElement = document.getElementById('game-board');
const minesCountElement = document.getElementById('mines-count');
const timerElement = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');
const difficultySelect = document.getElementById('difficulty-select');
const modal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalBtn = document.getElementById('modal-btn');

// Cores para os números
const numberColors = [
    '', 'var(--c1)', 'var(--c2)', 'var(--c3)', 
    'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)'
];

// Event Listeners
resetBtn.addEventListener('click', initGame);
difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    initGame();
});
modalBtn.addEventListener('click', initGame);

// Prevenir menu de contexto no tabuleiro
boardElement.addEventListener('contextmenu', e => e.preventDefault());

function formatTime(seconds) {
    return seconds.toString().padStart(3, '0');
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (secondsElapsed > 999) secondsElapsed = 999;
        timerElement.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function initGame() {
    const config = difficulties[currentDifficulty];
    
    // Resetar variáveis
    board = [];
    mines = [];
    flagsCount = 0;
    revealedCount = 0;
    gameOver = false;
    isFirstClick = true;
    secondsElapsed = 0;
    
    stopTimer();
    timerElement.textContent = '000';
    minesCountElement.textContent = config.mines;
    modal.classList.add('hidden');

    // Configurar o grid CSS
    boardElement.style.gridTemplateColumns = `repeat(${config.cols}, 32px)`;
    boardElement.style.gridTemplateRows = `repeat(${config.rows}, 32px)`;
    boardElement.innerHTML = '';

    // Criar as células
    for (let r = 0; r < config.rows; r++) {
        const row = [];
        for (let c = 0; c < config.cols; c++) {
            const cellData = {
                r, c,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                element: document.createElement('div')
            };

            cellData.element.classList.add('cell');
            
            // Adicionar eventos de clique
            cellData.element.addEventListener('click', () => handleLeftClick(cellData));
            cellData.element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(cellData);
            });

            boardElement.appendChild(cellData.element);
            row.push(cellData);
        }
        board.push(row);
    }
}

function placeMines(firstClickCell) {
    const config = difficulties[currentDifficulty];
    let minesPlaced = 0;

    while (minesPlaced < config.mines) {
        const r = Math.floor(Math.random() * config.rows);
        const c = Math.floor(Math.random() * config.cols);
        const cell = board[r][c];

        // Evitar colocar mina no primeiro clique ou em locais com mina
        // Também evita os vizinhos imediatos do primeiro clique para uma abertura limpa
        const isSafeZone = Math.abs(r - firstClickCell.r) <= 1 && Math.abs(c - firstClickCell.c) <= 1;

        if (!cell.isMine && !isSafeZone) {
            cell.isMine = true;
            mines.push(cell);
            minesPlaced++;
        }
    }

    // Calcular números dos vizinhos
    for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
            if (!board[r][c].isMine) {
                board[r][c].neighborMines = countNeighborMines(r, c);
            }
        }
    }
}

function countNeighborMines(r, c) {
    const config = difficulties[currentDifficulty];
    let count = 0;
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                if (board[nr][nc].isMine) count++;
            }
        }
    }
    return count;
}

function handleLeftClick(cell) {
    if (gameOver || cell.isRevealed || cell.isFlagged) return;

    if (isFirstClick) {
        isFirstClick = false;
        placeMines(cell);
        startTimer();
    }

    if (cell.isMine) {
        endGame(false, cell);
    } else {
        revealCell(cell);
        checkWin();
    }
}

function handleRightClick(cell) {
    if (gameOver || cell.isRevealed) return;

    const config = difficulties[currentDifficulty];

    if (cell.isFlagged) {
        cell.isFlagged = false;
        cell.element.classList.remove('flagged');
        flagsCount--;
    } else {
        if (flagsCount < config.mines) {
            cell.isFlagged = true;
            cell.element.classList.add('flagged');
            flagsCount++;
        }
    }

    minesCountElement.textContent = config.mines - flagsCount;
}

function revealCell(cell) {
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    cell.element.classList.add('revealed');
    revealedCount++;

    if (cell.neighborMines > 0) {
        const span = document.createElement('span');
        span.textContent = cell.neighborMines;
        span.style.color = numberColors[cell.neighborMines];
        cell.element.appendChild(span);
    } else {
        // Flood fill para células com 0 minas vizinhas
        const config = difficulties[currentDifficulty];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = cell.r + dr;
                const nc = cell.c + dc;
                if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                    revealCell(board[nr][nc]);
                }
            }
        }
    }
}

function checkWin() {
    const config = difficulties[currentDifficulty];
    const safeCells = config.rows * config.cols - config.mines;
    
    if (revealedCount === safeCells) {
        endGame(true);
    }
}

function endGame(isWin, explodedCell = null) {
    gameOver = true;
    stopTimer();

    // Revelar todas as minas
    mines.forEach(mineCell => {
        if (!mineCell.isFlagged) {
            mineCell.element.classList.add('revealed', 'mine');
            mineCell.element.innerHTML = '<span>💣</span>';
        }
    });

    if (explodedCell) {
        explodedCell.element.style.background = 'var(--danger)';
        explodedCell.element.style.boxShadow = '0 0 20px var(--danger)';
        explodedCell.element.innerHTML = '<span>💥</span>';
    }

    // Mostrar minas erradas (bandeiras onde não havia mina)
    const config = difficulties[currentDifficulty];
    for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
            const cell = board[r][c];
            if (cell.isFlagged && !cell.isMine) {
                cell.element.classList.add('revealed');
                cell.element.classList.remove('flagged');
                cell.element.innerHTML = '<span>❌</span>';
            }
        }
    }

    // Configurar e mostrar modal
    setTimeout(() => {
        if (isWin) {
            modalTitle.textContent = "Vitória!";
            modalTitle.style.color = "var(--success)";
            modalMessage.textContent = `Você encontrou todas as minas em ${secondsElapsed} segundos!`;
        } else {
            modalTitle.textContent = "Game Over";
            modalTitle.style.color = "var(--danger)";
            modalMessage.textContent = "Você pisou em uma mina!";
        }
        modal.classList.remove('hidden');
    }, 1000); // Esperar um pouco antes de mostrar a mensagem
}

// Iniciar o jogo na primeira carga
window.onload = initGame;
Clicking...Pressing key...Stopping...

Stop Agent
