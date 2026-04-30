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
let maxAltitude = 0;
let isGameOver = false;
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
            this.vy += GRAVITY;
            
            // Manual jumping (Mario-style)
            // Need to check against GRAVITY instead of 0 because gravity is applied before jumping check now
            if (keys.Space && (this.isGrounded || this.vy === GRAVITY)) { 
                this.vy = JUMP_FORCE;
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
        ctx.fillStyle = color;
        // Draw main body
        ctx.fillRect(this.x, this.y - cameraY, this.width, this.height);
        
        // Add a small shadow/trail effect for smoothness
        ctx.fillStyle = color + '66'; // Add transparency hex
        ctx.fillRect(this.x - this.vx * 1.5, this.y - cameraY - this.vy * 0.5, this.width, this.height);

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

class Powerup {
    constructor(x, y) {
        this.x = x + 15; // Center slightly on platform
        this.y = y - 20; // Float above platform
        this.width = 15;
        this.height = 15;
        this.collected = false;
        this.animOffset = Math.random() * Math.PI * 2;
        this.type = Math.random() < 0.08 ? 'JETPACK' : 'SUPER_JUMP'; // 8% chance for jetpack
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
        } else {
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
        }
    }

    draw(ctx, color, playerColor) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y - cameraY, this.width, this.height);

        if (this.powerup) {
            this.powerup.draw(ctx, playerColor); // Powerup uses player color
        }
    }
}

let player;
let platforms = [];

function initGame() {
    player = new Player();
    platforms = [];
    currentLevel = 0;
    score = 0;
    maxAltitude = 0;
    highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
    cameraY = 0;
    isGameOver = false;
    
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
        const width = Math.max(60, Math.random() * 100 + 50); 
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

        // Powerup Collision (Can happen anytime)
        if (p.powerup && !p.powerup.collected) {
            let pu = p.powerup;
            if (player.x < pu.x + pu.width &&
                player.x + player.width > pu.x &&
                player.y < pu.y + pu.height &&
                player.y + player.height > pu.y - pu.height) { // Adjusted for triangle height
                
                pu.collected = true;
                if (pu.type === 'SUPER_JUMP') {
                    player.vy = SUPER_JUMP_FORCE; // Instant boost!
                } else if (pu.type === 'JETPACK') {
                    player.jetpackTimer = 300; // 5 seconds at 60fps
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
    
    // Game Over if you fall off the bottom of the camera view
    if (player.y > cameraY + canvas.height) {
        isGameOver = true;
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
    if (isGameOver) {
        gameOverScreen.classList.remove('hidden');
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('jumperHighScore', highScore);
        }
        finalScoreEl.innerText = `SCORE: ${score}`;
        finalHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
        return;
    }

    let deltaTime = timestamp - lastTime;
    // Cap deltaTime to avoid spiral of death if tab was inactive
    if (deltaTime > 250) deltaTime = 250;
    lastTime = timestamp;

    accumulator += deltaTime;

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

    // Draw platforms and their powerups
    platforms.forEach(p => {
        p.draw(ctx, palette.plat, palette.player);
    });

    // Draw player
    player.draw(ctx, palette.player);

    requestAnimationFrame(gameLoop);
}

// Input Handling
window.addEventListener('keydown', (e) => {
    // Only register input if it's the expected keys to prevent interference
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
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
}

setupMobileControls();

restartBtn.addEventListener('click', initGame);

// Start
initGame();
