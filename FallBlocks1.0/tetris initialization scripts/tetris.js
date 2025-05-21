const cvs = document.getElementById("tetris");
const ctx = cvs.getContext("2d");
const scoreElement = document.getElementById("scoreboard");
const timerElement = document.getElementById("timer");

const ROW = 20;
const COL = COLUMN = 10;
const SQ = squareSize = 32;
const VACANT = "black"; // color of an empty square

// draw a square
function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * SQ, y * SQ, SQ, SQ);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x * SQ, y * SQ, SQ, SQ);
}

// create the board
let board = [];
for (let r = 0; r < ROW; r++) {
    board[r] = [];
    for (let c = 0; c < COL; c++) {
        board[r][c] = VACANT;
    }
}

function drawBoard() {
    for (let r = 0; r < ROW; r++) {
        for (let c = 0; c < COL; c++) {
            drawSquare(c, r, board[r][c]);
        }
    }
}

// PIECES definition should be above randomPiece (assumed defined elsewhere: I, J, L, O, S, T, Z)
const PIECES = [
    [Z, "red"],
    [S, "green"],
    [T, "yellow"],
    [O, "blue"],
    [L, "purple"],
    [I, "cyan"],
    [J, "orange"]
];

function randomPiece() {
    let r = Math.floor(Math.random() * PIECES.length);
    return new Piece(PIECES[r][0], PIECES[r][1]);
}

let p;

function Piece(tetromino, color) {
    this.tetromino = tetromino;
    this.color = color;
    this.tetrominoN = 0;
    this.activeTetromino = this.tetromino[this.tetrominoN];
    this.x = 3;
    this.y = -2;
}

Piece.prototype.fill = function(color) {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (this.activeTetromino[r][c]) {
                drawSquare(this.x + c, this.y + r, color);
            }
        }
    }
}

Piece.prototype.draw = function() {
    this.fill(this.color);
}

Piece.prototype.unDraw = function() {
    this.fill(VACANT);
}

Piece.prototype.drawGhost = function() {
    const ghostColor = 'rgba(255, 255, 255, 0.2)';
    let ghostY = this.y;
    while (!this.collision(0, 1, this.activeTetromino, ghostY + 1)) {
        ghostY++;
    }
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (this.activeTetromino[r][c]) {
                drawSquare(this.x + c, ghostY + r, ghostColor);
            }
        }
    }
}

Piece.prototype.moveDown = function() {
    if (!this.collision(0, 1, this.activeTetromino)) {
        this.unDraw();
        this.y++;
        draw();
    } else {
        this.lock();
        if (!gameOver) {
            p = randomPiece();
        }
    }
}

Piece.prototype.moveRight = function() {
    if (!this.collision(1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x++;
        draw();
    }
}

Piece.prototype.moveLeft = function() {
    if (!this.collision(-1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x--;
        draw();
    }
}

Piece.prototype.rotate = function() {
    let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
    let kick = 0;
    if (this.collision(0, 0, nextPattern)) {
        kick = this.x > COL / 2 ? -1 : 1;
    }
    if (!this.collision(kick, 0, nextPattern)) {
        this.unDraw();
        this.x += kick;
        this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length;
        this.activeTetromino = nextPattern;
        draw();
    }
}

Piece.prototype.lock = function() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (!this.activeTetromino[r][c]) continue;
            if (this.y + r < 0) {
                gameOver = true;
                document.getElementById("gameOverScreen").style.display = "flex";
                document.getElementById("gameOverScoreboard").innerHTML = "Score: " + score;
                stopTimer();
                return;
            }
            board[this.y + r][this.x + c] = this.color;
        }
    }
    for (let r = 0; r < ROW; r++) {
        let isRowFull = true;
        for (let c = 0; c < COL; c++) {
            if (board[r][c] == VACANT) {
                isRowFull = false;
                break;
            }
        }
        if (isRowFull) {
            for (let y = r; y > 0; y--) {
                for (let c = 0; c < COL; c++) {
                    board[y][c] = board[y - 1][c];
                }
            }
            for (let c = 0; c < COL; c++) {
                board[0][c] = VACANT;
            }
            score += 10;
        }
    }
    drawBoard();
    scoreElement.innerHTML = score;
}

Piece.prototype.collision = function(x, y, piece, newY = this.y + y) {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece.length; c++) {
            if (!piece[r][c]) continue;
            let newX = this.x + c + x;
            let testY = newY + r;
            if (newX < 0 || newX >= COL || testY >= ROW) return true;
            if (testY < 0) continue;
            if (board[testY][newX] != VACANT) return true;
        }
    }
    return false;
}

document.addEventListener("keydown", CONTROL);

function CONTROL(event) {
    if (gameOver) return;
    if (event.keyCode == 37) p.moveLeft();
    else if (event.keyCode == 38) p.rotate();
    else if (event.keyCode == 39) p.moveRight();
    else if (event.keyCode == 40) p.moveDown();
    else if (event.keyCode == 32) {
        while (!p.collision(0, 1, p.activeTetromino)) {
            p.moveDown();
        }
        p.lock();
        if (!gameOver) {
            p = randomPiece();
        }
    }
}

let dropStart = Date.now();
let gameOver = false;
let score = 0;
let timerInterval;
let secondsElapsed = 0;
let hasStarted = false;

function drop() {
    let now = Date.now();
    let delta = now - dropStart;

    if (!hasStarted) {
        startTimer();
        hasStarted = true;
    }

    if (delta > 500) {
        if (!gameOver) {
            p.moveDown();
        } else {
            stopTimer();
        }
        dropStart = Date.now();
    }

    if (!gameOver) {
        requestAnimationFrame(drop);
    }
}

function draw() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    drawBoard();
    p.drawGhost();
    p.draw();
}

function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        timerElement.textContent = secondsElapsed;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    timerElement.textContent = "0";
}

function initGame() {
    score = 0;
    gameOver = false;
    scoreElement.innerHTML = score;

    board = [];
    for (let r = 0; r < ROW; r++) {
        board[r] = [];
        for (let c = 0; c < COL; c++) {
            board[r][c] = VACANT;
        }
    }

    drawBoard();
    p = randomPiece();
    drop();
}

function retryGame() {
    document.getElementById("gameOverScreen").style.display = "none";
    resetTimer();
    hasStarted = false;
    initGame();
}

document.addEventListener('keydown', function(event) {
    //prevent arrow keys from ruining the gameplay via scrollup
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }
});

document.addEventListener('keydown', function(event) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }
    });

initGame();