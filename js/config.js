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

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://xlbwfzmujpiavyzkabau.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYndmem11anBpYXZ5emthYmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTM3MjIsImV4cCI6MjA5MzEyOTcyMn0.JGwhVtD3xiqGQsFjNcwR7QlT7SMRm7GDX8ISh9dkmCI';
const supabaseClient = (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;