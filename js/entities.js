class Player {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = selectedMode === 'DESCENT' ? (canvas.height / 2) - 30 : canvas.height - 100;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.jetpackTimer = 0;
        this.heavyFallTimer = 0;
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
            
            // Heavy Fall Powerup (Descent Mode)
            if (this.heavyFallTimer > 0) {
                this.heavyFallTimer--;
                currentGravity *= 3; // Fall 3x as fast
            }
            
            let currentJump = isMoonDimension ? -11 : JUMP_FORCE;
            
            this.vy += currentGravity;
            
            // Allow higher terminal velocity if heavy falling
            if (this.heavyFallTimer > 0 && this.vy > 20) this.vy = 20;
            
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
        if (!isDrawnStyle) {
            ctx.fillStyle = color + '66';
            ctx.fillRect(this.x - this.vx * 1.5, this.y - cameraY - this.vy * 0.5, this.width, this.height);
        }
        
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

        // Draw heavy fall aura if active
        if (this.heavyFallTimer > 0) {
            ctx.strokeStyle = '#c296f5'; // Purple aura
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y - cameraY - 5);
            ctx.lineTo(this.x + this.width / 2, this.y - cameraY + this.height + 10);
            ctx.lineTo(this.x + this.width - 5, this.y - cameraY - 5);
            ctx.stroke();
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

        // 15% chance to spawn a powerup on this platform (Only in Classic Mode)
        if (selectedMode === 'CLASSIC' && Math.random() < 0.15) {
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