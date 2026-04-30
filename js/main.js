function initMenu() {
    gameState = 'MENU';
    isPaused = false;
    startMenu.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    if (pauseScreen) pauseScreen.classList.add('hidden');
    highScore = selectedMode === 'CLASSIC' ? classicHighScore : descentHighScore;
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
    
    // Remove focus from any buttons so Spacebar doesn't accidentally click them
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    player = new Player();
    platforms = [];
    currentLevel = 0;
    score = 0;
    totalCoins = 0;
    maxAltitude = 0;
    highScore = selectedMode === 'CLASSIC' ? classicHighScore : descentHighScore;
    highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
    coinsEl.innerText = totalCoins;
    cameraY = 0;
    isGameOver = false;
    isPaused = false;
    isCheatsUsed = false;
    isMoonDimension = false;
    moonTimer = 0;
    gameContainer.classList.remove('moon-style');
    
    gameOverScreen.classList.add('hidden');
    if (pauseScreen) pauseScreen.classList.add('hidden');
    
    // Initial floor to stand on
    let floorWidth = selectedMode === 'DESCENT' ? 150 : canvas.width;
    let floorX = selectedMode === 'DESCENT' ? (canvas.width / 2) - (floorWidth / 2) : 0;
    let floorY = selectedMode === 'DESCENT' ? (canvas.height / 2) : canvas.height - 20;
    
    const floor = new Platform(floorX, floorY, floorWidth);
    floor.powerup = null;
    floor.isMoving = false;
    floor.vx = 0;
    platforms.push(floor);
    
    if (selectedMode === 'CLASSIC') {
        generatePlatforms(canvas.height - 120);
        const shopHint = document.getElementById('shop-hint');
        if (shopHint) shopHint.innerText = '[B] Jetpack (20🪙)';
        const btnBuy = document.getElementById('btn-buy');
        if (btnBuy) btnBuy.innerText = '🚀';
    } else if (selectedMode === 'DESCENT') {
        descentSpeed = 2; // Initial auto-scroll speed
        generatePlatformsDescent((canvas.height / 2) + 150);
        const shopHint = document.getElementById('shop-hint');
        if (shopHint) shopHint.innerText = '[B] Heavy Fall (20🪙)';
        const btnBuy = document.getElementById('btn-buy');
        if (btnBuy) btnBuy.innerText = '☄️';
    }
    
    updateUI();
    lastTime = performance.now();
    accumulator = 0;
    requestAnimationFrame(gameLoop);
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
    if (selectedMode === 'CLASSIC') {
        // Camera follows player smoothly when they go above middle of screen
        const targetCameraY = player.y - canvas.height / 2;
        if (targetCameraY < cameraY) {
            cameraY += (targetCameraY - cameraY) * 0.15; 
        }
        
        const currentAltitude = Math.floor(Math.abs(cameraY));
        if (currentAltitude > maxAltitude) {
            maxAltitude = currentAltitude;
            score = maxAltitude;
            
            const topPlatform = platforms[platforms.length - 1];
            if (topPlatform.y > cameraY - canvas.height) {
                generatePlatforms(topPlatform.y - 100);
            }
            
            const newLevel = Math.min(Math.floor(score / LEVEL_UP_SCORE), palettes.length - 1);
            if (newLevel !== currentLevel) {
                currentLevel = newLevel;
                updateUI();
            }
        }
        
        platforms = platforms.filter(p => p.y < cameraY + canvas.height + 100);
        
        if (player.y > cameraY + canvas.height) {
            if (isMoonDimension) {
                isMoonDimension = false;
                moonTimer = 0;
                gameContainer.classList.remove('moon-style');
                player.vy = -28;
            } else if (isGodMode) {
                player.vy = -20; // Bounce up
            } else {
                if (gameState === 'PLAYING') { score += (totalCoins * 100); }
                gameState = 'GAMEOVER'; isGameOver = true;
            }
        }
    } else if (selectedMode === 'DESCENT') {
        // Auto scroll camera downwards
        cameraY += descentSpeed;
        
        // Increase speed slightly as you go deeper
        descentSpeed += 0.0005;
        
        // No camera catch-up. You must stay inside the box!
        
        const currentDepth = Math.floor(cameraY);
        if (currentDepth > maxAltitude) {
            maxAltitude = currentDepth;
            score = maxAltitude;
            
            const bottomPlatform = platforms[platforms.length - 1];
            if (bottomPlatform && bottomPlatform.y < cameraY + canvas.height * 2) {
                generatePlatformsDescent(bottomPlatform.y + 100);
            }
            
            const newLevel = Math.min(Math.floor(score / LEVEL_UP_SCORE), palettes.length - 1);
            if (newLevel !== currentLevel) {
                currentLevel = newLevel;
                updateUI();
            }
        }
        
        platforms = platforms.filter(p => p.y > cameraY - 200);
        
        // Death in descent: crushed by the top of the screen!
        if (player.y + player.height < cameraY) {
            if (isGodMode) {
                player.y = cameraY + 10;
                player.vy = 0;
            } else {
                if (gameState === 'PLAYING') { score += (totalCoins * 100); }
                gameState = 'GAMEOVER'; isGameOver = true;
            }
        }
        
        // Death in descent: falling off the bottom of the screen!
        if (player.y > cameraY + canvas.height) {
            if (isGodMode) {
                player.y = cameraY + canvas.height - player.height - 10;
                player.vy = 0;
            } else {
                if (gameState === 'PLAYING') { score += (totalCoins * 100); }
                gameState = 'GAMEOVER'; isGameOver = true;
            }
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

    if (typeof menuBtn !== 'undefined' && menuBtn) {
        menuBtn.style.borderColor = palette.plat;
        menuBtn.style.color = palette.plat;
    }

    // Mobile controls dynamic styling
    document.documentElement.style.setProperty('--btn-color', palette.plat);
    document.documentElement.style.setProperty('--btn-bg-active', palette.plat);
    document.documentElement.style.setProperty('--btn-text-active', palette.bg);
}

let lastTime = 0;
let accumulator = 0;
const frameDuration = 1000 / 60; // Target 60 FPS for logic

function drawGrid() {
    // Stationary background grid
    const palette = palettes[currentLevel];
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
}

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
        if (score > highScore && !isCheatsUsed) {
            highScore = score;
            if (selectedMode === 'CLASSIC') {
                classicHighScore = score;
                localStorage.setItem('jumperClassicHighScore', score);
            } else {
                descentHighScore = score;
                localStorage.setItem('jumperDescentHighScore', score);
            }
        }
        finalScoreEl.innerText = isCheatsUsed ? `SCORE: ${score} (CHEATS)` : `SCORE: ${score}`;
        finalHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
        finalCoinsEl.innerText = totalCoins;
        return;
    }

    let deltaTime = timestamp - lastTime;
    // Cap deltaTime to avoid spiral of death if tab was inactive
    if (deltaTime > 250) deltaTime = 250;
    lastTime = timestamp;

    if (isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

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

    drawGrid();

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
    if (gameState !== 'PLAYING' || totalCoins < 20) return;

    if (selectedMode === 'CLASSIC' && player.jetpackTimer <= 0) {
        totalCoins -= 20;
        coinsEl.innerText = totalCoins;
        player.jetpackTimer = 300; // 5 seconds of jetpack
    } else if (selectedMode === 'DESCENT' && player.heavyFallTimer <= 0) {
        totalCoins -= 20;
        coinsEl.innerText = totalCoins;
        player.heavyFallTimer = 180; // 3 seconds of heavy fall
    }
}

function toggleDevMode() {
    isCheatsUsed = true;
    totalCoins += 9999;
    coinsEl.innerText = totalCoins;
    if (devPanel) {
        devPanel.classList.toggle('hidden');
    }
}

let inputBuffer = '';

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

    // Pause on 'P' or 'Escape'
    if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PLAYING') {
        isPaused = !isPaused;
        if (isPaused) {
            if (pauseScreen) pauseScreen.classList.remove('hidden');
        } else {
            if (pauseScreen) pauseScreen.classList.add('hidden');
            lastTime = performance.now(); // Prevent massive jump when unpausing
        }
    }

    // Cheat Code Buffer
    if (e.key && e.key.length === 1) {
        inputBuffer += e.key.toLowerCase();
        if (inputBuffer.length > 20) inputBuffer = inputBuffer.slice(-20);
        
        if (inputBuffer.includes('fannymagnet')) {
            inputBuffer = '';
            toggleDevMode();
        }
    }

    // Easter Egg: Type "DRAW"
    if (e.code === secretCode[secretIndex]) {
        secretIndex++;
        if (secretIndex === secretCode.length) {
            gameContainer.classList.toggle('drawn-style');
            isDrawnStyle = !isDrawnStyle;
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

if (typeof menuBtn !== 'undefined' && menuBtn) {
    menuBtn.addEventListener('click', initMenu);
}

// Dev Tools Buttons
const devLvlBtn = document.getElementById('dev-lvl-btn');
const devCoinsBtn = document.getElementById('dev-coins-btn');
const devJetBtn = document.getElementById('dev-jet-btn');
const devHeavyBtn = document.getElementById('dev-heavy-btn');
const devMoonBtn = document.getElementById('dev-moon-btn');
const devGodBtn = document.getElementById('dev-god-btn');

if (devLvlBtn) {
    devLvlBtn.addEventListener('click', () => {
        isCheatsUsed = true;
        score += LEVEL_UP_SCORE;
        updateUI();
    });
}
if (devCoinsBtn) {
    devCoinsBtn.addEventListener('click', () => {
        isCheatsUsed = true;
        totalCoins += 1000;
        coinsEl.innerText = totalCoins;
    });
}
if (devJetBtn) {
    devJetBtn.addEventListener('click', () => {
        isCheatsUsed = true;
        if (player) player.jetpackTimer = 300;
    });
}
if (devHeavyBtn) {
    devHeavyBtn.addEventListener('click', () => {
        isCheatsUsed = true;
        if (player) player.heavyFallTimer = 180;
    });
}
if (devMoonBtn) {
    devMoonBtn.addEventListener('click', () => {
        isCheatsUsed = true;
        if (player) {
            player.vy = -16;
            isMoonDimension = true;
            moonTimer = MOON_DURATION;
            gameContainer.classList.add('moon-style');
        }
    });
}
if (devGodBtn) {
    devGodBtn.addEventListener('click', () => {
        isCheatsUsed = true;
        isGodMode = !isGodMode;
        devGodBtn.innerText = isGodMode ? '👻 GOD MODE: ON' : '👻 GOD MODE: OFF';
    });
}

// Pause Menu Events
const pauseMenuBtn = document.getElementById('pause-menu-btn');
if (pauseMenuBtn) {
    pauseMenuBtn.addEventListener('click', () => {
        initMenu();
    });
}

// Start Menu Events

const levelBtns = document.querySelectorAll('.level-btn');
levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        levelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.getAttribute('data-mode');
        highScore = selectedMode === 'CLASSIC' ? classicHighScore : descentHighScore;
        menuHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
    });
});

startBtn.addEventListener('click', initGame);

// Start
initMenu();
