export enum GameState {
  MENU = 'MENU',
  CUTSCENE = 'CUTSCENE',
  GAMEPLAY = 'GAMEPLAY',
  GAME_OVER = 'GAME_OVER',
}

export enum CharacterType {
  PANDA = 'PANDA',
  BEAR = 'BEAR',
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  isAttacking: boolean;
  isBlocking: boolean;
  facingRight: boolean;
  isGrounded: boolean;
  attackCooldown: number;
  hitStun: number;
  name: string;
  isDead: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}