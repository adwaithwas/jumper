const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const devPanel = document.getElementById('dev-panel');
const pauseScreen = document.getElementById('pause-screen');
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
let classicHighScore = Number(localStorage.getItem('jumperClassicHighScore')) || 0;
let descentHighScore = Number(localStorage.getItem('jumperDescentHighScore')) || 0;
let highScore = 0; // Dynamic based on mode
let totalCoins = 0;
let maxAltitude = 0;
let isMoonDimension = false;
let moonTimer = 0;
let isGameOver = false;
let isGodMode = false;
let isDrawnStyle = false;
let isPaused = false;
let isCheatsUsed = false;
let gameState = 'MENU';
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

// Username and Leaderboard
let username = localStorage.getItem('jumperUsername') || '';
let playerId = localStorage.getItem('jumperPlayerId') || '';
const usernameInput = document.getElementById('username-input');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
const leaderboardBody = document.getElementById('leaderboard-body');
const tabClassic = document.getElementById('tab-classic');
const tabDescent = document.getElementById('tab-descent');
let leaderboardMode = 'CLASSIC'; // Default view
let isScoreSubmitted = false; // Flag to prevent multiple submissions per run