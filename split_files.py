import os
import re

# Read the entire script.js
with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Make js directory
os.makedirs('js', exist_ok=True)

# 1. globals.js
globals_code = """
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

let currentLevel = 0;
let score = 0;
let highScore = localStorage.getItem('jumperHighScore') || 0;
let totalCoins = 0;
let maxAltitude = 0;
let isMoonDimension = false;
let moonTimer = 0;
let isGameOver = false;
let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
let selectedMode = 'CLASSIC';
let descentSpeed = 2;
let cameraY = 0;

let player;
let platforms = [];

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};
"""
with open('js/globals.js', 'w', encoding='utf-8') as f:
    f.write(globals_code.strip())

# 2. config.js
config_code = """
// Swiss Design Palettes: [Background, Platform/Text, Player/Accent]
const palettes = [
    { bg: '#F4F4F0', plat: '#111111', player: '#E03C31' }, // Level 1: White, Black, Red
    { bg: '#E03C31', plat: '#F4F4F0', player: '#111111' }, // Level 2: Red, White, Black
    { bg: '#005BBB', plat: '#111111', player: '#F4F4F0' }, // Level 3: Blue, Black, White
    { bg: '#FFD100', plat: '#111111', player: '#E03C31' }, // Level 4: Yellow, Black, Red
    { bg: '#111111', plat: '#F4F4F0', player: '#005BBB' }  // Level 5: Black, White, Blue
];

const MOON_DURATION = 60 * 15; // 15 seconds

// Physics & Gameplay Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const MAX_SPEED = 10;
const ACCELERATION = 1.2;
const FRICTION = 0.85;
const SUPER_JUMP_FORCE = -25;
const LEVEL_UP_SCORE = 3000;
"""
with open('js/config.js', 'w', encoding='utf-8') as f:
    f.write(config_code.strip())

# 3. utils.js
# Extract shadeColor and draw3DBlock
utils_match = re.search(r'(// 2\.5D Rendering Helpers.*?)\nconst canvas', js, re.DOTALL)
with open('js/utils.js', 'w', encoding='utf-8') as f:
    f.write(utils_match.group(1).strip())

# 4. entities.js
# Extract Player, Platform, Coin, Powerup
entities_match = re.search(r'(class Player \{.*?)\nfunction drawGrid', js, re.DOTALL)
with open('js/entities.js', 'w', encoding='utf-8') as f:
    f.write(entities_match.group(1).strip())

# 5. levels.js
# Extract generatePlatforms and generatePlatformsDescent
levels_match = re.search(r'(function generatePlatformsDescent\(startY\) \{.*?)\nfunction updateUI', js, re.DOTALL)
with open('js/levels.js', 'w', encoding='utf-8') as f:
    f.write(levels_match.group(1).strip())

# 6. main.js
# Extract everything else
main_parts = []
# drawGrid and checkCollisions and updateCameraAndLevel
main_part_1 = re.search(r'(function drawGrid\(\) \{.*?)\nfunction initMenu', js, re.DOTALL)
if main_part_1: main_parts.append(main_part_1.group(1))

# updateUI and beyond
main_part_2 = re.search(r'(function updateUI\(\) \{.*)', js, re.DOTALL)
if main_part_2: main_parts.append(main_part_2.group(1))

# Also need initMenu, initGame, buyJetpack, gameLoop, etc.
# Wait, they are inside main_part_1 and main_part_2 ranges. Let's just grab the whole bottom part:
main_code = re.search(r'(function drawGrid\(\) \{.*)', js, re.DOTALL).group(1)

# Remove generatePlatforms functions from main_code since they are in levels.js
main_code = re.sub(r'function generatePlatformsDescent\(startY\) \{.*?\n}\n', '', main_code, flags=re.DOTALL)
main_code = re.sub(r'function generatePlatforms\(startY\) \{.*?\n}\n', '', main_code, flags=re.DOTALL)

with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(main_code.strip())

# 7. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts_html = """
    <script src="js/globals.js"></script>
    <script src="js/config.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/entities.js"></script>
    <script src="js/levels.js"></script>
    <script src="js/main.js"></script>
"""

html = html.replace('<script src="script.js"></script>', scripts_html.strip())

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
