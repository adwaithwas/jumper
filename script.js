// 2.5D Rendering Helpers
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  
    
    R = (R>0)?R:0;
    G = (G>0)?G:0;
    B = (B>0)?B:0;

    let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

function draw3DBlock(ctx, x, y, width, height, color, depthX = 12, depthY = 12) {
    
    // Right face (darker)
    ctx.fillStyle = shadeColor(color, -20); 
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width + depthX, y - depthY);
    ctx.lineTo(x + width + depthX, y - depthY + height);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    
    // Top face (lighter)
    ctx.fillStyle = shadeColor(color, 20);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + depthX, y - depthY);
    ctx.lineTo(x + width + depthX, y - depthY);
    ctx.lineTo(x + width, y);
    ctx.closePath();
    ctx.fill();
    
    // Front face (Standard)
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const finalScoreEl = document.getElementById('final-score');
const highScoreEl = document.getElementById('high-score');
const finalHighScoreEl = document.getElementById('final-high-score');
const gameContainer = document.getElementById('game-container');
const startMenu = document.getElementById('start-menu');
const startBtn = document.getElementById('start-btn');
const menuHighScoreEl = document.getElementById('menu-high-score');
const coinsEl = document.getElementById('coins');
const finalCoinsEl = document.getElementById('final-coins');

// Swiss Design Palettes: [Background, Platform/Text, Player/Accent]
const palettes = [
    { bg: '#F4F4F0', plat: '#111111', player: '#E03C31' }, // Level 1: White, Black, Red
    { bg: '#E03C31', plat: '#F4F4F0', player: '#111111' }, // Level 2: Red, White, Black
    { bg: '#005BBB', plat: '#111111', player: '#F4F4F0' }, // Level 3: Blue, Black, White
    { bg: '#FFD100', plat: '#111111', player: '#E03C31' }, // Level 4: Yellow, Black, Red
    { bg: '#111111', plat: '#F4F4F0', player: '#005BBB' }  // Level 5: Black, White, Blue
];

let currentLevel = 0;
let score = 0;
let highScore = localStorage.getItem('jumperHighScore') || 0;
let totalCoins = 0;
let maxAltitude = 0;
let isMoonDimension = false;
let moonTimer = 0;
const MOON_DURATION = 60 * 15; // 15 seconds
let isGameOver = false;
let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
let cameraY = 0;

// Physics & Gameplay Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const SUPER_JUMP_FORCE = -24; // Powerup jump
const ACCELERATION = 1.5;
const FRICTION = 0.82; // Smoother sliding/stopping
const MAX_SPEED = 10;
const LEVEL_UP_SCORE = 1500;

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

class Player {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 100;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.jetpackTimer = 0;
    }

    update() {
        // Smooth Horizontal Movement (Acceleration & Friction)
        if (keys.ArrowLeft) {
            this.vx -= ACCELERATION;
        }
        if (keys.ArrowRight) {
            this.vx += ACCELERATION;
        }

        // Apply friction to smoothly slow down
        this.vx *= FRICTION;

        // Cap maximum speed
        if (this.vx > MAX_SPEED) this.vx = MAX_SPEED;
        if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED;

        // Jetpack or Gravity
        if (this.jetpackTimer > 0) {
            this.jetpackTimer--;
            this.vy = -12; // Sustained upward thrust
            this.isGrounded = false;
        } else {
            // Apply gravity
            let currentGravity = isMoonDimension ? 0.15 : GRAVITY;
            let currentJump = isMoonDimension ? -11 : JUMP_FORCE;
            
            this.vy += currentGravity;
            
            // Manual jumping (Mario-style)
            if (keys.Space && this.isGrounded) { 
                this.vy = currentJump;
                this.isGrounded = false;
            }
        }

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Screen wrap horizontally
        if (this.x > canvas.width) this.x = -this.width;
        if (this.x + this.width < 0) this.x = canvas.width;

        // Reset grounded state for next frame collision check
        this.isGrounded = false;
    }

    draw(ctx, color) {
        // Draw 3D shadow/trail (simple 2d offset shadow for effect)
        ctx.fillStyle = color + '66';
        ctx.fillRect(this.x - this.vx * 1.5, this.y - cameraY - this.vy * 0.5, this.width, this.height);
        
        // Draw 3D player body
        draw3DBlock(ctx, this.x, this.y - cameraY, this.width, this.height, color);

        // Draw jetpack flames if active
        if (this.jetpackTimer > 0) {
            ctx.fillStyle = '#FFA500'; // Orange fire
            const flameHeight = Math.random() * 15 + 10;
            // Left nozzle
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y - cameraY + this.height);
            ctx.lineTo(this.x + 10, this.y - cameraY + this.height + flameHeight);
            ctx.lineTo(this.x + 15, this.y - cameraY + this.height);
            ctx.fill();
            // Right nozzle
            ctx.beginPath();
            ctx.moveTo(this.x + 15, this.y - cameraY + this.height);
            ctx.lineTo(this.x + 20, this.y - cameraY + this.height + flameHeight);
            ctx.lineTo(this.x + 25, this.y - cameraY + this.height);
            ctx.fill();

            // Draw jetpack fuel bar
            const maxTimer = 300;
            const barWidth = 40;
            const barHeight = 4;
            const barX = this.x + (this.width / 2) - (barWidth / 2);
            const barY = this.y - cameraY - 15;
            
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const fillWidth = (this.jetpackTimer / maxTimer) * barWidth;
            ctx.fillStyle = '#FFA500'; 
            ctx.fillRect(barX, barY, fillWidth, barHeight);
        }
    }
}


class Coin {
    constructor(x, y) {
        this.x = x - 7; // Center it better
        this.y = y;
        this.width = 14;
        this.height = 14;
        this.collected = false;
        this.animOffset = Math.random() * Math.PI * 2;
    }

    draw(ctx) {
        if (this.collected) return;
        
        // Floating animation
        const floatY = Math.sin(Date.now() / 150 + this.animOffset) * 5;

        // Draw a distinct chunky 3D golden cube
        draw3DBlock(ctx, this.x, this.y - cameraY + floatY, this.width, this.height, '#FFD700', this.width, this.height);
    }
}

class Powerup {
    constructor(x, y) {
        this.x = x + 15; // Center slightly on platform
        this.y = y - 20; // Float above platform
        this.width = 15;
        this.height = 15;
        this.collected = false;
        this.animOffset = Math.random() * Math.PI * 2;
        const rand = Math.random();
        if (rand < 0.05) {
            this.type = 'PORTAL'; // 5% chance
        } else if (rand < 0.15) {
            this.type = 'JETPACK'; // 10% chance
        } else {
            this.type = 'SUPER_JUMP'; // 85% chance
        }
    }

    draw(ctx, color) {
        if (this.collected) return;
        
        // Bobbing animation
        const floatY = Math.sin(Date.now() / 150 + this.animOffset) * 5;

        ctx.fillStyle = color;
        
        if (this.type === 'SUPER_JUMP') {
            // Draw a small triangle
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - cameraY + floatY);
            ctx.lineTo(this.x + this.width, this.y - cameraY + floatY);
            ctx.lineTo(this.x + this.width / 2, this.y - cameraY - this.height + floatY);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'JETPACK') {
            // Draw jetpack icon
            ctx.fillRect(this.x, this.y - cameraY + floatY - this.height, 6, this.height);
            ctx.fillRect(this.x + 9, this.y - cameraY + floatY - this.height, 6, this.height);
            ctx.fillStyle = '#FFA500'; // Orange fire detail
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - cameraY + floatY);
            ctx.lineTo(this.x + 3, this.y - cameraY + floatY + 5);
            ctx.lineTo(this.x + 6, this.y - cameraY + floatY);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + 9, this.y - cameraY + floatY);
            ctx.lineTo(this.x + 12, this.y - cameraY + floatY + 5);
            ctx.lineTo(this.x + 15, this.y - cameraY + floatY);
            ctx.fill();
        } else if (this.type === 'PORTAL') {
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y - cameraY + floatY - this.height/2, this.width, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y - cameraY + floatY - this.height/2, this.width - 4, 0, Math.PI * 2);
            ctx.stroke();
            // Draw a tiny star inside
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x + this.width/2 - 1, this.y - cameraY + floatY - this.height/2 - 1, 2, 2);
        }
    }
}

class Platform {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 15;
        this.powerup = null;

        // Moving platform properties (25% chance, only appears after score reaches 1000)
        this.isMoving = score > 1000 && Math.random() < 0.25;
        this.vx = this.isMoving ? (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1) : 0;

        // 15% chance to spawn a powerup on this platform
        if (Math.random() < 0.15) {
            // Position powerup somewhere on the platform
            const px = this.x + Math.random() * (this.width - 30);
            this.powerup = new Powerup(px, this.y);
        }
        
        this.coin = null;
        // 35% chance to spawn a coin if there is no powerup
        if (!this.powerup && Math.random() < 0.35) {
            const cx = this.x + Math.random() * (this.width - 20) + 10;
            this.coin = new Coin(cx, this.y - 15);
        }
    }

    update() {
        if (this.isMoving) {
            this.x += this.vx;
            // Bounce off edges
            if (this.x <= 0) {
                this.x = 0;
                this.vx *= -1;
            } else if (this.x + this.width >= canvas.width) {
                this.x = canvas.width - this.width;
                this.vx *= -1;
            }

            // Sync powerup position
            if (this.powerup) {
                this.powerup.x += this.vx;
            }
            if (this.coin) {
                this.coin.x += this.vx;
            }
        }
    }

    draw(ctx, color, playerColor) {
        draw3DBlock(ctx, this.x, this.y - cameraY, this.width, this.height, color);

        if (this.powerup) {
            // Give powerup a slight 3D depth position by moving it into the background layer a bit
            // The depth is 12x12. Let's push the powerup 6px right and 6px up
            let originalX = this.powerup.x;
            let originalY = this.powerup.y;
            this.powerup.x += 6;
            this.powerup.y -= 6;
            
            this.powerup.draw(ctx, playerColor); // Powerup uses player color
            
            this.powerup.x = originalX;
            this.powerup.y = originalY;
        }

        if (this.coin) {
            let originalX = this.coin.x;
            let originalY = this.coin.y;
            this.coin.x += 6;
            this.coin.y -= 6;
            
            this.coin.draw(ctx);
            
            this.coin.x = originalX;
            this.coin.y = originalY;
        }
    }
}

let player;
let platforms = [];


function initMenu() {
    gameState = 'MENU';
    startMenu.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    menuHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
    
    platforms = [];
    cameraY = 0;
    currentLevel = 0;
    updateUI();
    
    // Generate initial platforms for background
    const floor = new Platform(0, canvas.height - 20, canvas.width);
    floor.powerup = null;
    floor.isMoving = false;
    floor.vx = 0;
    platforms.push(floor);
    generatePlatforms(canvas.height - 120);
    
    if (!lastTime) {
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function initGame() {
    gameState = 'PLAYING';
    startMenu.classList.add('hidden');
    player = new Player();
    platforms = [];
    currentLevel = 0;
    score = 0;
    totalCoins = 0;
    maxAltitude = 0;
    highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
    coinsEl.innerText = totalCoins;
    cameraY = 0;
    isGameOver = false;
    isMoonDimension = false;
    moonTimer = 0;
    gameContainer.classList.remove('moon-style');
    
    gameOverScreen.classList.add('hidden');
    
    // Initial floor to stand on (no powerup on floor)
    const floor = new Platform(0, canvas.height - 20, canvas.width);
    floor.powerup = null;
    floor.isMoving = false; // Never move the floor
    floor.vx = 0;
    platforms.push(floor);
    
    // Generate initial upward platforms
    generatePlatforms(canvas.height - 120);
    
    updateUI();
    lastTime = performance.now();
    accumulator = 0;
    requestAnimationFrame(gameLoop);
}

function generatePlatforms(startY) {
    let y = startY;
    // Generate platforms up to a bit beyond the current top of the screen
    while (y > cameraY - canvas.height) {
        // Platforms start wider (80-160) and gradually get smaller as levels increase (min 55-90)
        let minWidth = Math.max(55, 80 - (currentLevel * 4));
        let maxWidth = Math.max(90, 160 - (currentLevel * 6));
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const x = Math.random() * (canvas.width - width);
        platforms.push(new Platform(x, y, width));
        
        // As you get higher, platforms get slightly further apart
        const gap = Math.min(180, 70 + Math.random() * 60 + (currentLevel * 10));
        y -= gap;
    }
}

function checkCollisions() {
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        
        // land on platform (only when falling)
        if (player.vy > 0) {
            if (player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y + player.height >= p.y &&
                player.y + player.height <= p.y + player.vy + 2) { 
                
                player.y = p.y - player.height;
                player.vy = 0;
                player.isGrounded = true;

                // Ride the moving platform
                if (p.isMoving) {
                    player.x += p.vx;
                }
            }
        }

        // Coin Collision
        if (p.coin && !p.coin.collected) {
            let c = p.coin;
            if (player.x < c.x + c.width &&
                player.x + player.width > c.x &&
                player.y < c.y + c.height &&
                player.y + player.height > c.y) {
                
                c.collected = true;
                totalCoins++;
                coinsEl.innerText = totalCoins;
            }
        }

        // Powerup Collision (Can happen anytime)
        if (p.powerup && !p.powerup.collected) {
            let pu = p.powerup;
            if (player.x < pu.x + pu.width &&
                player.x + player.width > pu.x &&
                player.y < pu.y + pu.height &&
                player.y + player.height > pu.y - pu.height) { // Adjusted for triangle height
                
                pu.collected = true;
                if (pu.type === 'SUPER_JUMP') {
                    player.vy = isMoonDimension ? -16 : SUPER_JUMP_FORCE; // Instant boost!
                } else if (pu.type === 'JETPACK') {
                    player.jetpackTimer = 300; // 5 seconds at 60fps
                } else if (pu.type === 'PORTAL') {
                    player.vy = isMoonDimension ? -16 : SUPER_JUMP_FORCE; // boost into portal
                    isMoonDimension = true;
                    moonTimer = MOON_DURATION;
                    gameContainer.classList.add('moon-style');
                }
                player.isGrounded = false;
            }
        }
    }
}

function updateCameraAndLevel() {
    // Camera follows player smoothly when they go above middle of screen
    const targetCameraY = player.y - canvas.height / 2;
    if (targetCameraY < cameraY) {
        // Smooth camera follow
        cameraY += (targetCameraY - cameraY) * 0.15; 
    }
    
    // Altitude-based scoring
    const currentAltitude = Math.floor(Math.abs(cameraY));
    if (currentAltitude > maxAltitude) {
        maxAltitude = currentAltitude;
        score = maxAltitude;
        
        // Keep generating platforms upwards
        const topPlatform = platforms[platforms.length - 1];
        if (topPlatform.y > cameraY - canvas.height) {
            generatePlatforms(topPlatform.y - 100);
        }
        
        // Level up dynamically
        const newLevel = Math.floor(score / LEVEL_UP_SCORE);
        if (newLevel !== currentLevel) {
            // Cycle through palettes infinitely
            currentLevel = newLevel % palettes.length;
            updateUI();
        }
    }
    
    // Clean up memory: remove platforms off the bottom
    platforms = platforms.filter(p => p.y < cameraY + canvas.height + 100);
    
    // Game Over or Moon Bounce if you fall off the bottom of the camera view
    if (player.y > cameraY + canvas.height) {
        if (isMoonDimension) {
            // Save the player! Spit them back out into normal mode
            isMoonDimension = false;
            moonTimer = 0;
            gameContainer.classList.remove('moon-style');
            player.vy = -28; // Massive upward boost
        } else {
            if (gameState === 'PLAYING') {
                // Add coin bonus to final score
                score += (totalCoins * 100);
            }
            gameState = 'GAMEOVER'; isGameOver = true;
        }
    }
}

function updateUI() {
    scoreEl.innerText = score;
    levelEl.innerText = `LEVEL ${Math.floor(score / LEVEL_UP_SCORE) + 1}`;
    if (score > highScore) highScoreEl.innerText = `HIGH SCORE: ${score}`;
    
    // Apply Swiss color transitions
    const palette = palettes[currentLevel];
    document.body.style.backgroundColor = palette.bg;
    gameContainer.style.backgroundColor = palette.bg;
    
    scoreEl.style.color = palette.plat;
    levelEl.style.color = palette.player;
    
    // Game over screen styling
    gameOverScreen.style.backgroundColor = `${palette.bg}f2`; // adding alpha
    gameOverScreen.style.color = palette.plat;
    restartBtn.style.backgroundColor = palette.plat;
    restartBtn.style.color = palette.bg;

    // Mobile controls dynamic styling
    document.documentElement.style.setProperty('--btn-color', palette.plat);
    document.documentElement.style.setProperty('--btn-bg-active', palette.plat);
    document.documentElement.style.setProperty('--btn-text-active', palette.bg);
}

let lastTime = 0;
let accumulator = 0;
const frameDuration = 1000 / 60; // Target 60 FPS for logic

function gameLoop(timestamp) {
    if (gameState === 'MENU') {
        let deltaTime = timestamp - lastTime;
        if (deltaTime > 250) deltaTime = 250;
        lastTime = timestamp;

        // Auto pan camera upwards
        cameraY -= 2;

        // Generate platforms infinitely
        const topPlatform = platforms[platforms.length - 1];
        if (topPlatform && topPlatform.y > cameraY - canvas.height) {
            generatePlatforms(topPlatform.y - 100);
        }
        
        // Remove old platforms
        platforms = platforms.filter(p => p.y < cameraY + canvas.height + 100);

        // Update platforms (for animations/coins)
        platforms.forEach(p => p.update());

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        
        const palette = palettes[currentLevel];
        platforms.forEach(p => p.draw(ctx, palette.plat));

        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'GAMEOVER') {
        gameOverScreen.classList.remove('hidden');
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('jumperHighScore', highScore);
        }
        finalScoreEl.innerText = `SCORE: ${score}`;
        finalHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
        finalCoinsEl.innerText = totalCoins;
        return;
    }

    let deltaTime = timestamp - lastTime;
    // Cap deltaTime to avoid spiral of death if tab was inactive
    if (deltaTime > 250) deltaTime = 250;
    lastTime = timestamp;

    accumulator += deltaTime;

    // Moon dimension timer
    if (isMoonDimension && gameState === 'PLAYING') {
        moonTimer--;
        if (moonTimer <= 0) {
            isMoonDimension = false;
            gameContainer.classList.remove('moon-style');
        }
    }

    // Fixed time step update for logic
    while (accumulator >= frameDuration) {
        player.update();
        platforms.forEach(p => p.update());
        checkCollisions();
        updateCameraAndLevel();
        accumulator -= frameDuration;
    }
    
    // Smooth UI updates
    scoreEl.innerText = score;

    // Render
    const palette = palettes[currentLevel];
    
    // Clear canvas so the container's CSS background shows through
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stationary background grid
    ctx.strokeStyle = palette.plat + '1A'; // 10% opacity so it's visible on all colors
    ctx.lineWidth = 1;
    const gridSpacing = 80; // Wider spacing is smoother on the eyes
    
    ctx.beginPath();
    // Vertical lines stay completely static
    for(let i = 0; i <= canvas.width; i+= gridSpacing) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }
    // Horizontal lines stay completely static
    for(let i = 0; i <= canvas.height; i+= gridSpacing) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
    }
    ctx.stroke();

    // Draw platforms and their powerups
    platforms.forEach(p => {
        p.draw(ctx, palette.plat, palette.player);
    });

    // Draw player
    player.draw(ctx, palette.player);

    requestAnimationFrame(gameLoop);
}

let secretCode = ['KeyD', 'KeyR', 'KeyA', 'KeyW'];
let secretIndex = 0;


function buyJetpack() {
    if (gameState === 'PLAYING' && totalCoins >= 20 && player.jetpackTimer <= 0) {
        totalCoins -= 20;
        coinsEl.innerText = totalCoins;
        player.jetpackTimer = 300; // 5 seconds of jetpack
    }
}

// Input Handling
window.addEventListener('keydown', (e) => {
    // Only register input if it's the expected keys to prevent interference
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        // Start game from menu
        if (gameState === 'MENU') {
            initGame();
            return;
        }
        // Prevent default spacebar scrolling down
        if (!keys.Space) { // only trigger once per press
            keys.Space = true;
        }
        if (e.code === 'Space' || e.code === 'ArrowUp') e.preventDefault();
    }

    // Restart on Enter if game is over
    if (e.code === 'Enter' && isGameOver) {
        initGame();
    }
    
    // Buy Jetpack on 'B'
    if (e.code === 'KeyB') {
        buyJetpack();
    }

    // Easter Egg: Type "DRAW"
    if (e.code === secretCode[secretIndex]) {
        secretIndex++;
        if (secretIndex === secretCode.length) {
            gameContainer.classList.toggle('drawn-style');
            secretIndex = 0;
        }
    } else {
        secretIndex = 0;
        if (e.code === secretCode[0]) {
            secretIndex = 1;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.Space = false;
});

// Mobile Touch Controls
function setupMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');

    const addControl = (btn, keyStr) => {
        if (!btn) return;
        const press = (e) => {
            e.preventDefault();
            if (keyStr === 'Space' && !keys.Space) keys.Space = true;
            else if (keyStr !== 'Space') keys[keyStr] = true;
            btn.classList.add('active');
        };
        const release = (e) => {
            e.preventDefault();
            keys[keyStr] = false;
            btn.classList.remove('active');
        };
        
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('touchstart', press, {passive: false});
        btn.addEventListener('touchend', release, {passive: false});
        btn.addEventListener('touchcancel', release, {passive: false});
    };

    addControl(btnLeft, 'ArrowLeft');
    addControl(btnRight, 'ArrowRight');
    addControl(btnJump, 'Space');
    
    const btnBuy = document.getElementById('btn-buy');
    if (btnBuy) {
        const pressBuy = (e) => { e.preventDefault(); buyJetpack(); btnBuy.classList.add('active'); };
        const releaseBuy = (e) => { e.preventDefault(); btnBuy.classList.remove('active'); };
        btnBuy.addEventListener('mousedown', pressBuy);
        btnBuy.addEventListener('mouseup', releaseBuy);
        btnBuy.addEventListener('mouseleave', releaseBuy);
        btnBuy.addEventListener('touchstart', pressBuy, {passive: false});
        btnBuy.addEventListener('touchend', releaseBuy, {passive: false});
        btnBuy.addEventListener('touchcancel', releaseBuy, {passive: false});
    }
}

setupMobileControls();

restartBtn.addEventListener('click', initGame);

// Start Menu Events
startBtn.addEventListener('click', initGame);

// Start
initMenu();
