function initMenu() {
    gameState = 'MENU';
    isPaused = false;
    startMenu.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    if (pauseScreen) pauseScreen.classList.add('hidden');
    if (selectedMode === 'CLASSIC') highScore = classicHighScore;
    else if (selectedMode === 'DESCENT') highScore = descentHighScore;
    else if (selectedMode === 'GRAVITY_SHIFT') highScore = gravityShiftHighScore;
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
    
    initUsername();
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
    if (selectedMode === 'CLASSIC') highScore = classicHighScore;
    else if (selectedMode === 'DESCENT') highScore = descentHighScore;
    else if (selectedMode === 'GRAVITY_SHIFT') highScore = gravityShiftHighScore;
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
    isScoreSubmitted = false;
    
    // Reset mode variables
    gameContainer.style.transform = 'none';
    gravityPhase = 'UP';
    window.gravityShiftScoreAcc = 0;
    
    // Initial floor to stand on
    let floorWidth = selectedMode === 'DESCENT' ? 150 : canvas.width;
    let floorX = selectedMode === 'DESCENT' ? (canvas.width / 2) - (floorWidth / 2) : 0;
    let floorY = selectedMode === 'DESCENT' ? (canvas.height / 2) : canvas.height - 20;
    
    const floor = new Platform(floorX, floorY, floorWidth);
    floor.powerup = null;
    floor.isMoving = false;
    floor.vx = 0;
    platforms.push(floor);
    
    if (selectedMode === 'CLASSIC' || selectedMode === 'GRAVITY_SHIFT') {
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

function triggerGravityShift() {
    gravityPhase = gravityPhase === 'UP' ? 'DOWN' : 'UP';
    
    const shopHint = document.getElementById('shop-hint');
    const btnBuy = document.getElementById('btn-buy');

    if (gravityPhase === 'DOWN') {
        descentSpeed = 2;
        generatePlatformsDescent(player.y + 100);
        if (shopHint) shopHint.innerText = '[B] Heavy Fall (20🪙)';
        if (btnBuy) btnBuy.innerText = '☄️';
    } else {
        generatePlatforms(player.y - 100);
        if (shopHint) shopHint.innerText = '[B] Jetpack (20🪙)';
        if (btnBuy) btnBuy.innerText = '🚀';
    }
    
    // Flash screen
    document.body.style.backgroundColor = '#111';
    setTimeout(() => { document.body.style.backgroundColor = palettes[currentLevel].bg; }, 100);
}

function updateCameraAndLevel() {
    let currentStyle = selectedMode;
    if (selectedMode === 'GRAVITY_SHIFT') {
        currentStyle = gravityPhase === 'UP' ? 'CLASSIC' : 'DESCENT';
    }

    if (currentStyle === 'CLASSIC') {
        // Camera follows player smoothly when they go above middle of screen
        let prevCameraY = cameraY;
        const targetCameraY = player.y - canvas.height / 2;
        if (targetCameraY < cameraY) {
            cameraY += (targetCameraY - cameraY) * 0.15; 
        }
        
        const currentAltitude = Math.floor(Math.abs(cameraY));
        if (currentAltitude > maxAltitude && selectedMode !== 'GRAVITY_SHIFT') {
            maxAltitude = currentAltitude;
            if (gameState === 'PLAYING') {
                score = maxAltitude;
            }
        }
        
        if (gameState === 'PLAYING' && selectedMode === 'GRAVITY_SHIFT') {
            window.gravityShiftScoreAcc += Math.abs(cameraY - prevCameraY);
            score = Math.floor(window.gravityShiftScoreAcc);
        }
        
        if (gameState === 'PLAYING') {
            const topPlatform = platforms[platforms.length - 1];
            if (topPlatform.y > cameraY - canvas.height) {
                generatePlatforms(topPlatform.y - 100);
            }
                
                const newLevel = Math.floor(score / LEVEL_UP_SCORE) % palettes.length;
                if (newLevel !== currentLevel) {
                    currentLevel = newLevel;
                    updateUI();
                    
                    if (selectedMode === 'GRAVITY_SHIFT') {
                        triggerGravityShift();
                    }
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
    } else if (currentStyle === 'DESCENT') {
        let prevCameraY = cameraY;
        // Auto scroll camera downwards
        cameraY += descentSpeed;
        
        // Increase speed slightly as you go deeper
        descentSpeed += 0.0005;
        
        const currentDepth = Math.floor(cameraY);
        if (currentDepth > maxAltitude && selectedMode !== 'GRAVITY_SHIFT') {
            maxAltitude = currentDepth;
            if (gameState === 'PLAYING') {
                score = maxAltitude;
            }
        }
        
        if (gameState === 'PLAYING' && selectedMode === 'GRAVITY_SHIFT') {
            window.gravityShiftScoreAcc += Math.abs(cameraY - prevCameraY);
            score = Math.floor(window.gravityShiftScoreAcc);
        }
        
        if (gameState === 'PLAYING') {
            const bottomPlatform = platforms[platforms.length - 1];
            if (bottomPlatform && bottomPlatform.y < cameraY + canvas.height * 2) {
                generatePlatformsDescent(bottomPlatform.y + 100);
            }
                
                const newLevel = Math.floor(score / LEVEL_UP_SCORE) % palettes.length;
                if (newLevel !== currentLevel) {
                    currentLevel = newLevel;
                    updateUI();
                    
                    if (selectedMode === 'GRAVITY_SHIFT') {
                        triggerGravityShift();
                    }
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
            } else if (selectedMode === 'DESCENT') {
                descentHighScore = score;
                localStorage.setItem('jumperDescentHighScore', score);
            } else if (selectedMode === 'GRAVITY_SHIFT') {
                gravityShiftHighScore = score;
                localStorage.setItem('jumperGravityShiftHighScore', score);
            }
        }
        finalScoreEl.innerText = isCheatsUsed ? `SCORE: ${score} (CHEATS)` : `SCORE: ${score}`;
        finalHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
        finalCoinsEl.innerText = totalCoins;
        
        // Submit to Global Leaderboard (Only for ranked modes)
        if (!isCheatsUsed && supabaseClient && !isScoreSubmitted && selectedMode !== 'GRAVITY_SHIFT') {
            isScoreSubmitted = true;
            submitScoreToDB(score, selectedMode);
        }
        gameContainer.style.transform = 'none'; // reset rotation on game over
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

    let currentStyle = selectedMode;
    if (selectedMode === 'GRAVITY_SHIFT') {
        currentStyle = gravityPhase === 'UP' ? 'CLASSIC' : 'DESCENT';
    }

    if (currentStyle === 'CLASSIC' && player.jetpackTimer <= 0) {
        totalCoins -= 20;
        coinsEl.innerText = totalCoins;
        player.jetpackTimer = 300; // 5 seconds of jetpack
    } else if (currentStyle === 'DESCENT' && player.heavyFallTimer <= 0) {
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
    // Don't trigger game actions if the user is typing in an input field
    if (e.target.tagName === 'INPUT') return;

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
    if (e.target.tagName === 'INPUT') return;
    if (e.key && e.key.length === 1) {
        inputBuffer += e.key.toLowerCase();
        if (inputBuffer.length > 20) inputBuffer = inputBuffer.slice(-20);
        
        if (inputBuffer.includes('fannymagnet')) {
            inputBuffer = '';
            toggleDevMode();
        }
    }

    // Easter Egg: Type "DRAW"
    if (e.target.tagName === 'INPUT') return;
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
    if (e.target.tagName === 'INPUT') return;
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
        
        if (selectedMode === 'CLASSIC') highScore = classicHighScore;
        else if (selectedMode === 'DESCENT') highScore = descentHighScore;
        else if (selectedMode === 'GRAVITY_SHIFT') highScore = gravityShiftHighScore;
        
        menuHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
    });
});

startBtn.addEventListener('click', initGame);

// --- Username & Leaderboard Logic ---

function initUsername() {
    if (!playerId) {
        playerId = generateUUID();
        localStorage.setItem('jumperPlayerId', playerId);
    }
    
    // Debug: Show ID in dev panel
    const devIdDisp = document.getElementById('dev-id-display');
    if (devIdDisp) devIdDisp.innerText = `ID: ${playerId}`;

    if (!username) {
        const adjs = ['SWIFT', 'NEON', 'BOLD', 'FAST', 'MEGA', 'SUPER', 'ULTRA', 'CRAZY'];
        const nouns = ['JUMPER', 'RUNNER', 'LEAPER', 'BOUNCER', 'GHOST', 'PILOT', 'CHAMP'];
        username = adjs[Math.floor(Math.random() * adjs.length)] + '-' + nouns[Math.floor(Math.random() * nouns.length)] + '-' + Math.floor(Math.random() * 99);
        localStorage.setItem('jumperUsername', username);
    }
    if (usernameInput) {
        usernameInput.value = username;
        usernameInput.addEventListener('input', (e) => {
            username = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            usernameInput.value = username;
            localStorage.setItem('jumperUsername', username);
        });
    }

    // Sync scores in background
    syncAllScoresWithDB();
}

async function syncAllScoresWithDB() {
    if (!supabaseClient || !playerId) return;
    
    console.log('[Sync] Checking database for score updates...');
    const { data, error } = await supabaseClient
        .from('leaderboard')
        .select('mode, score')
        .eq('player_id', playerId);
        
    if (error) {
        console.error('[Sync] Error fetching scores:', error);
        return;
    }
    
    const remoteScores = {};
    if (data) {
        data.forEach(entry => {
            remoteScores[entry.mode] = entry.score;
        });
    }
    
    const modes = ['CLASSIC', 'DESCENT'];
    modes.forEach(mode => {
        const local = Number(localStorage.getItem(mode === 'CLASSIC' ? 'jumperClassicHighScore' : 'jumperDescentHighScore')) || 0;
        const remote = remoteScores[mode] || 0;
        
        if (local > remote) {
            console.log(`[Sync] Pushing ${mode} local best (${local}) to DB (Remote was ${remote})`);
            submitScoreToDB(local, mode);
        } else if (remote > local) {
            console.log(`[Sync] Updating ${mode} local best (${local} -> ${remote}) from DB`);
            if (mode === 'CLASSIC') {
                classicHighScore = remote;
                localStorage.setItem('jumperClassicHighScore', remote);
            } else {
                descentHighScore = remote;
                localStorage.setItem('jumperDescentHighScore', remote);
            }
            
            // Update UI if it's the current mode
            if (selectedMode === mode) {
                highScore = remote;
                if (menuHighScoreEl) menuHighScoreEl.innerText = `HIGH SCORE: ${highScore}`;
                if (highScoreEl) highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
            }
        }
    });
}

function updateLeaderboardUI(mode = leaderboardMode) {
    if (!leaderboardBody) return;
    
    leaderboardMode = mode;
    // Update tab UI
    if (tabClassic && tabDescent) {
        tabClassic.classList.toggle('active', mode === 'CLASSIC');
        tabDescent.classList.toggle('active', mode === 'DESCENT');
    }

    leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">FETCHING ' + mode + ' SCORES...</td></tr>';

    if (!supabaseClient) {
        leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: #E03C31;">DATABASE NOT CONNECTED</td></tr>';
        return;
    }

    supabaseClient
        .from('leaderboard')
        .select('*')
        .eq('mode', mode)
        .order('score', { ascending: false })
        .limit(10)
        .then(({ data, error }) => {
            if (error) {
                console.error(error);
                leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">ERROR LOADING SCORES</td></tr>';
                return;
            }

            leaderboardBody.innerHTML = '';
            let playerInTop10 = false;

            if (data.length === 0) {
                leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">NO SCORES YET. BE THE FIRST!</td></tr>';
            } else {
                data.forEach((entry, index) => {
                    const tr = document.createElement('tr');
                    if (entry.player_id === playerId) {
                        tr.className = 'current-player';
                        playerInTop10 = true;
                    }
                    
                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${entry.username}</td>
                        <td>${entry.score.toLocaleString()}</td>
                    `;
                    leaderboardBody.appendChild(tr);
                });
            }

            // Show personal rank in footer if not in top 10
            const footer = document.getElementById('leaderboard-footer');
            if (footer) {
                if (playerInTop10 || !playerId) {
                    footer.classList.add('hidden');
                } else {
                    // Fetch player's best for this mode
                    supabaseClient
                        .from('leaderboard')
                        .select('score')
                        .eq('player_id', playerId)
                        .eq('mode', mode)
                        .maybeSingle()
                        .then(({ data: myData }) => {
                            if (myData) {
                                footer.classList.remove('hidden');
                                document.getElementById('my-best').innerText = myData.score.toLocaleString();
                                // We don't have the exact rank easily without a complex query, 
                                // but showing the score confirms it's in the DB.
                                document.getElementById('my-rank').innerText = 'MY BEST';
                            } else {
                                footer.classList.add('hidden');
                            }
                        });
                }
            }
        });
}

async function submitScoreToDB(finalScore, mode) {
    const statusEl = document.getElementById('leaderboard-status');
    if (statusEl) {
        statusEl.innerText = 'Syncing score...';
        statusEl.classList.add('pulse');
        statusEl.style.color = '#fff';
    }

    // Only submit if it's a valid score and database is connected
    if (!supabaseClient) {
        if (statusEl) {
            statusEl.innerText = 'Database not connected';
            statusEl.classList.remove('pulse');
        }
        return;
    }
    
    if (isCheatsUsed || !playerId) {
        if (statusEl) {
            statusEl.innerText = 'Cheats active or ID missing';
            statusEl.classList.remove('pulse');
        }
        return;
    }

    // Double check with local high score
    const currentLocalBest = mode === 'CLASSIC' ? classicHighScore : descentHighScore;
    
    // We sync if it's equal or higher than local best (to ensure remote is up to date)
    if (finalScore < currentLocalBest) {
        if (statusEl) {
            statusEl.innerText = ''; // Lower than best, no need to sync
            statusEl.classList.remove('pulse');
        }
        return;
    }

    console.log(`[Leaderboard] Submitting ${mode} score: ${finalScore} for player: ${username} (${playerId})`);

    const { error } = await supabaseClient
        .from('leaderboard')
        .upsert({ 
            player_id: playerId, 
            username: username || 'ANONYMOUS', 
            score: parseInt(finalScore), 
            mode: mode,
            updated_at: new Date().toISOString()
        }, { onConflict: 'player_id,mode' });

    if (error) {
        console.error('[Leaderboard] Error:', error);
    } else {
        console.log('[Leaderboard] Success!');
        
        // Refresh leaderboard if user is currently looking at it
        setTimeout(() => {
            if (leaderboardScreen && !leaderboardScreen.classList.contains('hidden')) {
                updateLeaderboardUI(mode);
            }
        }, 500);
        return true;
    }
}

if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
        updateLeaderboardUI(selectedMode); // Show leaderboard for currently selected game mode
        leaderboardScreen.classList.remove('hidden');
    });
}

if (tabClassic) {
    tabClassic.addEventListener('click', () => updateLeaderboardUI('CLASSIC'));
}
if (tabDescent) {
    tabDescent.addEventListener('click', () => updateLeaderboardUI('DESCENT'));
}

if (closeLeaderboardBtn) {
    closeLeaderboardBtn.addEventListener('click', () => {
        leaderboardScreen.classList.add('hidden');
    });
}

// Start
initMenu();
