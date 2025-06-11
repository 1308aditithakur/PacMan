let fruit = null;
let level = 1;
let fruitTimer = 0;
const fruitDuration = 500;
const fruitInterval = 1000;
const powerPellets = new Set();
let powerMode = false;
let powerModeTimer = 0;
const powerModeDuration = 350;
let isFlashing = false;

let gameStarted = false;
let showStartScreen = true;

let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

let blueGhostImage;
let orangeGhostImage;
let pinkGhostImage;
let redGhostImage;
let scaredGhostImage;
let pacmanUpImage;
let pacmanDownImage;
let pacmanLeftImage;
let pacmanRightImage;
let wallImage;

const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    loadImages();
    loadMap();

    document.addEventListener("keyup", movePacman);
    draw();
};

function loadImages() {
    wallImage = new Image();
    wallImage.src = "./wall.png";

    blueGhostImage = new Image();
    blueGhostImage.src = "./blueGhost.png";
    orangeGhostImage = new Image();
    orangeGhostImage.src = "./orangeGhost.png";
    pinkGhostImage = new Image();
    pinkGhostImage.src = "./pinkGhost.png";
    redGhostImage = new Image();
    redGhostImage.src = "./redGhost.png";

    scaredGhostImage = new Image();
    scaredGhostImage.src = "./scaredGhost.png";

    pacmanUpImage = new Image();
    pacmanUpImage.src = "./pacmanUp.png";
    pacmanDownImage = new Image();
    pacmanDownImage.src = "./pacmanDown.png";
    pacmanLeftImage = new Image();
    pacmanLeftImage.src = "./pacmanLeft.png";
    pacmanRightImage = new Image();
    pacmanRightImage.src = "./pacmanRight.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();
    powerPellets.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const tile = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tile === 'X') {
                walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            } else if (tile === 'b') {
                ghosts.add(new Block(blueGhostImage, x, y, tileSize, tileSize));
            } else if (tile === 'o') {
                ghosts.add(new Block(orangeGhostImage, x, y, tileSize, tileSize));
            } else if (tile === 'p') {
                ghosts.add(new Block(pinkGhostImage, x, y, tileSize, tileSize));
            } else if (tile === 'r') {
                ghosts.add(new Block(redGhostImage, x, y, tileSize, tileSize));
            } else if (tile === 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (tile === ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4));
            }
        }
    }

    [[1,1], [1,17], [19,1], [19,17]].forEach(([r, c]) => {
        powerPellets.add(new Block(null, c * tileSize + 10, r * tileSize + 10, 12, 12));
    });
}

function update() {
    if (gameOver) return;

    move();
    draw();

    fruitTimer++;
    if (fruitTimer % fruitInterval === 0) {
        spawnFruit();
    }
    if (fruitTimer % (fruitInterval + fruitDuration) === 0) {
        fruit = null;
    }

    if (powerMode) {
        powerModeTimer++;
        if (powerModeTimer > powerModeDuration) {
            powerMode = false;
            for (let ghost of ghosts) {
                ghost.resetImage();
            }
        }
    }

    document.getElementById("score").innerText = "Score: " + score;
    document.getElementById("lives").innerText = "Lives: " + lives;
    document.getElementById("level").innerText = "Level: " + level;

    setTimeout(update, 50);
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    if (!isFlashing || Math.floor(fruitTimer / 10) % 2 === 0) {
        context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    }

    for (let ghost of ghosts) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }

    for (let wall of walls) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }

    context.fillStyle = "white";
    for (let food of foods) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    context.fillStyle = "yellow";
    for (let pellet of powerPellets) {
        context.beginPath();
        context.arc(pellet.x + 6, pellet.y + 6, 6, 0, 2 * Math.PI);
        context.fill();
    }

    if (fruit) {
        context.fillStyle = "red";
        context.beginPath();
        context.arc(fruit.x + 8, fruit.y + 8, 8, 0, 2 * Math.PI);
        context.fill();
    }

    if (gameOver) {
        document.getElementById("gameOverScreen").style.display = "flex";
    }
}

function move() {
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    for (let wall of walls) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts) {
        if (collision(pacman, ghost)) {
            if (powerMode) {
                score += 200;
                ghost.reset();
            } else {
                lives--;
                if (lives === 0) {
                    gameOver = true;
                    return;
                }
                flashPacman();
                resetPositions();
                return;
            }
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        for (let wall of walls) {
            if (collision(ghost, wall) || ghost.x < 0 || ghost.x + ghost.width > boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                const newDir = directions[Math.floor(Math.random() * 4)];
                ghost.updateDirection(newDir);
            }
        }
    }

    let foodEaten = null;
    for (let food of foods) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);

    let pelletEaten = null;
    for (let pellet of powerPellets) {
        if (collision(pacman, pellet)) {
            pelletEaten = pellet;
            powerMode = true;
            powerModeTimer = 0;
            for (let ghost of ghosts) {
                ghost.setScared();
            }
            break;
        }
    }
    powerPellets.delete(pelletEaten);

    if (fruit && collision(pacman, fruit)) {
        score += 100;
        fruit = null;
    }

    if (foods.size === 0) {
        level++;
        loadMap();
        resetPositions();
    }
}

function movePacman(e) {
    if (!gameStarted) {
        gameStarted = true;
        document.getElementById("startScreen").style.display = "none";
        for (let ghost of ghosts) {
            const dir = directions[Math.floor(Math.random() * 4)];
            ghost.updateDirection(dir);
        }
        update();
        return;
    }

    if (gameOver) return;

    if (e.code === "ArrowUp" || e.code === "KeyW") pacman.updateDirection('U');
    else if (e.code === "ArrowDown" || e.code === "KeyS") pacman.updateDirection('D');
    else if (e.code === "ArrowLeft" || e.code === "KeyA") pacman.updateDirection('L');
    else if (e.code === "ArrowRight" || e.code === "KeyD") pacman.updateDirection('R');

    pacman.image = {
        'U': pacmanUpImage,
        'D': pacmanDownImage,
        'L': pacmanLeftImage,
        'R': pacmanRightImage
    }[pacman.direction];
}

function flashPacman() {
    isFlashing = true;
    setTimeout(() => { isFlashing = false; }, 800);
}

function collision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts) {
        ghost.reset();
        const dir = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(dir);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        this.direction = direction;
        this.updateVelocity();
    }

    updateVelocity() {
        const v = tileSize / 4;
        this.velocityX = (this.direction === 'L') ? -v : (this.direction === 'R') ? v : 0;
        this.velocityY = (this.direction === 'U') ? -v : (this.direction === 'D') ? v : 0;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    setScared() {
        this.image = scaredGhostImage;
    }

    resetImage() {
        const x = this.startX;
        const y = this.startY;
        if (x === 8 * tileSize && y === 9 * tileSize) this.image = blueGhostImage;
        else if (x === 10 * tileSize && y === 9 * tileSize) this.image = orangeGhostImage;
        else if (x === 9 * tileSize && y === 9 * tileSize) this.image = pinkGhostImage;
        else this.image = redGhostImage;
    }
}

function spawnFruit() {
    const empty = [];
    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            if (tileMap[r][c] === ' ') {
                empty.push({ x: c * tileSize, y: r * tileSize });
            }
        }
    }
    if (empty.length > 0) {
        const spot = empty[Math.floor(Math.random() * empty.length)];
        fruit = new Block(null, spot.x + 8, spot.y + 8, 16, 16);
    }
}

function restartGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    fruit = null;
    fruitTimer = 0;
    powerMode = false;
    document.getElementById("gameOverScreen").style.display = "none";
    loadMap();
    resetPositions();
    update();
}
