/**
 * Breakout
 * 
 * automatically loads on ready state
 */

var _gameArea = document.getElementById(`game`);
var _game = _gameArea.getContext("2d");

// start position an default move direction
var x = _gameArea.width / 2;
var y = _gameArea.height / 2;
var d = 8;
var dx = Math.floor(Math.random() * d) + -d;       // #INPUT_RANDOMNES
var dy = Math.floor(Math.random() * d) + -d;

// beginn on load?
var autostart = true;

// ticks per second
var tps = 100;

// ball radius
var ballRadius = 15;

// autoPlay & freezeGame
var autoPlay = false;
var freezeGame = false;

// paddle / player config
var paddleHeight = 25;
var paddleWidth = (paddleHeight * 10);
var paddleX = (_gameArea.width - paddleWidth) / 2;
var paddleY = (_gameArea.height - 50) - (paddleHeight / 2);
var paddleLineWidth = 4;

// controls
var right = [`D`, `Right`, `ArrowRight`];
var left = [`A`, `Left`, `ArrowLeft`];
var bot = [`F4`];
var freeze = [`F2`];
var speed_up = [`F8`, `+`];
var speed_down = [`F9`, `-`];
var playerMPT = 10;                          // MPT = moves per tick (default 7px)
var cLineHeight = 16;
var cCharWidth = 8;
var spStep = 2;

// bricks
var brickRowCount = 7;
var brickColumnCount = 9;
var brickHeight = 25;
var brickPadding = 10 + ballRadius / 2;
var brickOffsetTop = 50;
var brickOffsetLeft = 50;

// score tracking
var score = 0;

// CACHE
var __CACHE = {
    rightActive: false,                       // CACHE value 
    leftActive: false,                       // CACHE value
    botActive: false,                       // CACHE value
    freezeActive: false,                       // CACHE value
    freezeCompleted: false,
    gOver: false,
    gOverCompleted: false,
    spUpActive: false,
    spDownActive: false,
    spLastRaw: 0,
    spValue: () => (dx < 0 ? -dx : dx) > (dy < 0 ? -dy : dy) ? (dy < 0 ? -dy : dy) : (dx < 0 ? -dx : dx),
    gOverWin: false,
    gOverAnim: 0,
};

// EXPERIMENTAL
var EXPERIMENTAL = {
    randomBounce: {
        enabled: false,
        min: -4,
        max: 4
    },
    MPTreward: {
        enabled: false,
        multiplyer: 0.4
    }
};

//#region COLORS
var colors = {
    ball: '#FFFFFF',
    paddle: '#FFFFFF',
    paddleLine: '#FF0000',
    score: 'rgba(255,255,255,0.5)',
    fps: '#FFFFFF',
    controls: {
        base: 'rgba(255,255,255,0.5)',
        active: '#FFFF00',
        blocked: 'rgba(255,0,0,0.5)',
        st_base: 'rgba(0,0,0,0)',
        st_active: 'rgba(255,0,0,0.8)'
    },
    gameOver: {
        win: [
            '#00FF00',
            '#FFFFFF'
        ],
        lose: [
            '#FF0000',
            '#FFFFFF'
        ]
    },
    brick: [
        '#00FF00',
        '#FFFF00',
        '#FF6600',
        '#FF0000'
    ]
};
//#endregion

//#region FPS COUNTER & CACHE
var cache_fps = 0;
var cache_fps_shown = 0;
var startFPScounter = () => {
    if (window.fpsCounter) clearInterval(window.fpsCounter);
    window.fpsCounter = setInterval(() => {
        cache_fps_shown = cache_fps;
        cache_fps = 0;
    }, 1000);
};
var stopFPScounter = () => {
    clearInterval(window.fpsCounter);
};
//#endregion

//#region ticker
function startTicker() {
    if (window.gameticker) {
        clearInterval(window.gameticker);
    }
    window.gameticker = setInterval(draw, (1000 / tps));
    startFPScounter();
    console.log(`%c[Ticker]`, `color: lime;`, `Spiel-Ticker wurde gestartet.`);
}
function stopTicker() {
    if (window.gameticker) {
        clearInterval(window.gameticker);
        stopFPScounter();
        console.log(`%c[Ticker]`, `color: lime;`, `color: #808080;`, ``, `Spiel-Ticker wurde beendet.`);
    } else {
        console.log(`%c[Ticker]`, `color: lime;`, `Es wurde kein aktiver Spiel-Ticker gefunden.`);
    }
}
if (autostart) startTicker();
//#endregion

//#region AUTO RESIZE
$(window).on(`resize`, () => location.reload());
//#endregion

//#region KEY HANDLERS
document.addEventListener("keydown", (e) => {
    right.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.rightActive = true; });
    left.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.leftActive = true; });
    bot.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.botActive = true; });
    freeze.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.freezeActive = true; });
    speed_up.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.spUpActive = true; });
    speed_down.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.spDownActive = true; });
}, false);
document.addEventListener("keyup", (e) => {
    right.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.rightActive = false; });
    left.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.leftActive = false; });
    bot.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.botActive = false; });
    freeze.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.freezeActive = false; });
    speed_up.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.spUpActive = false; });
    speed_down.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) __CACHE.spDownActive = false; });
});
window.addEventListener("keydown", (e) => {
    bot.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) toggleDebug(); });
    freeze.forEach(key => { if (e.key.toUpperCase() === key.toUpperCase()) freezeGame = !freezeGame; });
    speed_up.forEach(key => {
        if (e.key.toUpperCase() === key.toUpperCase()) {
            if (dx < 0) dx -= ((dx - spStep) < 0) ? spStep : 0; else dx += ((dx + spStep) < 0) ? spStep : 0;
            if (dy < 0) dy -= ((dy - spStep) < 0) ? spStep : 0; else dy += ((dy + spStep) < 0) ? spStep : 0;
        }
    });
    speed_down.forEach(key => {
        if (e.key.toUpperCase() === key.toUpperCase()) {
            if (dx < 0) dx += ((dx + spStep) < 0) ? spStep : 0; else dx -= ((dx - spStep) < 0) ? spStep : 0;
            if (dy < 0) dy += ((dy + spStep) < 0) ? spStep : 0; else dy -= ((dy - spStep) < 0) ? spStep : 0;
        }
    });
});
//#endregion
//#region MOUSE HANDLERS
document.addEventListener("mousemove", (e) => {
    var relativeX = e.clientX - _gameArea.offsetLeft;
    if (relativeX > 0 && relativeX < _gameArea.width) {
        paddleX = relativeX - paddleWidth / 2;

        if (paddleX < 0) paddleX = 0;
        else if ((paddleX + paddleWidth) > _gameArea.width) paddleX = _gameArea.width - paddleWidth;
    }
}, false);
//#endregion

//#region PREPARE BRICKS
var bricks = [];
for (var c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (var r = 0; r < brickRowCount; r++) {
        var levels = Math.floor(brickRowCount / 4);
        var levelHealth = ((r <= levels) ? 4 : ((r <= (levels * 2)) ? 3 : ((r <= (levels * 3)) ? 2 : 1)));

        bricks[c][r] = { x: 0, y: 0, health: levelHealth };
    }
}
//#endregion

//#region DEBUG COMMANDS
var toggleDebug = () => autoPlay = !autoPlay;
var setTPS = (v) => {
    tps = v;
    var oldTicker = window.gameticker;
    window.gameticker = setInterval(draw, (1000 / tps));
    clearInterval(oldTicker);
};
//#endregion

//#region BRICKS
var brickWidth = ((_gameArea.width - (brickOffsetLeft * 2)) - (brickPadding * (brickColumnCount - 1))) / brickColumnCount;
function drawBricks() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            var brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;

            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;

            if (bricks[c][r].health > 0) {
                _game.beginPath();
                _game.rect(brickX, brickY, brickWidth, brickHeight);
                _game.fillStyle = colors.brick[bricks[c][r].health - 1];
                _game.fill();
                _game.closePath();
            }
        }
    }
}
var __MPTrewardAmount = playerMPT * EXPERIMENTAL.MPTreward.multiplyer;
function brickCollision() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var brick = bricks[c][r];

            if (((x + ballRadius > brick.x) && (x - ballRadius < (brick.x + brickWidth)) && (y + ballRadius > brick.y) && (y - ballRadius < (brick.y + brickHeight))) && (brick.health > 0)) {
                dy = -dy;
                dx = randCollide(dx);
                brick.health -= 1;
                if (brick.health <= 0) {
                    console.log(`%c[Brick]`, `color: yellow;`, `Brick destroyed at [${x}|${y}].`);
                    score++;
                    if (EXPERIMENTAL.MPTreward.enabled) playerMPT += __MPTrewardAmount;
                }
                else {
                    console.log(`%c[Brick]`, `color: yellow;`, `Brick collision detected at [${x}|${y}]. New health: ${brick.health}`);
                }
            }
        }
    }
}
//#endregion

//#region EXPERIMENTAL
function randCollide(v) {
    if (!EXPERIMENTAL.randomBounce.enabled) return v;
    return v + (Math.floor(Math.random() * EXPERIMENTAL.randomBounce.max) + EXPERIMENTAL.randomBounce.min);
}
//#endregion

function drawBall() {
    _game.beginPath();
    _game.arc(x, y, ballRadius, 0, Math.PI * 2);
    _game.fillStyle = colors.ball;
    _game.fill();
    _game.closePath();
}

function drawPaddle() {
    _game.beginPath();
    _game.rect(paddleX, paddleY, paddleWidth, paddleHeight);
    _game.fillStyle = colors.paddle;
    _game.fill();
    _game.closePath();
}

function drawPaddleLine() {
    _game.beginPath();
    _game.rect(0, (paddleY + ((paddleHeight / 2) - (paddleLineWidth / 2))), _gameArea.width, paddleLineWidth);
    _game.fillStyle = colors.paddleLine;
    _game.fill();
    _game.closePath();
}

function drawScore() {
    _game.font = `35px Arial`;
    _game.fillStyle = colors.score;
    _game.fillText(score, 0, (_gameArea.height - (paddleHeight + 40)));
}

function drawFPS() {
    _game.font = "16px Arial";
    _game.fillStyle = colors.fps;
    _game.fillText((cache_fps_shown) + " FPS", 4, 20);
}

function drawControls() {
    _game.font = `16px Consolas`;

    /**
     *      [F2] [F3] [F8] [F9]      *
     *                               *
     *    [W]     [F] [+]     [↑]    *
     * [A][S][D]  [B] [-]  [←][↓][→] *
     *                               *
     *      BOT   FREEZE   STOP      *
     */
    [
        { key: 'NONE', text: `${__CACHE.spValue()} MPT`, line: 7 },
        { key: 'SPEED_UP', text: `                  [F9]   `, line: 6 },
        { key: 'SPEED_DOWN', text: `             [F8]        `, line: 6 },
        { key: 'BOT', text: `        [F4]             `, line: 6 },
        { key: 'FREEZE', text: `   [F2]                  `, line: 6 },
        { key: 'NONE', text: `                         `, line: 5 },
        { key: 'UP', text: `   [W]             [↑]   `, line: 4 },
        { key: 'LEFT', text: `[A]             [←]      `, line: 3 },
        { key: 'RIGHT', text: `      [D]             [→]`, line: 3 },
        { key: 'DOWN', text: `   [S]             [↓]   `, line: 3 },
        { key: 'NONE', text: `                         `, line: 2 },
        { key: 'ST_BOT', text: `   BOT                   `, line: 1 },
        { key: 'ST_FREEZE', text: `         FREEZE          `, line: 1 },
        { key: 'ST_STOP', text: `                  STOP   `, line: 1 }
    ].forEach((ks, i) => {
        _game.fillStyle = colors.controls.base;

        // CONTROLS
        if ((ks.key === 'UP') && false) _game.fillStyle = colors.controls.active;
        if ((ks.key === 'LEFT') && __CACHE.leftActive) _game.fillStyle = colors.controls.active;
        if ((ks.key === 'RIGHT') && __CACHE.rightActive) _game.fillStyle = colors.controls.active;
        if ((ks.key === 'DOWN') && false) _game.fillStyle = colors.controls.active;

        // BOT & ACTION KEYS
        if ((ks.key === 'BOT') && __CACHE.botActive) _game.fillStyle = colors.controls.active;
        if ((ks.key === 'FREEZE') && __CACHE.freezeActive) _game.fillStyle = colors.controls.active;

        // STATUS LINE
        if (ks.key.substring(0, 2) === 'ST') _game.fillStyle = colors.controls.st_base;
        if ((ks.key === 'ST_BOT') && autoPlay) _game.fillStyle = colors.controls.st_active;
        if ((ks.key === 'ST_FREEZE') && freezeGame) _game.fillStyle = colors.controls.st_active;
        if ((ks.key === 'ST_STOP') && __CACHE.gOver) _game.fillStyle = colors.controls.st_active;

        // BLOCKED KEYS
        if ((ks.key === 'LEFT') && autoPlay) _game.fillStyle = colors.controls.blocked;
        if ((ks.key === 'RIGHT') && autoPlay) _game.fillStyle = colors.controls.blocked;

        _game.fillText(
            ks.text,
            (_gameArea.width / 2 - (ks.text.length / 2 * cCharWidth)),
            (_gameArea.height - (paddleHeight + 40 + (cLineHeight * ks.line)))
        );

    })
}

function drawGameOver() {
    _game.font = `24px Consolas`;

    var w = Math.floor(__CACHE.gOverAnim / colors.gameOver.win.length) - 1;
    var l = Math.floor(__CACHE.gOverAnim / colors.gameOver.lose.length) - 1;

    if (__CACHE.gOverWin) {
        var msg = `YOU WIN`;
        _game.fillStyle = colors.gameOver.win[w];
    } else {
        var msg = `YOU LOSE`;
        _game.fillStyle = colors.gameOver.lose[l];
    }

    if (__CACHE.gOverAnim < (1000 * tps)) __CACHE.gOverAnim++;
    else __CACHE.gOverAnim = 0;

    _game.fillText(
        msg,
        (_gameArea.width / 2) - (msg.length * 12) / 2,
        (_gameArea.height / 2) - 12
    );
}

function draw() {
    // Skip frame => Game Freeze
    if (freezeGame) {
        if (__CACHE.freezeCompleted) return;
        __CACHE.freezeCompleted = true;
    } else __CACHE.freezeCompleted = false;

    // Game Over => Stop Game
    if (__CACHE.gOver) {
        if (__CACHE.gOverCompleted) {
            dx = 0;
            dy = 0;
            paddleX = (window.innerWidth / 2) - (paddleWidth / 2);
        };
        __CACHE.gOverCompleted = true;
    } else __CACHE.gOverCompleted = false;

    // Clear current frame
    _game.clearRect(0, 0, _gameArea.width, _gameArea.height);

    // DEBUG: Bot Script
    if (autoPlay) {
        paddleX = x - (paddleWidth / 2);
        if (paddleX < 0) paddleX = 0;
        else if ((paddleX + paddleWidth) > _gameArea.width) paddleX = _gameArea.width - paddleWidth;
    }

    //#region GAME COMPLETE CHECK
    if (score >= (brickColumnCount * brickRowCount)) {
        __CACHE.gOver = true;
        __CACHE.gOverWin = true;
    }
    //#endregion

    //#region frames
    drawScore();
    drawControls();
    drawPaddleLine();
    brickCollision();
    drawBall();
    drawBricks();
    drawPaddle();
    drawFPS();
    if (__CACHE.gOver) drawGameOver();
    //#endregion

    //#region collission checks
    if (x + dx > _gameArea.width - ballRadius || x + dx < ballRadius) { dx = -dx; dy = randCollide(dy); }   // left & right
    if (y + dy < ballRadius) { dy = -dy; dx = randCollide(dx); }   // up
    if (y + dy > _gameArea.height + ballRadius) __CACHE.gOver = true;
    if ((y + dy > paddleY) && (x > paddleX + ballRadius && x < paddleX + (paddleWidth - ballRadius))) { dy = -dy; dx = randCollide(dx); }   // paddle collision
    //#endregion

    //#region paddle movement
    if (__CACHE.rightActive) {
        paddleX += playerMPT;
        if ((paddleX + playerMPT) > (_gameArea.width - paddleWidth)) {
            paddleX = _gameArea.width - paddleWidth;
        }
    }
    else if (__CACHE.leftActive) {
        paddleX -= playerMPT;

        if (paddleX < 0) {
            paddleX = 0;
        }
    }
    //#endregion

    x += dx;
    y += dy;

    cache_fps++;    // FPS CHECK
}