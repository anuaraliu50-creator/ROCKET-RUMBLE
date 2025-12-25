
import React, { useEffect, useRef, useState } from 'react';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_FORCE, MOVE_SPEED, 
  FRICTION, GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT, MAX_HP,
  KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_ATTACK, KEY_BLOCK, AI_THINK_INTERVAL,
  CHARACTER_STYLES
} from '../constants';
import { CharacterType, PlayerStats, Particle, GameState } from '../types';
import { audioService } from '../services/audioService';

interface GameProps {
  playerChar: CharacterType;
  playerStyleIndex: number;
  onGameOver: () => void;
}

const Game: React.FC<GameProps> = ({ playerChar, playerStyleIndex, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const [p1Hp, setP1Hp] = useState(MAX_HP);
  const [p2Hp, setP2Hp] = useState(MAX_HP);
  const [winner, setWinner] = useState<string | null>(null);

  // Initialize Players
  const createPlayer = (type: CharacterType, x: number, styleIdx: number): PlayerStats => ({
    hp: MAX_HP,
    maxHp: MAX_HP,
    x,
    y: GROUND_Y - PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    color: 'white', // Placeholder, used in draw
    isAttacking: false,
    isBlocking: false,
    facingRight: x < CANVAS_WIDTH / 2,
    isGrounded: true,
    attackCooldown: 0,
    hitStun: 0,
    name: type,
    isDead: false
  });

  // Determine opponent
  const opponentType = playerChar === CharacterType.PANDA ? CharacterType.BEAR : CharacterType.PANDA;

  const gameState = useRef({
    p1: createPlayer(playerChar, 100, playerStyleIndex),
    p2: createPlayer(opponentType, 600, 0), // Opponent uses default style (0)
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    gameOver: false,
    roundEnded: false
  });

  useEffect(() => {
    // Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    audioService.init();

    // Game Loop
    const loop = () => {
      if (gameState.current.gameOver) return;

      update();
      draw();
      
      // Update React UI state
      setP1Hp(gameState.current.p1.hp);
      setP2Hp(gameState.current.p2.hp);

      // Check for death
      if (!gameState.current.roundEnded) {
         if (gameState.current.p1.hp <= 0) handleDeath(gameState.current.p1, gameState.current.p2);
         else if (gameState.current.p2.hp <= 0) handleDeath(gameState.current.p2, gameState.current.p1);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleDeath = (loser: PlayerStats, winnerPlayer: PlayerStats) => {
    if (gameState.current.roundEnded) return;
    
    gameState.current.roundEnded = true;
    loser.isDead = true;
    loser.hp = 0;
    
    // EXPLOSION!
    audioService.playExplosion();
    const cx = loser.x + loser.width / 2;
    const cy = loser.y + loser.height / 2;
    
    // Fire
    spawnParticles(cx, cy, '#ef4444', 40); // Red
    spawnParticles(cx, cy, '#f59e0b', 40); // Orange
    spawnParticles(cx, cy, '#ffffff', 20); // White flash
    // Smoke
    spawnParticles(cx, cy, '#52525b', 30); // Gray

    setWinner(winnerPlayer.name);
    
    // Delay actual game over to show explosion
    setTimeout(() => {
      gameState.current.gameOver = true;
      onGameOver();
    }, 3000);
  };

  const update = () => {
    const state = gameState.current;
    frameCountRef.current++;

    // --- Player 1 Logic (Human) ---
    const p1 = state.p1;
    
    if (!p1.isDead) {
      // Movement
      if (p1.hitStun <= 0) {
        if (state.keys[KEY_LEFT]) {
          p1.vx -= 1;
          p1.facingRight = false;
        }
        if (state.keys[KEY_RIGHT]) {
          p1.vx += 1;
          p1.facingRight = true;
        }
        if (state.keys[KEY_UP] && p1.isGrounded) {
          p1.vy = JUMP_FORCE;
          p1.isGrounded = false;
          audioService.playJump();
        }
        
        // Combat
        p1.isBlocking = !!state.keys[KEY_BLOCK];
        
        if (state.keys[KEY_ATTACK] && p1.attackCooldown <= 0 && !p1.isBlocking) {
          p1.isAttacking = true;
          p1.attackCooldown = 20; // Frames
          // Check Hit
          checkHit(p1, state.p2);
        }
      }
    }

    // --- Player 2 Logic (Stronger AI) ---
    const p2 = state.p2;
    if (!p2.isDead && p2.hitStun <= 0) {
      const distToP1 = Math.abs(p1.x - p2.x);
      
      // 1. Defense
      if (p1.isAttacking && distToP1 < 120 && p1.facingRight !== p2.facingRight) {
         if (!p2.isBlocking && Math.random() < 0.6) {
           p2.isBlocking = true;
           setTimeout(() => { if(!gameState.current.gameOver) p2.isBlocking = false }, 500);
         }
      }

      // 2. Strategic Thinking
      if (frameCountRef.current % AI_THINK_INTERVAL === 0) {
        const dx = p1.x - p2.x;
        p2.facingRight = dx > 0;

        if (!p1.isAttacking) p2.isBlocking = false;

        if (distToP1 > 70) {
          p2.vx += dx > 0 ? 1.5 : -1.5; 
          
          if ((p1.y < p2.y - 50 || Math.random() < 0.05) && p2.isGrounded) {
             p2.vy = JUMP_FORCE;
             p2.isGrounded = false;
          }
        } else {
          if (p2.attackCooldown <= 0) {
             if (Math.random() < 0.8) {
               p2.isAttacking = true;
               p2.attackCooldown = 25;
               checkHit(p2, p1);
             } else {
               p2.isBlocking = Math.random() > 0.5;
             }
          }
        }
      }
    }

    // --- Physics Update (Both) ---
    [p1, p2].forEach(p => {
      if (p.isDead) return;

      if (p.attackCooldown > 0) p.attackCooldown--;
      if (p.isAttacking && p.attackCooldown < 10) p.isAttacking = false;
      if (p.hitStun > 0) p.hitStun--;

      p.vy += GRAVITY;
      p.vx *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;

      if (p.y + p.height >= GROUND_Y) {
        p.y = GROUND_Y - p.height;
        p.vy = 0;
        p.isGrounded = true;
      }

      if (p.x < 0) p.x = 0;
      if (p.x + p.width > CANVAS_WIDTH) p.x = CANVAS_WIDTH - p.width;
      
      p.vx = Math.max(Math.min(p.vx, MOVE_SPEED), -MOVE_SPEED);
    });

    // --- Particles ---
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const part = state.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.life--;
      part.vy += 0.1;
      if (part.life <= 0) state.particles.splice(i, 1);
    }
  };

  const checkHit = (attacker: PlayerStats, defender: PlayerStats) => {
    if (defender.isDead) return;

    const reach = 80;
    const dx = defender.x - attacker.x;
    const inReach = Math.abs(dx) < reach;
    const facingCorrectly = (attacker.facingRight && dx > 0) || (!attacker.facingRight && dx < 0);

    if (inReach && facingCorrectly) {
      if (defender.isBlocking) {
        audioService.playBlock();
        spawnParticles(defender.x + defender.width/2, defender.y + defender.height/2, 'cyan', 5);
        defender.vx = attacker.facingRight ? 8 : -8;
      } else {
        audioService.playHit();
        defender.hp -= 10;
        defender.hitStun = 15;
        defender.vy = -5;
        defender.vx = attacker.facingRight ? 8 : -8;
        spawnParticles(defender.x + defender.width/2, defender.y + defender.height/2, 'red', 10);
      }
    }
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const speed = Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      gameState.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        color,
        size: Math.random() * 8 + 3
      });
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameState.current;
    const time = frameCountRef.current;

    // --- Cartoon Setup ---
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // --- Background: Blue Weird Planet ---
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Background Planets
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath(); ctx.arc(650, 150, 40, 0, Math.PI*2); ctx.fill(); 
    ctx.strokeStyle = '#2563eb'; ctx.stroke();
    
    ctx.fillStyle = '#3b82f6';
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(100, 200, 80, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;

    // Mountains
    ctx.fillStyle = '#172554';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(150, GROUND_Y - 100);
    ctx.lineTo(300, GROUND_Y);
    ctx.lineTo(500, GROUND_Y - 150);
    ctx.lineTo(650, GROUND_Y);
    ctx.lineTo(800, GROUND_Y - 80);
    ctx.lineTo(800, GROUND_Y);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Ground
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.strokeStyle = 'black'; ctx.stroke();
    
    // Craters
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath(); ctx.ellipse(200, GROUND_Y + 20, 50, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(550, GROUND_Y + 60, 70, 15, 0, 0, Math.PI*2); ctx.fill();

    // Render Players
    // Player 1 is controlled by `playerStyleIndex`. Player 2 is default (0).
    const p1 = state.p1;
    const p2 = state.p2;

    [p1, p2].forEach((p) => {
       if (p.isDead) return;

       const isPlayer = p === p1;
       // Get Styles
       const styles = CHARACTER_STYLES[p.name === CharacterType.PANDA ? 'PANDA' : 'BEAR'];
       const currentStyle = isPlayer ? styles[playerStyleIndex] : styles[0]; 

       const cPrimary = currentStyle.primary;
       const cSecondary = currentStyle.secondary;
       const cAccent = currentStyle.accent;

       ctx.save();
       // Base Translate to Center of Character
       ctx.translate(p.x + p.width/2, p.y + p.height/2);
       
       // Face direction
       if (!p.facingRight) ctx.scale(-1, 1);

       // Hurt flicker
       if (p.hitStun > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
         ctx.globalAlpha = 0.5;
       }

       // --- ANIMATION MATH ---
       const isMoving = Math.abs(p.vx) > 0.1;
       const isAirborne = !p.isGrounded;
       const runSpeed = 0.25;

       // Default Idle (Breathing)
       let torsoY = Math.sin(time * 0.1) * 2;
       let torsoRot = 0;
       let headRot = Math.sin(time * 0.05) * 0.05;

       let fArmRot = Math.sin(time * 0.1) * 0.1; 
       let bArmRot = -Math.sin(time * 0.1) * 0.1; 
       let fLegRot = 0;
       let bLegRot = 0;

       if (isMoving && !isAirborne) {
           // Run Cycle
           torsoY = Math.abs(Math.sin(time * runSpeed * 2)) * 3;
           torsoRot = 0.15; // Aggressive Lean forward
           
           const limbCycle = time * runSpeed;
           fLegRot = Math.sin(limbCycle) * 0.9;
           bLegRot = Math.sin(limbCycle + Math.PI) * 0.9;
           
           fArmRot = Math.sin(limbCycle + Math.PI) * 0.9;
           bArmRot = Math.sin(limbCycle) * 0.9;
       }

       if (isAirborne) {
           // Jump Pose
           torsoY = -5;
           fLegRot = -0.5; // Knee up
           bLegRot = 0.2;  // Leg straightish
           fArmRot = -2.5; // Arms up!
           bArmRot = -2.5;
       }

       if (p.isAttacking) {
           // Attack Punch Animation
           const progress = 1 - (p.attackCooldown / 20); // 0 -> 1
           torsoRot = progress * 0.3;
           fArmRot = -1.5 + Math.sin(progress * Math.PI) * 1.5; // Punch arc
           bArmRot = 0.8;
           fLegRot = -0.4; // Wide stance
           bLegRot = 0.4;
       }

       if (p.isBlocking) {
          fArmRot = -2.0; // Shielding face
          bArmRot = 0.5;
          torsoRot = -0.1;
          fLegRot = -0.2;
          bLegRot = 0.2;
       }

       // --- DRAWING SKELETON WITH OUTLINES ---
       ctx.strokeStyle = 'black';
       ctx.lineWidth = 3;
       
       // Move Torso
       ctx.translate(0, torsoY);
       ctx.rotate(torsoRot);

       // ---------------- PANDA (KUNG FU MASTER) ----------------
       if (p.name === CharacterType.PANDA) {
         
         // Back Leg (Behind Body)
         ctx.save();
         ctx.translate(-5, 20); // Hip Joint
         ctx.rotate(bLegRot);
         ctx.fillStyle = cSecondary;
         ctx.beginPath(); ctx.ellipse(0, 10, 10, 15, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Foot Wraps
         ctx.fillStyle = '#ddd'; ctx.fillRect(-6, 18, 12, 5); ctx.strokeRect(-6, 18, 12, 5);
         ctx.restore();

         // Back Arm (Behind Body)
         ctx.save();
         ctx.translate(5, -5); // Shoulder Joint
         ctx.rotate(bArmRot);
         ctx.fillStyle = cSecondary;
         ctx.beginPath(); ctx.ellipse(0, 12, 9, 17, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Wrist Wraps
         ctx.fillStyle = '#ddd'; ctx.fillRect(-5, 18, 10, 8); ctx.strokeRect(-5, 18, 10, 8);
         ctx.restore();

         // Body with Gi
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.ellipse(0, 5, 26, 32, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Gi Belt
         ctx.fillStyle = cSecondary; ctx.fillRect(-24, 15, 48, 8); ctx.strokeRect(-24, 15, 48, 8);
         // Gi Lapel
         ctx.beginPath(); ctx.moveTo(-15, -20); ctx.lineTo(0, 15); ctx.lineTo(15, -20); ctx.stroke();
         
         // Head (Relative to Torso)
         ctx.save();
         ctx.translate(0, -30);
         ctx.rotate(headRot);
         
         // Flowing Headband Tails (Physics Animation)
         const tailWag = Math.sin(time * 0.2 + (p.vx * 0.5)) * 0.5;
         ctx.save();
         ctx.translate(-24, -15);
         ctx.rotate(tailWag - (p.vx * 0.1));
         ctx.fillStyle = cAccent;
         ctx.beginPath(); 
         ctx.moveTo(0, 0); 
         ctx.bezierCurveTo(-20, 5, -30, 20, -40, 10 + Math.sin(time*0.5)*10);
         ctx.lineTo(-40, 0 + Math.sin(time*0.5)*10);
         ctx.bezierCurveTo(-30, -10, -10, -5, 0, -5);
         ctx.fill(); ctx.stroke();
         ctx.restore();

         // Ears
         ctx.fillStyle = cSecondary;
         ctx.beginPath(); ctx.arc(-18, -12, 9, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.beginPath(); ctx.arc(18, -12, 9, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         
         // Head shape
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI*2); ctx.fill(); ctx.stroke();

         // Headband (Red)
         ctx.fillStyle = cAccent;
         ctx.beginPath(); ctx.rect(-25, -18, 50, 10); ctx.fill(); ctx.stroke();

         // Face
         ctx.fillStyle = cSecondary; // Patches
         // Sharper patches
         ctx.beginPath(); ctx.moveTo(-15, -6); ctx.lineTo(-4, 0); ctx.lineTo(-12, 6); ctx.fill();
         ctx.beginPath(); ctx.moveTo(15, -6); ctx.lineTo(4, 0); ctx.lineTo(12, 6); ctx.fill();
         
         ctx.fillStyle = 'white'; // Eyes
         ctx.beginPath(); ctx.arc(-9, -2, 2, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(9, -2, 2, 0, Math.PI*2); ctx.fill();
         
         ctx.fillStyle = cSecondary; // Nose
         ctx.beginPath(); ctx.ellipse(0, 8, 5, 3, 0, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(0, 12, 4, 0, Math.PI); ctx.stroke(); // Mouth

         ctx.restore(); // End Head

         // Front Leg
         ctx.save();
         ctx.translate(5, 20); // Hip Joint
         ctx.rotate(fLegRot);
         ctx.fillStyle = cSecondary;
         ctx.beginPath(); ctx.ellipse(0, 10, 10, 15, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Foot Wraps
         ctx.fillStyle = '#ddd'; ctx.fillRect(-6, 18, 12, 5); ctx.strokeRect(-6, 18, 12, 5);
         ctx.restore();

         // Front Arm
         ctx.save();
         ctx.translate(-5, -5); // Shoulder Joint
         ctx.rotate(fArmRot);
         ctx.fillStyle = cSecondary;
         ctx.beginPath(); ctx.ellipse(0, 12, 9, 17, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Wrist Wraps
         ctx.fillStyle = '#ddd'; ctx.fillRect(-5, 18, 10, 8); ctx.strokeRect(-5, 18, 10, 8);
         // Fist
         ctx.fillStyle = cPrimary; // Taped Fist
         ctx.beginPath(); ctx.arc(0, 24, 11, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.restore();

       } 
       // ---------------- BEAR (CYBER TANK) ----------------
       else {
         // Colors
         // Primary: Body
         // Secondary: Snout/Belly
         // Accent: Cyber Eye

         // Back Leg
         ctx.save();
         ctx.translate(-6, 22);
         ctx.rotate(bLegRot);
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.ellipse(0, 10, 12, 18, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Metal Shin Guard
         ctx.fillStyle = '#555'; ctx.fillRect(-8, 8, 16, 12); ctx.strokeRect(-8, 8, 16, 12);
         ctx.restore();

         // Back Arm
         ctx.save();
         ctx.translate(8, -6);
         ctx.rotate(bArmRot);
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.ellipse(0, 12, 11, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.restore();

         // Body
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.ellipse(0, 5, 30, 36, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Metal Chest Plate
         ctx.fillStyle = '#333';
         ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(20, -10); ctx.lineTo(10, 30); ctx.lineTo(-10, 30); ctx.fill(); ctx.stroke();
         ctx.fillStyle = cAccent; ctx.beginPath(); ctx.arc(0, 10, 5, 0, Math.PI*2); ctx.fill(); // Core Reactor

         // Head
         ctx.save();
         ctx.translate(0, -32);
         ctx.rotate(headRot);

         ctx.fillStyle = cPrimary; // Ears
         ctx.beginPath(); ctx.arc(-22, -14, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.fillStyle = '#555'; // Metal Ear
         ctx.beginPath(); ctx.arc(22, -14, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         
         ctx.fillStyle = cPrimary; // Head Shape
         ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         
         // Metal Jaw
         ctx.fillStyle = '#999';
         ctx.beginPath(); ctx.moveTo(-20, 5); ctx.lineTo(20, 5); ctx.lineTo(15, 25); ctx.lineTo(-15, 25); ctx.fill(); ctx.stroke();
         // Grate Lines
         ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, 25); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-10, 25); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(10, 25); ctx.stroke();

         ctx.fillStyle = 'black'; // Nose
         ctx.beginPath(); ctx.ellipse(0, 2, 7, 4, 0, 0, Math.PI*2); ctx.fill();
         
         // Eyes
         ctx.fillStyle = 'black'; // Normal Eye
         ctx.beginPath(); ctx.arc(-10, -8, 3, 0, Math.PI*2); ctx.fill();
         // Cyber Eye
         ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(10, -8, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.fillStyle = cAccent; ctx.beginPath(); ctx.arc(10, -8, 3, 0, Math.PI*2); ctx.fill();
         // Glow
         ctx.shadowColor = cAccent; ctx.shadowBlur = 10;
         ctx.beginPath(); ctx.arc(10, -8, 3, 0, Math.PI*2); ctx.fill();
         ctx.shadowBlur = 0;
         
         // Angry Brows
         ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
         ctx.beginPath(); ctx.moveTo(-18, -14); ctx.lineTo(-6, -10); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(18, -14); ctx.lineTo(6, -10); ctx.stroke();

         ctx.restore(); // End Head

         // Front Leg
         ctx.save();
         ctx.translate(6, 22);
         ctx.rotate(fLegRot);
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.ellipse(0, 10, 12, 18, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Metal Shin Guard
         ctx.fillStyle = '#555'; ctx.fillRect(-8, 8, 16, 12); ctx.strokeRect(-8, 8, 16, 12);
         ctx.restore();

         // Front Arm (Spiked)
         ctx.save();
         ctx.translate(-8, -6);
         ctx.rotate(fArmRot);
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.ellipse(0, 12, 11, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Spiked Shoulder Pad
         ctx.fillStyle = '#555';
         ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(15, -5); ctx.lineTo(0, 15); ctx.fill(); ctx.stroke();
         // Spike
         ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -15); ctx.lineTo(5, 0); ctx.fill(); ctx.stroke();
         
         // Fist
         ctx.fillStyle = cPrimary;
         ctx.beginPath(); ctx.arc(0, 28, 13, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.restore();
       }

       // Block Visual
       if (p.isBlocking) {
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.6;
          ctx.beginPath(); ctx.arc(15, 0, 45, -Math.PI/2, Math.PI/2); ctx.stroke();
          ctx.fillStyle = '#06b6d4'; ctx.globalAlpha = 0.1; ctx.fill();
          ctx.globalAlpha = 1.0;
       }
       
       // Attack Visual Swoosh
       if (p.isAttacking && p.attackCooldown > 15) {
          ctx.strokeStyle = 'white'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(45, -10, 35, -Math.PI/4, Math.PI/4); ctx.stroke();
       }

       ctx.restore();
    });

    // Particles (now with outlines for pop)
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.globalAlpha = p.life / 20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Winner Overlay
    if (winner) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      if (gameState.current.gameOver) {
         ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      
      if (Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 60px monospace';
        ctx.textAlign = 'center';
        ctx.strokeText(`${winner} WINS!`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        ctx.fillText(`${winner} WINS!`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
      }
    }
  };

  return (
    <div className="relative">
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        {/* P1 HP */}
        <div className="w-1/3">
           <div className="text-white font-bold mb-1 shadow-black drop-shadow-md text-2xl italic tracking-tighter" style={{ textShadow: '2px 2px 0 #000' }}>PANDA</div>
           <div className="h-8 w-full bg-gray-800 border-4 border-black skew-x-[-12deg] relative overflow-hidden">
             <div 
               className="h-full bg-yellow-400 transition-all duration-100" 
               style={{ width: `${(p1Hp / MAX_HP) * 100}%` }}
             />
             <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
           </div>
        </div>

        {/* VS Badge */}
        <div className="text-6xl font-black text-red-500 italic drop-shadow-lg" style={{ textShadow: '4px 4px 0 #000' }}>VS</div>

        {/* P2 HP */}
        <div className="w-1/3 flex flex-col items-end">
           <div className="text-white font-bold mb-1 shadow-black drop-shadow-md text-2xl italic tracking-tighter" style={{ textShadow: '2px 2px 0 #000' }}>BEAR</div>
           <div className="h-8 w-full bg-gray-800 border-4 border-black skew-x-[12deg] relative overflow-hidden">
             <div 
               className="h-full bg-red-600 transition-all duration-100 float-right" 
               style={{ width: `${(p2Hp / MAX_HP) * 100}%` }}
             />
             <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
           </div>
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="border-4 border-gray-900 bg-gray-900 shadow-2xl rounded-lg ring-4 ring-gray-800"
      />
    </div>
  );
};

export default Game;
