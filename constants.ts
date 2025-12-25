
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const GRAVITY = 0.6;
export const JUMP_FORCE = -15;
export const MOVE_SPEED = 5;
export const FRICTION = 0.8;
export const GROUND_Y = 500;

export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 80;
export const MAX_HP = 100;

// Keys
export const KEY_LEFT = 'ArrowLeft';
export const KEY_RIGHT = 'ArrowRight';
export const KEY_UP = 'ArrowUp';
export const KEY_ATTACK = 'z';
export const KEY_BLOCK = 'x';

export const AI_THINK_INTERVAL = 15; // Frames (Faster reaction time)

// Styles
export const CHARACTER_STYLES = {
  PANDA: [
    { name: 'Grandmaster', primary: '#ffffff', secondary: '#111111', accent: '#ef4444' }, // Default
    { name: 'Shadow Ops', primary: '#333333', secondary: '#000000', accent: '#8b5cf6' }, // Dark/Purple
    { name: 'Arctic', primary: '#f0f9ff', secondary: '#1e3a8a', accent: '#38bdf8' }, // Ice
    { name: 'Inferno', primary: '#fef2f2', secondary: '#7f1d1d', accent: '#f59e0b' }, // Fire
    { name: 'Forest', primary: '#dcfce7', secondary: '#14532d', accent: '#22c55e' }, // Green
    { name: 'Golden', primary: '#fef9c3', secondary: '#854d0e', accent: '#eab308' }, // Gold
    { name: 'Neon City', primary: '#171717', secondary: '#262626', accent: '#22d3ee' }, // Cyber
    { name: 'Bubblegum', primary: '#fdf2f8', secondary: '#831843', accent: '#ec4899' }, // Pink
    { name: 'Monochrome', primary: '#d4d4d4', secondary: '#404040', accent: '#171717' }, // Grey
    { name: 'Inverted', primary: '#000000', secondary: '#ffffff', accent: '#ef4444' }, // Inverted
  ],
  BEAR: [
    { name: 'Wasteland', primary: '#5D4037', secondary: '#A1887F', accent: '#ef4444' }, // Default
    { name: 'Polar Tech', primary: '#e2e8f0', secondary: '#94a3b8', accent: '#3b82f6' }, // White/Blue
    { name: 'Toxic', primary: '#3f6212', secondary: '#84cc16', accent: '#a855f7' }, // Green/Purple
    { name: 'Molten', primary: '#451a03', secondary: '#c2410c', accent: '#facc15' }, // Magma
    { name: 'Iron Hide', primary: '#475569', secondary: '#94a3b8', accent: '#f43f5e' }, // Metal
    { name: 'Gold Plate', primary: '#854d0e', secondary: '#facc15', accent: '#ffffff' }, // Gold
    { name: 'Nightmare', primary: '#0f172a', secondary: '#334155', accent: '#dc2626' }, // Dark Blue/Red
    { name: 'Camo', primary: '#3f6212', secondary: '#57534e', accent: '#fbbf24' }, // Army
    { name: 'Vaporwave', primary: '#4c1d95', secondary: '#c026d3', accent: '#22d3ee' }, // Purple/Cyan
    { name: 'Spectre', primary: '#f8fafc', secondary: '#e2e8f0', accent: '#10b981' }, // Ghost
  ]
};
