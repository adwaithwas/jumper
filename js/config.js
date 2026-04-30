const palettes = [
    { bg: '#F4F4F0', plat: '#111111', player: '#E03C31' }, // Level 1: White, Black, Red
    { bg: '#E03C31', plat: '#F4F4F0', player: '#111111' }, // Level 2: Red, White, Black
    { bg: '#005BBB', plat: '#111111', player: '#F4F4F0' }, // Level 3: Blue, Black, White
    { bg: '#FFD100', plat: '#111111', player: '#E03C31' }, // Level 4: Yellow, Black, Red
    { bg: '#111111', plat: '#F4F4F0', player: '#005BBB' }, // Level 5: Black, White, Blue
    { bg: '#150818', plat: '#c296f5', player: '#e705c9' }  // Level 6: Dark-purple, Light-purple, bright-pink
];

const MOON_DURATION = 60 * 15;

const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const SUPER_JUMP_FORCE = -24;
const ACCELERATION = 1.5;
const FRICTION = 0.82;
const MAX_SPEED = 10;
const LEVEL_UP_SCORE = 1500;